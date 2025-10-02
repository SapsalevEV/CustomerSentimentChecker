"""Base repository with generic CRUD operations."""

from typing import Generic, TypeVar, Type, Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository class with common CRUD operations.

    Args:
        model: SQLAlchemy model class
        db: AsyncSession instance
    """

    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, id: int) -> Optional[ModelType]:
        """Get a single record by ID.

        Args:
            id: Primary key value

        Returns:
            Model instance or None if not found
        """
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Get all records with pagination.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of model instances
        """
        result = await self.db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, obj_in: dict) -> ModelType:
        """Create a new record.

        Args:
            obj_in: Dictionary with model attributes

        Returns:
            Created model instance
        """
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(self, id: int, obj_in: dict) -> Optional[ModelType]:
        """Update an existing record.

        Args:
            id: Primary key value
            obj_in: Dictionary with updated attributes

        Returns:
            Updated model instance or None if not found
        """
        db_obj = await self.get_by_id(id)
        if db_obj is None:
            return None

        for field, value in obj_in.items():
            setattr(db_obj, field, value)

        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def delete(self, id: int) -> bool:
        """Delete a record by ID.

        Args:
            id: Primary key value

        Returns:
            True if deleted, False if not found
        """
        db_obj = await self.get_by_id(id)
        if db_obj is None:
            return False

        await self.db.delete(db_obj)
        await self.db.commit()
        return True
