"""Pydantic schemas for filter parameters."""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class DateRangeSchema(BaseModel):
    """Date range for filtering data.

    Attributes:
        from_: Start date (inclusive)
        to: End date (inclusive)
    """

    from_: datetime = Field(..., alias="from", description="Start date (ISO 8601)")
    to: datetime = Field(..., description="End date (ISO 8601)")

    @field_validator("to")
    @classmethod
    def validate_date_range(cls, v: datetime, info) -> datetime:
        """Validate that 'to' date is not before 'from' date.

        Args:
            v: The 'to' date value
            info: Validation info containing other field values

        Returns:
            Validated 'to' date

        Raises:
            ValueError: If 'to' date is before 'from' date
        """
        from_date = info.data.get("from_")
        if from_date and v < from_date:
            raise ValueError("'to' date must be after or equal to 'from' date")
        return v

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "examples": [
                {
                    "from": "2025-01-01T00:00:00Z",
                    "to": "2025-01-31T23:59:59Z",
                }
            ]
        },
    }


class FiltersSchema(BaseModel):
    """Filter parameters for dashboard queries.

    Empty arrays mean "all" - no filtering applied.

    Attributes:
        sources: List of source identifiers (e.g., ["banki-ru", "sravni-ru"])
        products: List of product identifiers (e.g., ["credit-cards", "mobile-app"])
    """

    sources: List[str] = Field(
        default_factory=list,
        description="Source filters (empty = all sources)",
    )
    products: List[str] = Field(
        default_factory=list,
        description="Product filters (empty = all products)",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "sources": ["banki-ru", "sravni-ru"],
                    "products": ["credit-cards", "mobile-app"],
                },
                {
                    "sources": [],
                    "products": [],
                },
            ]
        }
    }


class OverviewRequest(BaseModel):
    """Request body for POST /api/dashboard/overview endpoint.

    Attributes:
        date_range: Date range for filtering
        filters: Additional filters (sources, products)
    """

    date_range: DateRangeSchema = Field(..., description="Date range filter")
    filters: FiltersSchema = Field(
        default_factory=FiltersSchema,
        description="Additional filters (sources, products)",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "date_range": {
                        "from": "2025-01-01T00:00:00Z",
                        "to": "2025-01-31T23:59:59Z",
                    },
                    "filters": {
                        "sources": ["banki-ru"],
                        "products": ["credit-cards"],
                    },
                }
            ]
        }
    }
