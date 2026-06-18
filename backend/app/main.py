from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text

from app.config import settings

app = FastAPI(title="benchling-react backend")
engine = create_engine(settings.database_url)

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
