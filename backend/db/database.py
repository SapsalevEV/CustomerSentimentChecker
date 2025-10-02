from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path
from typing import Generator, Optional

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker


def _default_db_path() -> Path:
    """Return absolute path to the default SQLite DB file.

    DB is expected at project_root/reviews.db
    """
    # db/database.py -> .../db -> project root
    return Path(__file__).resolve().parents[1] / "reviews.db"


def create_sqlite_engine(db_path: Optional[Path] = None) -> Engine:
    """Create a SQLAlchemy Engine for the SQLite database.

    Args:
        db_path: Optional explicit DB path; defaults to project `reviews.db`.

    Returns:
        Engine: configured SQLAlchemy engine.
    """
    path = (db_path or _default_db_path()).resolve()
    db_url = f"sqlite:///{path.as_posix()}"
    return create_engine(
        db_url,
        future=True,
        connect_args={"check_same_thread": False},
    )


# Default, module-level engine and session factory
engine: Engine = create_sqlite_engine()
SessionLocal: sessionmaker[Session] = sessionmaker(
    bind=engine, autoflush=False, autocommit=False, future=True
)


@contextmanager
def get_session() -> Generator[Session, None, None]:
    """Context-managed session for scripts and services.

    Yields:
        Session: active SQLAlchemy session.
    """
    session: Session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def get_db() -> Generator[Session, None, None]:
    """FastAPI-friendly dependency that yields a session and closes it.

    Yields:
        Session: active SQLAlchemy session.
    """
    session: Session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


