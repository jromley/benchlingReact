import time
import uuid
from collections import defaultdict
from pathlib import Path

import anthropic
import boto3
from botocore.exceptions import ClientError
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import text

from app.config import settings
from app.db import engine

app = FastAPI(title="benchling-react backend")
storage_dir = Path(settings.pdf_storage_dir)
storage_dir.mkdir(parents=True, exist_ok=True)
ses_client = boto3.client("ses", region_name=settings.ses_region)
anthropic_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
chat_request_log: dict[str, list[float]] = defaultdict(list)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/db-check")
def db_check():
    with engine.connect() as conn:
        version = conn.execute(text("SELECT version()")).scalar_one()
    return {"postgres_version": version}


@app.get("/helloworld")
def helloworld():
    with engine.connect() as conn:
        message = conn.execute(text("SELECT message FROM test LIMIT 1")).scalar_one()
    return {"message": message}


@app.post("/documents")
def upload_document(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    stored_filename = f"{uuid.uuid4()}.pdf"
    with open(storage_dir / stored_filename, "wb") as f:
        f.write(file.file.read())

    with engine.begin() as conn:
        doc_id = conn.execute(
            text(
                "INSERT INTO documents (filename, stored_filename) "
                "VALUES (:filename, :stored_filename) RETURNING id"
            ),
            {"filename": file.filename, "stored_filename": stored_filename},
        ).scalar_one()

    return {"id": doc_id, "filename": file.filename}


@app.get("/documents")
def list_documents():
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT id, filename, uploaded_at FROM documents ORDER BY uploaded_at DESC")
        ).mappings().all()
    return [dict(row) for row in rows]


@app.get("/documents/{doc_id}/file")
def get_document_file(doc_id: int, download: bool = False):
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT filename, stored_filename FROM documents WHERE id = :id"),
            {"id": doc_id},
        ).mappings().one_or_none()

    if row is None:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = storage_dir / row["stored_filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File missing on disk")

    if download:
        return FileResponse(file_path, media_type="application/pdf", filename=row["filename"])

    return FileResponse(
        file_path,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline"},
    )


class ContactRequest(BaseModel):
    email: EmailStr
    message: str


@app.post("/contact")
def submit_contact_form(form: ContactRequest):
    if not form.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        ses_client.send_email(
            Source=settings.contact_recipient_email,
            Destination={"ToAddresses": [settings.contact_recipient_email]},
            Message={
                "Subject": {"Data": f"New contact form message from {form.email}"},
                "Body": {"Text": {"Data": form.message}},
            },
            ReplyToAddresses=[form.email],
        )
    except ClientError as e:
        raise HTTPException(status_code=502, detail="Failed to send message") from e

    return {"status": "sent"}


@app.get("/news")
def list_news(limit: int = 20):
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                "SELECT title, link, source, published_at FROM news_articles "
                "ORDER BY published_at DESC NULLS LAST LIMIT :limit"
            ),
            {"limit": limit},
        ).mappings().all()
    return [dict(row) for row in rows]


CHAT_SYSTEM_PROMPT = """You are a helpful assistant on Josh Romley's personal portfolio website,
talking to a visitor who may be a potential employer, client, or collaborator. Your job is to:
1. Answer questions about Josh's background and experience, and
2. Help the visitor understand how Josh could help them, based on what they're looking for.

Josh's background:
Josh is a software engineer with a BS in Computer Science from Drexel University, concentrated in
AI and Human-Computer Interaction. He completed Cogent University's professional Java development
course and holds an AWS Certified Developer certification. He's worked at Comcast, SAS, Axis
Technology, Zift, and ReverbNation, primarily in Java, with experience in Python, various
JavaScript stacks, Bash, PowerShell, C#, and Dart/Flutter. He built and published the iOS/Android
app "Blue Skies" for the non-profit Project Refit, and enjoys mentoring other engineers. Outside of
work he's an avid traveler, backpacker, and surfer, raised over 100,000 chickens, and is a
published poet featured in "Poems for Writing Prompts, 2nd Ed."

Keep responses concise (2-4 sentences). Stay strictly on topic: Josh's background, skills,
experience, and how he could help the visitor with their project, role, or team. If asked about
anything else (general knowledge, unrelated tasks, etc.), politely decline and redirect back to
Josh's background or ask what the visitor is looking for so you can connect it to his experience."""

CHAT_MODEL = "claude-haiku-4-5-20251001"
CHAT_MAX_TOKENS = 300


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


def check_rate_limit(client_ip: str):
    now = time.time()
    window_start = now - 3600
    recent = [t for t in chat_request_log[client_ip] if t > window_start]
    chat_request_log[client_ip] = recent

    if len(recent) >= settings.chat_rate_limit_per_hour:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")

    recent.append(now)


@app.post("/chat")
def chat(req: ChatRequest, request: Request):
    client_ip = request.headers.get("x-real-ip", request.client.host if request.client else "unknown")
    check_rate_limit(client_ip)

    if not req.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    try:
        response = anthropic_client.messages.create(
            model=CHAT_MODEL,
            max_tokens=CHAT_MAX_TOKENS,
            system=CHAT_SYSTEM_PROMPT,
            messages=[{"role": m.role, "content": m.content} for m in req.messages[-10:]],
        )
    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail="Chat request failed") from e

    return {"reply": response.content[0].text}
