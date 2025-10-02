"""Dashboard API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_dashboard_service
from app.schemas.filters import OverviewRequest
from app.schemas.dashboard import OverviewResponse
from app.services.dashboard_service import DashboardService
from app.core.logging import logger

router = APIRouter()


@router.post("/dashboard/overview", response_model=OverviewResponse)
async def get_dashboard_overview(
    request: OverviewRequest,
    service: DashboardService = Depends(get_dashboard_service),
) -> OverviewResponse:
    """Get complete dashboard overview data.

    This endpoint provides all data needed for the dashboard "Overview" tab:
    - Metrics with trends and sparklines (total, positive, neutral, negative)
    - Sentiment dynamics by day with top-3 topics

    The endpoint supports filtering by:
    - Date range (required)
    - Sources (optional, empty array = all sources)
    - Products (optional, empty array = all products)

    Args:
        request: OverviewRequest with date_range and filters
        service: DashboardService (injected via Depends)

    Returns:
        OverviewResponse with meta, metrics, and sentiment_dynamics

    Raises:
        HTTPException: If validation fails or database error occurs

    Example Request:
        ```json
        {
          "date_range": {
            "from": "2025-01-01T00:00:00Z",
            "to": "2025-01-31T23:59:59Z"
          },
          "filters": {
            "sources": ["banki-ru"],
            "products": ["credit-cards"]
          }
        }
        ```

    Example Response:
        ```json
        {
          "meta": {
            "date_range": {...},
            "filters_applied": {...},
            "last_updated": "2025-10-01T15:30:00Z"
          },
          "metrics": {
            "total_reviews": {
              "current": 2847,
              "trend": {"direction": "up", "change": 245, "change_percent": 9},
              "sparkline": [2420, 2505, 2610, 2680, 2750, 2805, 2847]
            },
            ...
          },
          "sentiment_dynamics": [
            {
              "date": "2025-01-01",
              "positive": 67,
              "neutral": 25,
              "negative": 8,
              "topics": ["мобильное приложение", "кэшбэк", "поддержка"]
            },
            ...
          ]
        }
        ```

    Notes:
        - Trends compare current period with previous period of same length
        - Sparklines contain data for last 7 days of the period
        - Empty filters arrays mean "all" (no filtering applied)
        - Products are virtual groupings of database categories
        - Sentiment percentages always sum to 100 per day
    """
    try:
        logger.info(
            "dashboard_overview_requested",
            date_range={
                "from": str(request.date_range.from_),
                "to": str(request.date_range.to),
            },
            filters={
                "sources": request.filters.sources,
                "products": request.filters.products,
            },
        )

        # Get overview data
        overview = await service.get_overview(request)

        logger.info(
            "dashboard_overview_completed",
            total_reviews=overview.metrics.total_reviews.current,
            dynamics_days=len(overview.sentiment_dynamics),
        )

        return overview

    except ValueError as e:
        logger.error("dashboard_overview_validation_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Validation error: {str(e)}",
        )

    except Exception as e:
        # Log detailed error information for debugging
        logger.error(
            "dashboard_overview_error",
            error=str(e),
            error_type=type(e).__name__,
            exc_info=True,
        )

        # Check for database-related errors
        error_msg = str(e).lower()
        if any(keyword in error_msg for keyword in ["no such table", "database", "sqlite", "operational"]):
            logger.error(
                "database_error_detected",
                error=str(e),
                hint="Database file may be missing or corrupted. Check that bank_reviews.db exists and has correct schema.",
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database error: Unable to access database. Please contact support.",
            )

        # Generic error for other cases
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error occurred while retrieving dashboard data",
        )
