"""Repository for dashboard data retrieval."""

from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy import select, func, distinct, case, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review import Review
from app.models.annotation import Annotation
from app.models.sentiment import Sentiment
from app.models.category import Category
from app.models.source import Source


class DashboardRepository:
    """Repository for retrieving dashboard metrics from database.

    Handles complex queries with filters, aggregations, and JOINs.
    """

    def __init__(self, db: AsyncSession):
        """Initialize repository with database session.

        Args:
            db: AsyncSession instance
        """
        self.db = db

    async def get_review_metrics(
        self,
        from_date: datetime,
        to_date: datetime,
        source_names: Optional[List[str]] = None,
        category_names: Optional[List[str]] = None,
    ) -> Dict[str, int]:
        """Get review metrics for specified period and filters.

        Args:
            from_date: Start date (inclusive)
            to_date: End date (inclusive)
            source_names: List of source names (DB format) or None for all
            category_names: List of category names or None for all

        Returns:
            Dictionary with keys:
            - total_reviews: Total number of unique reviews
            - positive: Number of positive sentiment annotations
            - neutral: Number of neutral sentiment annotations
            - negative: Number of negative sentiment annotations

        Note:
            Uses COUNT(DISTINCT r.review_id) for total_reviews because
            one review can have multiple annotations.
        """
        # Build query with JOINs
        query = select(
            func.count(distinct(Review.review_id)).label("total_reviews"),
            func.sum(
                case((Sentiment.name == "позитив", 1), else_=0)
            ).label("positive"),
            func.sum(
                case((Sentiment.name == "нейтральный", 1), else_=0)
            ).label("neutral"),
            func.sum(
                case((Sentiment.name == "негатив", 1), else_=0)
            ).label("negative"),
        ).select_from(Review)

        # JOIN annotations and sentiments
        query = query.join(Annotation, Review.review_id == Annotation.review_id)
        query = query.join(Sentiment, Annotation.sentiment_id == Sentiment.id)

        # Apply date filter
        query = query.where(
            and_(
                Review.date >= from_date.date() if isinstance(from_date, datetime) else from_date,
                Review.date <= to_date.date() if isinstance(to_date, datetime) else to_date,
            )
        )

        # Apply source filter if provided
        if source_names:
            query = query.join(Source, Review.source_id == Source.id)
            query = query.where(Source.name.in_(source_names))

        # Apply category filter if provided
        if category_names:
            query = query.join(Category, Annotation.category_id == Category.id)
            query = query.where(Category.name.in_(category_names))

        # Execute query
        result = await self.db.execute(query)
        row = result.one()

        return {
            "total_reviews": row.total_reviews or 0,
            "positive": row.positive or 0,
            "neutral": row.neutral or 0,
            "negative": row.negative or 0,
        }

    async def get_sparkline_data(
        self,
        to_date: datetime,
        days: int = 7,
        source_names: Optional[List[str]] = None,
        category_names: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """Get daily review counts for sparkline (last N days).

        Args:
            to_date: End date (inclusive)
            days: Number of days to retrieve (default: 7)
            source_names: List of source names (DB format) or None for all
            category_names: List of category names or None for all

        Returns:
            List of dicts with 'date' and 'value' keys, sorted by date

        Note:
            Returns empty list if no data found.
        """
        # Calculate from_date
        from_date = to_date - timedelta(days=days - 1)

        # Build query
        query = select(
            func.date(Review.date).label("date"),
            func.count(distinct(Review.review_id)).label("value"),
        ).select_from(Review)

        # JOIN annotations for filtering
        query = query.join(Annotation, Review.review_id == Annotation.review_id)

        # Apply date filter
        query = query.where(
            and_(
                Review.date >= from_date.date() if isinstance(from_date, datetime) else from_date,
                Review.date <= to_date.date() if isinstance(to_date, datetime) else to_date,
            )
        )

        # Apply source filter if provided
        if source_names:
            query = query.join(Source, Review.source_id == Source.id)
            query = query.where(Source.name.in_(source_names))

        # Apply category filter if provided
        if category_names:
            query = query.join(Category, Annotation.category_id == Category.id)
            query = query.where(Category.name.in_(category_names))

        # Group by date and order
        query = query.group_by(func.date(Review.date))
        query = query.order_by(func.date(Review.date))

        # Execute query
        result = await self.db.execute(query)
        rows = result.all()

        return [{"date": row.date, "value": row.value} for row in rows]

    async def get_sentiment_dynamics(
        self,
        from_date: datetime,
        to_date: datetime,
        source_names: Optional[List[str]] = None,
        category_names: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """Get daily sentiment distribution (percentages).

        Args:
            from_date: Start date (inclusive)
            to_date: End date (inclusive)
            source_names: List of source names (DB format) or None for all
            category_names: List of category names or None for all

        Returns:
            List of dicts with keys:
            - date: Date (YYYY-MM-DD)
            - positive: Percentage of positive annotations (0-100)
            - neutral: Percentage of neutral annotations (0-100)
            - negative: Percentage of negative annotations (0-100)

        Note:
            Percentages are rounded to integers.
        """
        # Build query
        query = select(
            func.date(Review.date).label("date"),
            func.sum(
                case((Sentiment.name == "позитив", 1), else_=0)
            ).label("positive_count"),
            func.sum(
                case((Sentiment.name == "нейтральный", 1), else_=0)
            ).label("neutral_count"),
            func.sum(
                case((Sentiment.name == "негатив", 1), else_=0)
            ).label("negative_count"),
            func.count(Annotation.id).label("total_count"),
        ).select_from(Review)

        # JOINs
        query = query.join(Annotation, Review.review_id == Annotation.review_id)
        query = query.join(Sentiment, Annotation.sentiment_id == Sentiment.id)

        # Apply date filter
        query = query.where(
            and_(
                Review.date >= from_date.date() if isinstance(from_date, datetime) else from_date,
                Review.date <= to_date.date() if isinstance(to_date, datetime) else to_date,
            )
        )

        # Apply source filter if provided
        if source_names:
            query = query.join(Source, Review.source_id == Source.id)
            query = query.where(Source.name.in_(source_names))

        # Apply category filter if provided
        if category_names:
            query = query.join(Category, Annotation.category_id == Category.id)
            query = query.where(Category.name.in_(category_names))

        # Group by date and order
        query = query.group_by(func.date(Review.date))
        query = query.order_by(func.date(Review.date))

        # Execute query
        result = await self.db.execute(query)
        rows = result.all()

        # Calculate percentages
        dynamics = []
        for row in rows:
            total = row.total_count
            if total > 0:
                positive_pct = round((row.positive_count / total) * 100)
                neutral_pct = round((row.neutral_count / total) * 100)
                negative_pct = round((row.negative_count / total) * 100)
            else:
                positive_pct = neutral_pct = negative_pct = 0

            dynamics.append({
                "date": str(row.date),
                "positive": positive_pct,
                "neutral": neutral_pct,
                "negative": negative_pct,
            })

        return dynamics

    async def get_top_topics_for_date(
        self,
        target_date: date,
        source_names: Optional[List[str]] = None,
        category_names: Optional[List[str]] = None,
        limit: int = 3,
    ) -> List[str]:
        """Get top N categories (topics) for a specific date.

        Args:
            target_date: Target date
            source_names: List of source names (DB format) or None for all
            category_names: List of category names to filter or None for all
            limit: Number of top topics to return (default: 3)

        Returns:
            List of category names (max 'limit' items)

        Note:
            Returns categories ordered by mention count (descending).
        """
        # Build query
        query = select(
            Category.name,
            func.count(Annotation.id).label("mention_count"),
        ).select_from(Category)

        # JOINs
        query = query.join(Annotation, Category.id == Annotation.category_id)
        query = query.join(Review, Annotation.review_id == Review.review_id)

        # Filter by date
        query = query.where(Review.date == target_date)

        # Apply source filter if provided
        if source_names:
            query = query.join(Source, Review.source_id == Source.id)
            query = query.where(Source.name.in_(source_names))

        # Apply category filter if provided (for consistency with other filters)
        if category_names:
            query = query.where(Category.name.in_(category_names))

        # Group by category and order by count
        query = query.group_by(Category.id, Category.name)
        query = query.order_by(func.count(Annotation.id).desc())
        query = query.limit(limit)

        # Execute query
        result = await self.db.execute(query)
        rows = result.all()

        return [row.name for row in rows]

    async def get_sparkline_by_sentiment(
        self,
        to_date: datetime,
        sentiment_name: str,
        days: int = 7,
        source_names: Optional[List[str]] = None,
        category_names: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """Get daily counts for specific sentiment (for sparkline).

        Args:
            to_date: End date (inclusive)
            sentiment_name: Sentiment name in DB format (e.g., "позитив")
            days: Number of days to retrieve (default: 7)
            source_names: List of source names (DB format) or None for all
            category_names: List of category names or None for all

        Returns:
            List of dicts with 'date' and 'value' keys

        Note:
            Unlike get_sparkline_data, this counts annotations with specific sentiment,
            not unique reviews.
        """
        # Calculate from_date
        from_date = to_date - timedelta(days=days - 1)

        # Build query
        query = select(
            func.date(Review.date).label("date"),
            func.count(Annotation.id).label("value"),
        ).select_from(Review)

        # JOINs
        query = query.join(Annotation, Review.review_id == Annotation.review_id)
        query = query.join(Sentiment, Annotation.sentiment_id == Sentiment.id)

        # Filter by sentiment
        query = query.where(Sentiment.name == sentiment_name)

        # Apply date filter
        query = query.where(
            and_(
                Review.date >= from_date.date() if isinstance(from_date, datetime) else from_date,
                Review.date <= to_date.date() if isinstance(to_date, datetime) else to_date,
            )
        )

        # Apply source filter if provided
        if source_names:
            query = query.join(Source, Review.source_id == Source.id)
            query = query.where(Source.name.in_(source_names))

        # Apply category filter if provided
        if category_names:
            query = query.join(Category, Annotation.category_id == Category.id)
            query = query.where(Category.name.in_(category_names))

        # Group by date and order
        query = query.group_by(func.date(Review.date))
        query = query.order_by(func.date(Review.date))

        # Execute query
        result = await self.db.execute(query)
        rows = result.all()

        return [{"date": row.date, "value": row.value} for row in rows]
