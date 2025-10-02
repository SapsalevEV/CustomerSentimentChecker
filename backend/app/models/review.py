"""Review model - отзывы клиентов."""
from sqlalchemy import Column, Integer, Text, Date, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class Review(Base):
    """Модель отзыва клиента."""
    
    __tablename__ = "reviews"
    
    # ⚠️ Primary key is review_id, not id!
    review_id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False)
    text = Column(Text, nullable=False)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
    
    # Relationships
    source = relationship("Source", back_populates="reviews")
    annotations = relationship(
        "Annotation",
        back_populates="review",
        cascade="all, delete-orphan"
    )

