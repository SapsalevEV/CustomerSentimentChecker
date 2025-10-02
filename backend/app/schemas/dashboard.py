"""Pydantic schemas for dashboard endpoints."""

from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.filters import DateRangeSchema, FiltersSchema


class MetaSchema(BaseModel):
    """Metadata for dashboard response.

    Attributes:
        date_range: Requested date range
        filters_applied: Applied filters (sources, products)
        last_updated: Timestamp when data was last updated
    """

    date_range: DateRangeSchema = Field(..., description="Requested date range")
    filters_applied: FiltersSchema = Field(..., description="Applied filters")
    last_updated: datetime = Field(..., description="Last data update timestamp")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "date_range": {
                        "from": "2025-01-01T00:00:00Z",
                        "to": "2025-01-31T23:59:59Z",
                    },
                    "filters_applied": {
                        "sources": ["banki-ru"],
                        "products": ["credit-cards"],
                    },
                    "last_updated": "2025-10-01T15:30:00Z",
                }
            ]
        }
    }


class TrendSchema(BaseModel):
    """Trend data comparing current period with previous period.

    Attributes:
        direction: Trend direction ("up" or "down")
        change: Absolute change value (always positive)
        change_percent: Percentage change (always positive, direction shows sign)
    """

    direction: Literal["up", "down"] = Field(..., description="Trend direction")
    change: int = Field(..., ge=0, description="Absolute change value")
    change_percent: int = Field(..., ge=0, description="Percentage change")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"direction": "up", "change": 245, "change_percent": 9},
                {"direction": "down", "change": 42, "change_percent": 6},
            ]
        }
    }


class MetricSchema(BaseModel):
    """Single metric with trend and sparkline data.

    Attributes:
        current: Current period value
        percentage: Percentage of total (only for sentiment metrics)
        trend: Trend comparison with previous period
        sparkline: Array of 7 values for last 7 days
    """

    current: int = Field(..., ge=0, description="Current period value")
    percentage: Optional[int] = Field(
        None, ge=0, le=100, description="Percentage of total (for sentiment metrics)"
    )
    trend: TrendSchema = Field(..., description="Trend data")
    sparkline: List[int] = Field(
        ..., min_length=7, max_length=7, description="Last 7 days data"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "current": 2847,
                    "trend": {"direction": "up", "change": 245, "change_percent": 9},
                    "sparkline": [2420, 2505, 2610, 2680, 2750, 2805, 2847],
                },
                {
                    "current": 1936,
                    "percentage": 68,
                    "trend": {"direction": "up", "change": 156, "change_percent": 8},
                    "sparkline": [1650, 1705, 1780, 1825, 1880, 1910, 1936],
                },
            ]
        }
    }


class MetricsSchema(BaseModel):
    """All metrics for dashboard overview.

    Attributes:
        total_reviews: Total number of reviews
        positive_reviews: Number of positive reviews with percentage
        neutral_reviews: Number of neutral reviews with percentage
        negative_reviews: Number of negative reviews with percentage
    """

    total_reviews: MetricSchema = Field(..., description="Total reviews metric")
    positive_reviews: MetricSchema = Field(..., description="Positive reviews metric")
    neutral_reviews: MetricSchema = Field(..., description="Neutral reviews metric")
    negative_reviews: MetricSchema = Field(..., description="Negative reviews metric")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "total_reviews": {
                        "current": 2847,
                        "trend": {
                            "direction": "up",
                            "change": 245,
                            "change_percent": 9,
                        },
                        "sparkline": [2420, 2505, 2610, 2680, 2750, 2805, 2847],
                    },
                    "positive_reviews": {
                        "current": 1936,
                        "percentage": 68,
                        "trend": {
                            "direction": "up",
                            "change": 156,
                            "change_percent": 8,
                        },
                        "sparkline": [1650, 1705, 1780, 1825, 1880, 1910, 1936],
                    },
                    "neutral_reviews": {
                        "current": 684,
                        "percentage": 24,
                        "trend": {
                            "direction": "down",
                            "change": 42,
                            "change_percent": 6,
                        },
                        "sparkline": [726, 720, 708, 695, 690, 687, 684],
                    },
                    "negative_reviews": {
                        "current": 227,
                        "percentage": 8,
                        "trend": {
                            "direction": "up",
                            "change": 18,
                            "change_percent": 8,
                        },
                        "sparkline": [209, 212, 215, 218, 221, 224, 227],
                    },
                }
            ]
        }
    }


