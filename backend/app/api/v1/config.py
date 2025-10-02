"""API router for configuration endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_config_service
from app.schemas.config import ConfigResponse
from app.services.config_service import ConfigService

router = APIRouter()


@router.get(
    "/config",
    response_model=ConfigResponse,
    summary="Get configuration data",
    description="""
    Returns reference data needed for frontend filters and dropdowns.

    Includes:
    - **Sources**: Available review sources (from database)
    - **Products**: Virtual product groupings (credit-cards, mobile-app, etc.)
    - **Date presets**: Predefined date range options

    This endpoint is typically called once on application load and cached.
    """,
    responses={
        200: {
            "description": "Configuration data successfully retrieved",
            "content": {
                "application/json": {
                    "example": {
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
                        ],
                    }
                }
            },
        },
        500: {
            "description": "Internal server error",
        },
    },
    tags=["Configuration"],
)
async def get_config(
    db: AsyncSession = Depends(get_db),
    service: ConfigService = Depends(get_config_service),
) -> ConfigResponse:
    """Get configuration data for frontend.

    Args:
        db: Database session (injected)
        service: ConfigService instance (injected)

    Returns:
        ConfigResponse with sources, products, and date presets
    """
    config = await service.get_configuration()
    return config
