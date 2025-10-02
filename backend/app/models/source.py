"""Source model - источники отзывов."""
from sqlalchemy import Column, Integer, Text, TIMESTAMP
from sqlalchemy.orm import relationship

from app.db.base import Base


class Source(Base):
    """Модель источника отзывов (Banki.ru, Sravni.ru)."""
    
    __tablename__ = "sources"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)
    created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
    
    # Relationships
    reviews = relationship("Review", back_populates="source")

