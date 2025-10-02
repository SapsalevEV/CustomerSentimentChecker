"""Main FastAPI application."""
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict, Any

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1 import config, dashboard
from app.api.deps import get_db
from app.core.config import settings
from app.core.exceptions import ApplicationException
from app.core.logging import configure_logging, logger
from app.db.session import init_db
from app.middleware.error_handler import application_exception_handler
from app.middleware.logging_middleware import LoggingMiddleware
from app.utils.db_health import (
    check_database_health,
    verify_database_schema,
    get_database_stats,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for startup and shutdown events.

    Args:
        app: FastAPI application instance

    Yields:
        None
    """
    # Startup
    configure_logging()
    logger.info("application_starting", version=settings.VERSION)

    # Initialize database connection
    await init_db()
    logger.info("database_initialized")

    # Verify database schema on startup
    # This will fail fast if database is missing or corrupted
    try:
        from app.db.session import async_session_factory

        async with async_session_factory() as session:
            await verify_database_schema(session)
        logger.info("database_schema_verification_completed")
    except Exception as e:
        logger.error(
            "database_schema_verification_failed_on_startup",
            error=str(e),
            exc_info=True,
        )
        # In production, we want to fail fast if database is invalid
        if settings.ENVIRONMENT == "production":
            raise
        else:
            # In development, just log the warning and continue
            logger.warning("continuing_without_valid_database_schema")

    yield

    # Shutdown
    logger.info("application_shutting_down")
    # Add cleanup logic here if needed


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(LoggingMiddleware)

# Exception handlers
app.add_exception_handler(ApplicationException, application_exception_handler)


@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint.

    Returns:
        dict: Health status and version
    """
    return {"status": "healthy", "version": settings.VERSION}


@app.get("/health/database")
async def database_health_check(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Database health check endpoint.

    Returns comprehensive database health information including:
    - Table existence check
    - Row counts
    - Database statistics

    Args:
        db: Database session (injected via Depends)

    Returns:
        dict: Database health status and statistics
    """
    health = await check_database_health(db)
    stats = await get_database_stats(db)

    return {
        "healthy": health["healthy"],
        "tables": {
            "exist": health["tables_exist"],
            "missing": health["missing_tables"],
        },
        "views": health["views_exist"],
        "row_counts": health["row_counts"],
        "statistics": stats,
        "error": health.get("error"),
    }


# Include API routers
app.include_router(config.router, prefix="/api", tags=["Configuration"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])

