"""Request logging middleware."""
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging HTTP requests and responses."""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request and log details.
        
        Args:
            request: Incoming HTTP request
            call_next: Next middleware/handler in chain
            
        Returns:
            Response: HTTP response
        """
        start_time = time.time()
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        logger.info(
            "request_processed",
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            process_time_ms=round(process_time * 1000, 2)
        )
        
        return response

