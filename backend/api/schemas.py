from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class ReviewOut(BaseModel):
    review_id: int
    date: str = Field(alias="review_date")
    source: str
    text: str

    class Config:
        populate_by_name = True


class AnnotationOut(BaseModel):
    annotation_id: int
    review_id: int
    category: str
    sentiment: str
    summary: str


class ReviewDetailOut(BaseModel):
    review_id: int
    date: str = Field(alias="review_date")
    source: str
    text: str
    annotations: List[AnnotationOut]

    class Config:
        populate_by_name = True


class ReviewsQuery(BaseModel):
    source: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    q: Optional[str] = None
    limit: int = 50
    offset: int = 0


class AnnotationsQuery(BaseModel):
    category: Optional[str] = None
    sentiment: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    limit: int = 100
    offset: int = 0


class CategorySentimentCountOut(BaseModel):
    category: str
    sentiment: str
    count: int


class CategoryCountOut(BaseModel):
    category: str
    count: int


class SourceCountOut(BaseModel):
    source: str
    count: int


