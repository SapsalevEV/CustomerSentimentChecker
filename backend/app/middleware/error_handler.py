"""Global error handling middleware."""
from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.exceptions import ApplicationException
from app.core.logging import logger


async def application_exception_handler(
    request: Request,
    exc: ApplicationException
) -> JSONResponse:
    """Handle application exceptions globally.
    
    Args:
        request: HTTP request
        exc: Application exception
        
    Returns:
        JSONResponse: Error response
    """
    logger.error(
        "application_error",
        error=exc.message,
        status_code=exc.status_code,
        path=request.url.path
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "status_code": exc.status_code,
            "path": request.url.path
        }
    )