class SentimentDynamicsSchema(BaseModel):
    """Sentiment dynamics for a single day.

    Attributes:
        date: Date in ISO format (YYYY-MM-DD)
        positive: Percentage of positive reviews (0-100)
        neutral: Percentage of neutral reviews (0-100)
        negative: Percentage of negative reviews (0-100)
        topics: Optional top-3 topics for the day

    Note:
        positive + neutral + negative must sum to 100
    """

    date: str = Field(..., description="Date in ISO format (YYYY-MM-DD)")
    positive: int = Field(..., ge=0, le=100, description="Positive percentage")
    neutral: int = Field(..., ge=0, le=100, description="Neutral percentage")
    negative: int = Field(..., ge=0, le=100, description="Negative percentage")
    topics: Optional[List[str]] = Field(
        None, max_length=3, description="Top-3 topics for the day"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "date": "2025-01-01",
                    "positive": 67,
                    "neutral": 25,
                    "negative": 8,
                    "topics": [
                        "мобильное приложение",
                        "скорость обслуживания",
                        "кэшбэк",
                    ],
                },
                {
                    "date": "2025-01-02",
                    "positive": 69,
                    "neutral": 23,
                    "negative": 8,
                    "topics": ["интерфейс", "поддержка", "переводы"],
                },
            ]
        }
    }


class OverviewResponse(BaseModel):
    """Complete overview response for dashboard.

    Attributes:
        meta: Metadata about the request and data
        metrics: All review metrics with trends and sparklines
        sentiment_dynamics: Daily sentiment distribution with top topics
    """

    meta: MetaSchema = Field(..., description="Response metadata")
    metrics: MetricsSchema = Field(..., description="All metrics")
    sentiment_dynamics: List[SentimentDynamicsSchema] = Field(
        ..., description="Daily sentiment dynamics"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "meta": {
                        "date_range": {
                            "from": "2025-01-01T00:00:00Z",
                            "to": "2025-01-31T23:59:59Z",
                        },
                        "filters_applied": {
                            "sources": ["banki-ru"],
                            "products": ["credit-cards"],
                        },
                        "last_updated": "2025-10-01T15:30:00Z",
                    },
                    "metrics": {
                        "total_reviews": {
                            "current": 2847,
                            "trend": {
                                "direction": "up",
                                "change": 245,
                                "change_percent": 9,
                            },
                            "sparkline": [2420, 2505, 2610, 2680, 2750, 2805, 2847],
                        },
                        "positive_reviews": {
                            "current": 1936,
                            "percentage": 68,
                            "trend": {
                                "direction": "up",
                                "change": 156,
                                "change_percent": 8,
                            },
                            "sparkline": [1650, 1705, 1780, 1825, 1880, 1910, 1936],
                        },
                        "neutral_reviews": {
                            "current": 684,
                            "percentage": 24,
                            "trend": {
                                "direction": "down",
                                "change": 42,
                                "change_percent": 6,
                            },
                            "sparkline": [726, 720, 708, 695, 690, 687, 684],
                        },
                        "negative_reviews": {
                            "current": 227,
                            "percentage": 8,
                            "trend": {
                                "direction": "up",
                                "change": 18,
                                "change_percent": 8,
                            },
                            "sparkline": [209, 212, 215, 218, 221, 224, 227],
                        },
                    },
                    "sentiment_dynamics": [
                        {
                            "date": "2025-01-01",
                            "positive": 67,
                            "neutral": 25,
                            "negative": 8,
                            "topics": [
                                "мобильное приложение",
                                "скорость обслуживания",
                                "кэшбэк",
                            ],
                        },
                        {
                            "date": "2025-01-02",
                            "positive": 69,
                            "neutral": 23,
                            "negative": 8,
                            "topics": ["интерфейс", "поддержка", "переводы"],
                        },
                    ],
                }
            ]
        }
    }
