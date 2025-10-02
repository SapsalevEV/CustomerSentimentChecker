"""Category model - категории/аспекты отзывов."""
from sqlalchemy import Column, Integer, Text, TIMESTAMP
from sqlalchemy.orm import relationship

from app.db.base import Base


class Category(Base):
    """Модель категории/аспекта (Карты, Кредиты, Приложение и т.д.)."""
    
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)
    created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
    
    # Relationships
    annotations = relationship("Annotation", back_populates="category")

