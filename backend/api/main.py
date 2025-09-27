from __future__ import annotations

from fastapi import FastAPI
from .routers import router


def create_app() -> FastAPI:
    app = FastAPI(title="Database Sentiment API")
    app.include_router(router, prefix="/api")
    return app


app = create_app()


