"""Database health check utilities."""
from typing import Dict, List, Any
from sqlalchemy import text, inspect
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger


REQUIRED_TABLES = [
    "reviews",
    "annotations",
    "categories",
    "sentiments",
    "sources",
]

OPTIONAL_VIEWS = [
    "category_statistics",
    "problematic_categories",
    "reviews_timeline",
    "source_comparison",
]


async def check_database_health(db: AsyncSession) -> Dict[str, Any]:
    """Perform comprehensive database health check.

    Args:
        db: Database session

    Returns:
        Dictionary with health check results:
        - healthy: bool - Overall health status
        - tables_exist: bool - All required tables present
        - missing_tables: List[str] - Missing required tables
        - views_exist: List[str] - Present optional views
        - row_counts: Dict[str, int] - Row counts for main tables
        - error: str - Error message if any

    Example:
        {
            "healthy": True,
            "tables_exist": True,
            "missing_tables": [],
            "views_exist": ["category_statistics", "reviews_timeline"],
            "row_counts": {
                "reviews": 1321,
                "annotations": 3568,
                "categories": 30,
                "sentiments": 3,
                "sources": 2
            }
        }
    """
    result = {
        "healthy": False,
        "tables_exist": False,
        "missing_tables": [],
        "views_exist": [],
        "row_counts": {},
        "error": None,
    }

    try:
        # Check if database connection is working
        await db.execute(text("SELECT 1"))

        # Get all table names using run_sync with proper inspector creation
        def _get_table_names(sync_conn):
            insp = inspect(sync_conn)
            return insp.get_table_names()

        def _get_view_names(sync_conn):
            insp = inspect(sync_conn)
            return insp.get_view_names()

        existing_tables = await db.run_sync(_get_table_names)

        # Check required tables
        missing_tables = [
            table for table in REQUIRED_TABLES if table not in existing_tables
        ]
        result["missing_tables"] = missing_tables
        result["tables_exist"] = len(missing_tables) == 0

        # Check optional views
        existing_views = await db.run_sync(_get_view_names)
        result["views_exist"] = [
            view for view in OPTIONAL_VIEWS if view in existing_views
        ]

        # Get row counts for existing required tables
        if result["tables_exist"]:
            for table in REQUIRED_TABLES:
                try:
                    count_result = await db.execute(
                        text(f"SELECT COUNT(*) as count FROM {table}")
                    )
                    row = count_result.first()
                    result["row_counts"][table] = row.count if row else 0
                except Exception as e:
                    logger.warning(
                        "failed_to_count_table_rows",
                        table=table,
                        error=str(e),
                    )
                    result["row_counts"][table] = -1  # Indicate error

        # Overall health check
        result["healthy"] = result["tables_exist"] and all(
            result["row_counts"].get(table, 0) > 0
            for table in ["reviews", "categories", "sentiments", "sources"]
        )

        if result["healthy"]:
            logger.info(
                "database_health_check_passed",
                tables=len(existing_tables),
                views=len(result["views_exist"]),
                reviews=result["row_counts"].get("reviews", 0),
            )
        else:
            logger.warning(
                "database_health_check_failed",
                missing_tables=result["missing_tables"],
                row_counts=result["row_counts"],
            )

    except Exception as e:
        logger.error(
            "database_health_check_error",
            error=str(e),
            error_type=type(e).__name__,
            exc_info=True,
        )
        result["error"] = str(e)
        result["healthy"] = False

    return result


async def verify_database_schema(db: AsyncSession) -> None:
    """Verify database schema and fail fast if invalid.

    Args:
        db: Database session

    Raises:
        RuntimeError: If database schema is invalid or missing

    Note:
        This should be called during application startup to ensure
        the database is properly configured before accepting requests.
    """
    health = await check_database_health(db)

    if not health["healthy"]:
        error_details = []

        if health["error"]:
            error_details.append(f"Database error: {health['error']}")

        if health["missing_tables"]:
            error_details.append(
                f"Missing tables: {', '.join(health['missing_tables'])}"
            )

        if not health["row_counts"]:
            error_details.append("Database appears to be empty")

        error_msg = (
            "Database health check failed. "
            + " | ".join(error_details)
            + " | Please ensure bank_reviews.db exists and has correct schema."
        )

        logger.error("database_schema_verification_failed", details=error_details)
        raise RuntimeError(error_msg)

    logger.info(
        "database_schema_verified",
        tables=len(REQUIRED_TABLES),
        views=len(health["views_exist"]),
        total_reviews=health["row_counts"].get("reviews", 0),
    )


async def get_database_stats(db: AsyncSession) -> Dict[str, Any]:
    """Get database statistics for monitoring.

    Args:
        db: Database session

    Returns:
        Dictionary with database statistics:
        - total_reviews: Total number of reviews
        - total_annotations: Total number of annotations
        - date_range: Earliest and latest review dates
        - sources: List of available sources
        - categories_count: Number of categories

    Example:
        {
            "total_reviews": 1321,
            "total_annotations": 3568,
            "date_range": {
                "earliest": "2023-01-01",
                "latest": "2023-12-31"
            },
            "sources": ["Banki.ru", "Sravni.ru"],
            "categories_count": 30
        }
    """
    stats = {}

    try:
        # Total reviews
        result = await db.execute(text("SELECT COUNT(*) as count FROM reviews"))
        row = result.first()
        stats["total_reviews"] = row.count if row else 0

        # Total annotations
        result = await db.execute(text("SELECT COUNT(*) as count FROM annotations"))
        row = result.first()
        stats["total_annotations"] = row.count if row else 0

        # Date range
        result = await db.execute(
            text("SELECT MIN(date) as earliest, MAX(date) as latest FROM reviews")
        )
        row = result.first()
        if row and row.earliest and row.latest:
            stats["date_range"] = {
                "earliest": str(row.earliest),
                "latest": str(row.latest),
            }
        else:
            stats["date_range"] = None

        # Sources
        result = await db.execute(text("SELECT name FROM sources ORDER BY name"))
        rows = result.all()
        stats["sources"] = [row.name for row in rows]

        # Categories count
        result = await db.execute(text("SELECT COUNT(*) as count FROM categories"))
        row = result.first()
        stats["categories_count"] = row.count if row else 0

    except Exception as e:
        logger.error(
            "database_stats_error",
            error=str(e),
            exc_info=True,
        )
        stats["error"] = str(e)

    return stats
