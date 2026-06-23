import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, text

from app.config import settings

app = FastAPI(title="benchling-react backend")
engine = create_engine(settings.database_url)
storage_dir = Path(settings.pdf_storage_dir)
storage_dir.mkdir(parents=True, exist_ok=True)

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
