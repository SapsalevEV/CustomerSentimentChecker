"""Sentiment model - тональности отзывов."""
from sqlalchemy import Column, Integer, Text, TIMESTAMP
from sqlalchemy.orm import relationship

from app.db.base import Base


class Sentiment(Base):
    """Модель тональности (позитив, негатив, нейтральный)."""
    
    __tablename__ = "sentiments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)
    created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
    
    # Relationships
    annotations = relationship("Annotation", back_populates="sentiment")

