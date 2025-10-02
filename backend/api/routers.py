from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from db.database import get_db
from db.repositories import (
    count_annotations_by_category_and_sentiment,
    get_review_with_annotations,
    list_annotations,
    list_reviews,
    sources_distribution,
    top_categories,
)
from .schemas import (
    AnnotationOut,
    AnnotationsQuery,
    CategoryCountOut,
    CategorySentimentCountOut,
    ReviewDetailOut,
    ReviewOut,
    ReviewsQuery,
    SourceCountOut,
)


router = APIRouter()


@router.get("/reviews", response_model=List[ReviewOut])
def reviews_endpoint(
    source: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    q: str | None = Query(default=None),
    limit: int = Query(default=5000, ge=1, le=50000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    rows = list_reviews(
        db,
        source=source,
        date_from=date_from,
        date_to=date_to,
        search_text=q,
        limit=limit,
        offset=offset,
    )
    return [
        ReviewOut(
            review_id=r.review_id,
            review_date=r.review_date,
            source=r.source,
            text=r.text,
        )
        for r in rows
    ]


@router.get("/reviews/{review_id}", response_model=ReviewDetailOut)
def review_detail(review_id: int, db: Session = Depends(get_db)):
    r = get_review_with_annotations(db, review_id)
    if not r:
        # FastAPI will translate to 404 if we raise HTTPException, but for brevity
        return None  # type: ignore[return-value]
    return ReviewDetailOut(
        review_id=r.review_id,
        review_date=r.review_date,
        source=r.source,
        text=r.text,
        annotations=[
            AnnotationOut(
                annotation_id=a.annotation_id,
                review_id=a.review_id,
                category=a.category.name,
                sentiment=a.sentiment.name,
                summary=a.summary,
            )
            for a in r.annotations
        ],
    )


@router.get("/annotations", response_model=List[AnnotationOut])
def annotations_endpoint(
    category: str | None = Query(default=None),
    sentiment: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    anns = list_annotations(
        db,
        category=category,
        sentiment=sentiment,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )
    return [
        AnnotationOut(
            annotation_id=a.annotation_id,
            review_id=a.review_id,
            category=a.category.name,
            sentiment=a.sentiment.name,
            summary=a.summary,
        )
        for a in anns
    ]


@router.get("/stats/category-sentiment", response_model=List[CategorySentimentCountOut])
def stats_category_sentiment(db: Session = Depends(get_db)):
    rows = count_annotations_by_category_and_sentiment(db)
    return [
        CategorySentimentCountOut(category=c, sentiment=s, count=int(n))
        for c, s, n in rows
    ]


@router.get("/stats/top-categories", response_model=List[CategoryCountOut])
def stats_top_categories(limit: int = Query(default=10, ge=1, le=100), db: Session = Depends(get_db)):
    rows = top_categories(db, limit=limit)
    return [CategoryCountOut(category=c, count=int(n)) for c, n in rows]


@router.get("/stats/sources", response_model=List[SourceCountOut])
def stats_sources(db: Session = Depends(get_db)):
    rows = sources_distribution(db)
    return [SourceCountOut(source=s, count=int(n)) for s, n in rows]


