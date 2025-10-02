"""FastAPI dependencies for dependency injection."""

from typing import AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_factory
from app.repositories.config_repository import ConfigRepository
from app.repositories.dashboard_repository import DashboardRepository
from app.services.config_service import ConfigService
from app.services.dashboard_service import DashboardService


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session.

    Yields:
        AsyncSession instance

    Note:
        Session is automatically closed after request completion.
    """
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_config_repository(
    db: AsyncSession = Depends(get_db),
) -> ConfigRepository:
    """Dependency for getting ConfigRepository instance.

    Args:
        db: Database session (injected by FastAPI via Depends)

    Returns:
        ConfigRepository instance

    Note:
        This is a factory function that creates a new repository instance
        for each request with the database session from get_db.
    """
    return ConfigRepository(db)


async def get_config_service(
    db: AsyncSession = Depends(get_db),
) -> ConfigService:
    """Dependency for getting ConfigService instance.

    Args:
        db: Database session (injected by FastAPI via Depends)

    Returns:
        ConfigService instance

    Note:
        This is a factory function that creates a new service instance
        for each request. The repository is automatically created with the
        provided database session.
    """
    repository = ConfigRepository(db)
    return ConfigService(repository)


async def get_dashboard_repository(
    db: AsyncSession = Depends(get_db),
) -> DashboardRepository:
    """Dependency for getting DashboardRepository instance.

    Args:
        db: Database session (injected by FastAPI via Depends)

    Returns:
        DashboardRepository instance

    Note:
        This is a factory function that creates a new repository instance
        for each request with the database session from get_db.
    """
    return DashboardRepository(db)


async def get_dashboard_service(
    db: AsyncSession = Depends(get_db),
) -> DashboardService:
    """Dependency for getting DashboardService instance.

    Args:
        db: Database session (injected by FastAPI via Depends)

    Returns:
        DashboardService instance

    Note:
        This is a factory function that creates a new service instance
        for each request. The repository is automatically created with the
        provided database session.
    """
    repository = DashboardRepository(db)
    return DashboardService(repository)
