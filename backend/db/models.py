from __future__ import annotations

from typing import List

from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Review(Base):
    __tablename__ = "reviews"

    review_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    date_raw: Mapped[str] = mapped_column(String, nullable=False)
    review_date: Mapped[str] = mapped_column(String, nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False)

    annotations: Mapped[List["Annotation"]] = relationship(
        back_populates="review", cascade="all, delete-orphan"
    )


class Category(Base):
    __tablename__ = "categories"

    category_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    annotations: Mapped[List["Annotation"]] = relationship(back_populates="category")


class Sentiment(Base):
    __tablename__ = "sentiments"

    sentiment_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    annotations: Mapped[List["Annotation"]] = relationship(back_populates="sentiment")


class Annotation(Base):
    __tablename__ = "annotations"

    annotation_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    review_id: Mapped[int] = mapped_column(ForeignKey("reviews.review_id"), nullable=False)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.category_id"), nullable=False
    )
    sentiment_id: Mapped[int] = mapped_column(
        ForeignKey("sentiments.sentiment_id"), nullable=False
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)

    review: Mapped[Review] = relationship(back_populates="annotations")
    category: Mapped[Category] = relationship(back_populates="annotations")
    sentiment: Mapped[Sentiment] = relationship(back_populates="annotations")


