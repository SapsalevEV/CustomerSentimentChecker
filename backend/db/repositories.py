from __future__ import annotations

from typing import Iterable, List, Optional, Tuple

from sqlalchemy import Select, and_, func, select
from sqlalchemy.orm import Session, selectinload

from .models import Annotation, Category, Review, Sentiment


def list_reviews(
    session: Session,
    *,
    source: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search_text: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Review]:
    """List reviews with optional filters and pagination.

    Dates are ISO strings yyyy-mm-dd (as stored in review_date).
    """
    filters = []
    if source:
        filters.append(Review.source == source)
    if date_from:
        filters.append(Review.review_date >= date_from)
    if date_to:
        filters.append(Review.review_date <= date_to)
    if search_text:
        like = f"%{search_text}%"
        filters.append(Review.text.like(like))

    stmt: Select[Tuple[Review]] = select(Review).order_by(Review.review_id)
    if filters:
        stmt = stmt.where(and_(*filters))
    stmt = stmt.limit(limit).offset(offset)
    return list(session.scalars(stmt))


def get_review_with_annotations(session: Session, review_id: int) -> Optional[Review]:
    """Fetch single review and its annotations."""
    stmt = (
        select(Review)
        .options(
            selectinload(Review.annotations)
            .selectinload(Annotation.category),
            selectinload(Review.annotations)
            .selectinload(Annotation.sentiment),
        )
        .where(Review.review_id == review_id)
    )
    return session.scalars(stmt).first()


def count_annotations_by_category_and_sentiment(
    session: Session,
) -> List[Tuple[str, str, int]]:
    """Return (category, sentiment, count) aggregated view."""
    stmt = (
        select(Category.name, Sentiment.name, func.count(Annotation.annotation_id))
        .join(Annotation, Annotation.category_id == Category.category_id)
        .join(Sentiment, Sentiment.sentiment_id == Annotation.sentiment_id)
        .group_by(Category.name, Sentiment.name)
        .order_by(Category.name, Sentiment.name)
    )
    return [tuple(row) for row in session.execute(stmt).all()]


def list_annotations(
    session: Session,
    *,
    category: Optional[str] = None,
    sentiment: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[Annotation]:
    """List annotations with optional filters and pagination."""
    stmt = (
        select(Annotation)
        .join(Review, Review.review_id == Annotation.review_id)
        .join(Category, Category.category_id == Annotation.category_id)
        .join(Sentiment, Sentiment.sentiment_id == Annotation.sentiment_id)
        .order_by(Annotation.annotation_id)
    )

    conditions = []
    if category:
        conditions.append(Category.name == category)
    if sentiment:
        conditions.append(Sentiment.name == sentiment)
    if date_from:
        conditions.append(Review.review_date >= date_from)
    if date_to:
        conditions.append(Review.review_date <= date_to)
    if conditions:
        stmt = stmt.where(and_(*conditions))

    stmt = stmt.limit(limit).offset(offset)
    return list(session.scalars(stmt))


def top_categories(
    session: Session, *, limit: int = 10
) -> List[Tuple[str, int]]:
    """Return top categories by number of annotations."""
    stmt = (
        select(Category.name, func.count(Annotation.annotation_id))
        .join(Annotation, Annotation.category_id == Category.category_id)
        .group_by(Category.category_id)
        .order_by(func.count(Annotation.annotation_id).desc(), Category.name)
        .limit(limit)
    )
    return [tuple(row) for row in session.execute(stmt).all()]


def sources_distribution(session: Session) -> List[Tuple[str, int]]:
    """Return distribution of reviews by source."""
    stmt = select(Review.source, func.count(Review.review_id)).group_by(Review.source)
    return [tuple(row) for row in session.execute(stmt).all()]


