"""Service layer for dashboard business logic."""

from datetime import datetime, date
from typing import List, Dict

from app.repositories.dashboard_repository import DashboardRepository
from app.services.aggregation_service import AggregationService
from app.schemas.filters import OverviewRequest, DateRangeSchema, FiltersSchema
from app.schemas.dashboard import (
    OverviewResponse,
    MetaSchema,
    MetricsSchema,
    MetricSchema,
    SentimentDynamicsSchema,
)
from app.core.mappings import (
    get_categories_for_products,
    get_db_source_names,
)


class DashboardService:
    """Service for dashboard overview data.

    Coordinates data retrieval, aggregation, and transformation
    for the dashboard overview endpoint.
    """

    def __init__(self, repository: DashboardRepository):
        """Initialize service with repository.

        Args:
            repository: DashboardRepository instance
        """
        self.repository = repository
        self.aggregation = AggregationService()

    async def get_overview(self, request: OverviewRequest) -> OverviewResponse:
        """Get complete dashboard overview data.

        This is the main method that coordinates:
        1. Filter transformation (API → DB format)
        2. Metrics retrieval for current and previous periods
        3. Trend calculations
        4. Sparkline data generation
        5. Sentiment dynamics retrieval with top topics

        Args:
            request: OverviewRequest with date_range and filters

        Returns:
            OverviewResponse with meta, metrics, and sentiment_dynamics
        """
        # Transform API filters to DB filters
        db_sources = get_db_source_names(request.filters.sources)
        db_categories = get_categories_for_products(request.filters.products)

        # Get current period metrics
        current_metrics = await self.repository.get_review_metrics(
            from_date=request.date_range.from_,
            to_date=request.date_range.to,
            source_names=db_sources if db_sources else None,
            category_names=db_categories if db_categories else None,
        )

        # Get previous period metrics for trend calculation
        prev_from, prev_to = self.aggregation.get_previous_period_dates(
            request.date_range
        )
        previous_metrics = await self.repository.get_review_metrics(
            from_date=prev_from,
            to_date=prev_to,
            source_names=db_sources if db_sources else None,
            category_names=db_categories if db_categories else None,
        )

        # Build metrics with trends and sparklines
        metrics = await self._build_metrics(
            current=current_metrics,
            previous=previous_metrics,
            to_date=request.date_range.to,
            db_sources=db_sources if db_sources else None,
            db_categories=db_categories if db_categories else None,
        )

        # Get sentiment dynamics with topics
        sentiment_dynamics = await self._build_sentiment_dynamics(
            from_date=request.date_range.from_,
            to_date=request.date_range.to,
            db_sources=db_sources if db_sources else None,
            db_categories=db_categories if db_categories else None,
        )

        # Build metadata
        meta = MetaSchema(
            date_range=request.date_range,
            filters_applied=request.filters,
            last_updated=datetime.utcnow(),
        )

        return OverviewResponse(
            meta=meta,
            metrics=metrics,
            sentiment_dynamics=sentiment_dynamics,
        )

    async def _build_metrics(
        self,
        current: Dict[str, int],
        previous: Dict[str, int],
        to_date: datetime,
        db_sources: List[str] = None,
        db_categories: List[str] = None,
    ) -> MetricsSchema:
        """Build all metrics with trends and sparklines.

        Args:
            current: Current period metrics
            previous: Previous period metrics
            to_date: End date for sparkline calculation
            db_sources: Database source names (or None for all)
            db_categories: Database category names (or None for all)

        Returns:
            MetricsSchema with all four metrics
        """
        # Calculate total annotations for percentage calculation
        total_annotations = current["positive"] + current["neutral"] + current["negative"]

        # Total reviews
        total_reviews = await self._build_metric(
            current_value=current["total_reviews"],
            previous_value=previous["total_reviews"],
            to_date=to_date,
            db_sources=db_sources,
            db_categories=db_categories,
            include_percentage=False,
        )

        # Positive reviews
        positive_reviews = await self._build_metric(
            current_value=current["positive"],
            previous_value=previous["positive"],
            to_date=to_date,
            db_sources=db_sources,
            db_categories=db_categories,
            total_for_percentage=total_annotations,
            sentiment_name="позитив",
        )

        # Neutral reviews
        neutral_reviews = await self._build_metric(
            current_value=current["neutral"],
            previous_value=previous["neutral"],
            to_date=to_date,
            db_sources=db_sources,
            db_categories=db_categories,
            total_for_percentage=total_annotations,
            sentiment_name="нейтральный",
        )

        # Negative reviews
        negative_reviews = await self._build_metric(
            current_value=current["negative"],
            previous_value=previous["negative"],
            to_date=to_date,
            db_sources=db_sources,
            db_categories=db_categories,
            total_for_percentage=total_annotations,
            sentiment_name="негатив",
        )

        return MetricsSchema(
            total_reviews=total_reviews,
            positive_reviews=positive_reviews,
            neutral_reviews=neutral_reviews,
            negative_reviews=negative_reviews,
        )

    async def _build_metric(
        self,
        current_value: int,
        previous_value: int,
        to_date: datetime,
        db_sources: List[str] = None,
        db_categories: List[str] = None,
        include_percentage: bool = True,
        total_for_percentage: int = None,
        sentiment_name: str = None,
    ) -> MetricSchema:
        """Build a single metric with trend and sparkline.

        Args:
            current_value: Current period value
            previous_value: Previous period value
            to_date: End date for sparkline
            db_sources: Database source names (or None for all)
            db_categories: Database category names (or None for all)
            include_percentage: Whether to include percentage field
            total_for_percentage: Total value for percentage calculation
            sentiment_name: Sentiment name for sparkline (if applicable)

        Returns:
            MetricSchema instance
        """
        # Calculate trend
        trend = self.aggregation.calculate_trend(current_value, previous_value)

        # Get sparkline data
        if sentiment_name:
            # For sentiment metrics, get annotation counts by sentiment
            sparkline_data = await self.repository.get_sparkline_by_sentiment(
                to_date=to_date,
                sentiment_name=sentiment_name,
                days=7,
                source_names=db_sources,
                category_names=db_categories,
            )
        else:
            # For total reviews, get unique review counts
            sparkline_data = await self.repository.get_sparkline_data(
                to_date=to_date,
                days=7,
                source_names=db_sources,
                category_names=db_categories,
            )

        sparkline = self.aggregation.format_sparkline(sparkline_data, days=7)

        # Calculate percentage if needed
        percentage = None
        if include_percentage and total_for_percentage is not None:
            percentage = self.aggregation.calculate_percentage(
                current_value, total_for_percentage
            )

        return MetricSchema(
            current=current_value,
            percentage=percentage,
            trend=trend,
            sparkline=sparkline,
        )

    async def _build_sentiment_dynamics(
        self,
        from_date: datetime,
        to_date: datetime,
        db_sources: List[str] = None,
        db_categories: List[str] = None,
    ) -> List[SentimentDynamicsSchema]:
        """Build sentiment dynamics with top topics for each day.

        Args:
            from_date: Start date
            to_date: End date
            db_sources: Database source names (or None for all)
            db_categories: Database category names (or None for all)

        Returns:
            List of SentimentDynamicsSchema instances
        """
        # Get sentiment dynamics (percentages by day)
        dynamics_data = await self.repository.get_sentiment_dynamics(
            from_date=from_date,
            to_date=to_date,
            source_names=db_sources,
            category_names=db_categories,
        )

        # For each day, get top-3 topics
        dynamics = []
        for day_data in dynamics_data:
            # Parse date string to date object
            day_date = datetime.strptime(day_data["date"], "%Y-%m-%d").date()

            # Get top-3 topics for this day
            topics = await self.repository.get_top_topics_for_date(
                target_date=day_date,
                source_names=db_sources,
                category_names=db_categories,
                limit=3,
            )

            # Normalize percentages to ensure they sum to 100
            positive, neutral, negative = self.aggregation.normalize_percentages(
                day_data["positive"],
                day_data["neutral"],
                day_data["negative"],
            )

            dynamics.append(
                SentimentDynamicsSchema(
                    date=day_data["date"],
                    positive=positive,
                    neutral=neutral,
                    negative=negative,
                    topics=topics if topics else None,
                )
            )

        return dynamics
