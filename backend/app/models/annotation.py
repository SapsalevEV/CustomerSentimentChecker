"""Annotation model - аннотации отзывов."""
from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class Annotation(Base):
    """Модель аннотации - связь отзыва с категорией и тональностью."""
    
    __tablename__ = "annotations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    review_id = Column(
        Integer,
        ForeignKey("reviews.review_id"),
        nullable=False
    )
    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=False
    )
    sentiment_id = Column(
        Integer,
        ForeignKey("sentiments.id"),
        nullable=False
    )
    summary = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
    
    # Relationships
    review = relationship("Review", back_populates="annotations")
    category = relationship("Category", back_populates="annotations")
    sentiment = relationship("Sentiment", back_populates="annotations")

