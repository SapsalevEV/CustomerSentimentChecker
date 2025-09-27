from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from backend.routes import router
import logging

logger = logging.getLogger(__name__)

def create_app():
    app = FastAPI(title="Review Analysis API")

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unexpected error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"predictions": [], "errors": "Internal error"}
        )

    return app