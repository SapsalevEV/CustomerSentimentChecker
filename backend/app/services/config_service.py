"""Service layer for configuration data."""

from typing import List

from app.repositories.config_repository import ConfigRepository
from app.schemas.config import (
    ConfigResponse,
    SourceSchema,
    ProductSchema,
    DatePresetSchema,
)
from app.core.mappings import SOURCE_DB_TO_API, PRODUCT_TO_CATEGORY_MAPPING


class ConfigService:
    """Service for handling configuration data.

    This service transforms database data into API-compatible format
    using mappings defined in app.core.mappings.
    """

    def __init__(self, repository: ConfigRepository):
        self.repository = repository

    async def get_configuration(self) -> ConfigResponse:
        """Get complete configuration for frontend.

        Returns configuration including:
        - Sources (from database, mapped to API format)
        - Products (virtual groupings from PRODUCT_TO_CATEGORY_MAPPING)
        - Date presets (static list)

        Returns:
            ConfigResponse with all reference data
        """
        # Get sources from database
        sources = await self._get_sources()

        # Get products (virtual groupings - not from DB)
        products = self._get_products()

        # Get date presets (static)
        date_presets = self._get_date_presets()

        return ConfigResponse(
            sources=sources,
            products=products,
            date_presets=date_presets,
        )

    async def _get_sources(self) -> List[SourceSchema]:
        """Get all sources from database and map to API format.

        Returns:
            List of SourceSchema objects with API-compatible identifiers
        """
        db_sources = await self.repository.get_all_sources()

        sources = []
        for db_source in db_sources:
            # Map database name to API value using SOURCE_DB_TO_API
            api_value = SOURCE_DB_TO_API.get(db_source.name, db_source.name.lower())

            sources.append(
                SourceSchema(
                    value=api_value,
                    label=db_source.name,
                )
            )

        return sources

    def _get_products(self) -> List[ProductSchema]:
        """Get all products (virtual groupings of categories).

        Products are not stored in database - they are virtual groupings
        defined in PRODUCT_TO_CATEGORY_MAPPING.

        Returns:
            List of ProductSchema objects
        """
        # Product labels (human-readable names in Russian)
        PRODUCT_LABELS = {
            "credit-cards": "Кредитные карты",
            "debit-cards": "Дебетовые карты",
            "mortgage": "Ипотека",
            "auto-loan": "Автокредит",
            "consumer-loan": "Потребительский кредит",
            "deposits": "Вклады",
            "savings": "Сбережения",
            "mobile-app": "Мобильное приложение",
            "online-banking": "Интернет-банк",
            "support": "Поддержка",
        }

        # Product categories for grouping
        PRODUCT_CATEGORIES = {
            "credit-cards": "Banking",
            "debit-cards": "Banking",
            "mortgage": "Banking",
            "auto-loan": "Banking",
            "consumer-loan": "Banking",
            "deposits": "Banking",
            "savings": "Banking",
            "mobile-app": "Digital",
            "online-banking": "Digital",
            "support": "Service",
        }

        products = []
        for product_key in PRODUCT_TO_CATEGORY_MAPPING.keys():
            products.append(
                ProductSchema(
                    value=product_key,
                    label=PRODUCT_LABELS.get(product_key, product_key),
                    category=PRODUCT_CATEGORIES.get(product_key, "Other"),
                )
            )

        return products

    def _get_date_presets(self) -> List[DatePresetSchema]:
        """Get predefined date range presets.

        Returns:
            List of DatePresetSchema objects
        """
        return [
            DatePresetSchema(label="Последние 7 дней", days=7),
            DatePresetSchema(label="Последние 30 дней", days=30),
            DatePresetSchema(label="Последние 90 дней", days=90),
            DatePresetSchema(label="Последние 180 дней", days=180),
            DatePresetSchema(label="Последний год", days=365),
        ]
