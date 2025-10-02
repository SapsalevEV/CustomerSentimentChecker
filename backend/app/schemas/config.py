"""Pydantic schemas for configuration endpoints."""

from typing import List, Optional
from pydantic import BaseModel, Field


class SourceSchema(BaseModel):
    """Schema for a single source (e.g., Banki.ru, Sravni.ru).

    Attributes:
        value: API identifier (kebab-case, e.g., "banki-ru")
        label: Human-readable name (e.g., "Banki.ru")
    """

    value: str = Field(..., description="Source API identifier")
    label: str = Field(..., description="Human-readable source name")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"value": "banki-ru", "label": "Banki.ru"},
                {"value": "sravni-ru", "label": "Sravni.ru"},
            ]
        }
    }


class ProductSchema(BaseModel):
    """Schema for a single product.

    Products are virtual groupings of database categories.

    Attributes:
        value: API identifier (kebab-case, e.g., "credit-cards")
        label: Human-readable name (e.g., "Кредитные карты")
        category: Product category group (e.g., "Banking", "Digital")
    """

    value: str = Field(..., description="Product API identifier")
    label: str = Field(..., description="Human-readable product name")
    category: str = Field(..., description="Product category group")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "value": "credit-cards",
                    "label": "Кредитные карты",
                    "category": "Banking",
                }
            ]
        }
    }


class DatePresetSchema(BaseModel):
    """Schema for predefined date range presets.

    Attributes:
        label: Preset display name (e.g., "Last 7 days")
        days: Number of days in the preset
    """

    label: str = Field(..., description="Preset display name")
    days: int = Field(..., description="Number of days", gt=0)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"label": "Последние 7 дней", "days": 7},
                {"label": "Последние 30 дней", "days": 30},
            ]
        }
    }


class ConfigResponse(BaseModel):
    """Complete configuration response for frontend.

    Contains all reference data needed for filters and dropdowns.

    Attributes:
        sources: List of available review sources
        products: List of available products (virtual groupings)
        date_presets: Optional list of predefined date range presets
    """

    sources: List[SourceSchema] = Field(
        ..., description="Available review sources"
    )
    products: List[ProductSchema] = Field(
        ..., description="Available products (virtual category groupings)"
    )
    date_presets: Optional[List[DatePresetSchema]] = Field(
        default=None, description="Predefined date range presets"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "sources": [
                        {"value": "banki-ru", "label": "Banki.ru"},
                        {"value": "sravni-ru", "label": "Sravni.ru"},
                    ],
                    "products": [
                        {
                            "value": "credit-cards",
                            "label": "Кредитные карты",
                            "category": "Banking",
                        },
                        {
                            "value": "mobile-app",
                            "label": "Мобильное приложение",
                            "category": "Digital",
                        },
                    ],
                    "date_presets": [
                        {"label": "Последние 7 дней", "days": 7},
                        {"label": "Последние 30 дней", "days": 30},
                        {"label": "Последние 90 дней", "days": 90},
                    ],
                }
            ]
        }
    }
