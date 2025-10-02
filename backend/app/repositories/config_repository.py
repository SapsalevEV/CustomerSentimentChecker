"""Repository for configuration data (sources, categories)."""

from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.source import Source
from app.models.category import Category
from app.repositories.base import BaseRepository


class ConfigRepository(BaseRepository[Source]):
    """Repository for fetching configuration data.

    Provides methods to retrieve reference data like sources and categories.
    """

    def __init__(self, db: AsyncSession):
        super().__init__(Source, db)

    async def get_all_sources(self) -> List[Source]:
        """Get all sources from database.

        Returns:
            List of Source instances
        """
        result = await self.db.execute(
            select(Source).order_by(Source.name)
        )
        return list(result.scalars().all())

    async def get_all_categories(self) -> List[Category]:
        """Get all categories from database.

        Returns:
            List of Category instances
        """
        result = await self.db.execute(
            select(Category).order_by(Category.name)
        )
        return list(result.scalars().all())

    async def get_source_by_name(self, name: str) -> Source:
        """Get a source by its name.

        Args:
            name: Source name (e.g., "Banki.ru")

        Returns:
            Source instance or None if not found
        """
        result = await self.db.execute(
            select(Source).where(Source.name == name)
        )
        return result.scalar_one_or_none()

    async def get_category_by_name(self, name: str) -> Category:
        """Get a category by its name.

        Args:
            name: Category name (e.g., "Карты")

        Returns:
            Category instance or None if not found
        """
        result = await self.db.execute(
            select(Category).where(Category.name == name)
        )
        return result.scalar_one_or_none()
