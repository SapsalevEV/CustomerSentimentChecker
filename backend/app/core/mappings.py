"""Mappings between database structure and API requirements."""
from typing import Dict, List


# Sentiment mapping
SENTIMENT_DB_TO_API: Dict[str, str] = {
    "позитив": "positive",
    "негатив": "negative",
    "нейтральный": "neutral"
}

SENTIMENT_API_TO_DB: Dict[str, str] = {
    v: k for k, v in SENTIMENT_DB_TO_API.items()
}

# Products mapping (virtual grouping of categories)
# IMPORTANT: Keys must match API requirements from docs/api.md (kebab-case)
PRODUCT_TO_CATEGORY_MAPPING: Dict[str, List[str]] = {
    # Card products
    "credit-cards": ["Карты", "Кредиты", "Кэшбэк / Бонусы"],
    "debit-cards": ["Карты", "Кэшбэк / Бонусы", "Карточная служба"],

    # Credit products
    "mortgage": ["Кредиты"],
    "auto-loan": ["Кредиты"],
    "consumer-loan": ["Кредиты"],

    # Deposits and savings
    "deposits": ["Вклады"],
    "savings": ["Вклады", "Счета"],

    # Digital services
    "mobile-app": ["Приложение"],
    "online-banking": ["Приложение"],

    # Support and service
    "support": ["Служба поддержки", "Обслуживание в офисе", "Курьерская служба"],
}

# Sources mapping (DB names → API identifiers)
# IMPORTANT: Must match API requirements from docs/api.md
SOURCE_DB_TO_API: Dict[str, str] = {
    "Banki.ru": "banki-ru",
    "Sravni.ru": "sravni-ru"
}

SOURCE_API_TO_DB: Dict[str, str] = {v: k for k, v in SOURCE_DB_TO_API.items()}


def get_categories_for_products(products: List[str]) -> List[str]:
    """Get database categories for list of API products.

    Args:
        products: List of product identifiers from API (e.g., ["credit-cards", "deposits"])

    Returns:
        List of unique category names from database

    Note:
        Empty list [] means "all products" - returns empty list (no filter applied)
    """
    if not products:  # Empty list = all products
        return []

    categories = []
    for product in products:
        categories.extend(PRODUCT_TO_CATEGORY_MAPPING.get(product, []))
    return list(set(categories))  # Remove duplicates


def get_db_source_names(api_sources: List[str]) -> List[str]:
    """Transform API source names to database source names.

    Args:
        api_sources: List of source identifiers from API (e.g., ["banki-ru", "irecommend"])

    Returns:
        List of source names as stored in database (e.g., ["Banki.ru", "Sravni.ru"])

    Note:
        Empty list [] means "all sources" - returns empty list (no filter applied)
    """
    if not api_sources:  # Empty list = all sources
        return []

    return [SOURCE_API_TO_DB.get(src, src) for src in api_sources]

