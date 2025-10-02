"""Service for data aggregation and calculations."""

from datetime import datetime, timedelta
from typing import Dict, List, Tuple

from app.schemas.dashboard import TrendSchema
from app.schemas.filters import DateRangeSchema


class AggregationService:
    """Service for aggregating and calculating dashboard metrics.

    Provides utility methods for:
    - Calculating trends between periods
    - Formatting sparkline data
    - Computing previous period dates
    - Normalizing percentages
    """

    @staticmethod
    def calculate_trend(current: int, previous: int) -> TrendSchema:
        """Calculate trend comparing current and previous values.

        Args:
            current: Current period value
            previous: Previous period value

        Returns:
            TrendSchema with direction, change, and change_percent

        Formula:
            - direction = "up" if current >= previous else "down"
            - change = abs(current - previous)
            - change_percent = round(abs(change / previous * 100)) if previous > 0
        """
        change = current - previous
        direction = "up" if change >= 0 else "down"
        absolute_change = abs(change)

        # Calculate percentage change (avoid division by zero)
        if previous > 0:
            change_percent = round(abs(change / previous * 100))
        else:
            # If previous was 0, set to 100% if current > 0, else 0%
            change_percent = 100 if current > 0 else 0

        return TrendSchema(
            direction=direction,
            change=absolute_change,
            change_percent=change_percent,
        )

    @staticmethod
    def get_previous_period_dates(date_range: DateRangeSchema) -> Tuple[datetime, datetime]:
        """Calculate previous period dates with same duration.

        Args:
            date_range: Current period date range

        Returns:
            Tuple of (from_date, to_date) for previous period

        Example:
            Current: 2025-01-01 to 2025-01-31 (31 days)
            Previous: 2024-12-01 to 2024-12-31 (31 days)
        """
        # Calculate period duration
        duration = date_range.to - date_range.from_

        # Previous period ends where current period starts (minus 1 second)
        prev_to = date_range.from_ - timedelta(seconds=1)

        # Previous period starts duration days before prev_to
        prev_from = prev_to - duration

        return (prev_from, prev_to)

    @staticmethod
    def format_sparkline(
        data_points: List[Dict], days: int = 7
    ) -> List[int]:
        """Format sparkline data as array of values for last N days.

        Args:
            data_points: List of dicts with 'date' and 'value' keys
            days: Number of days for sparkline (default: 7)

        Returns:
            List of integers representing values for each day

        Note:
            - If data_points has fewer than 'days' items, fills beginning with 0
            - If data_points has more than 'days' items, takes last 'days' items
        """
        if not data_points:
            return [0] * days

        # Sort by date to ensure chronological order
        sorted_points = sorted(data_points, key=lambda x: x["date"])

        # Extract values
        values = [point["value"] for point in sorted_points]

        # Take last 'days' items or pad with zeros
        if len(values) >= days:
            return values[-days:]
        else:
            # Pad beginning with zeros if not enough data
            padding = [0] * (days - len(values))
            return padding + values

    @staticmethod
    def normalize_percentages(
        positive: int, neutral: int, negative: int
    ) -> Tuple[int, int, int]:
        """Ensure sentiment percentages sum to exactly 100.

        Args:
            positive: Positive percentage
            neutral: Neutral percentage
            negative: Negative percentage

        Returns:
            Tuple of (positive, neutral, negative) that sum to 100

        Note:
            If sum != 100, adjusts the largest value to make sum = 100
        """
        total = positive + neutral + negative

        if total == 100:
            return (positive, neutral, negative)

        # Find difference to distribute
        diff = 100 - total

        # Find which sentiment has the largest value to adjust
        sentiments = [
            ("positive", positive),
            ("neutral", neutral),
            ("negative", negative),
        ]
        max_sentiment = max(sentiments, key=lambda x: x[1])

        # Adjust the largest value
        if max_sentiment[0] == "positive":
            positive += diff
        elif max_sentiment[0] == "neutral":
            neutral += diff
        else:
            negative += diff

        # Ensure no negative values
        positive = max(0, min(100, positive))
        neutral = max(0, min(100, neutral))
        negative = max(0, min(100, negative))

        return (positive, neutral, negative)

    @staticmethod
    def calculate_percentage(count: int, total: int) -> int:
        """Calculate percentage and round to integer.

        Args:
            count: Count value
            total: Total value

        Returns:
            Rounded percentage (0-100)

        Note:
            Returns 0 if total is 0
        """
        if total == 0:
            return 0
        return round((count / total) * 100)

    @staticmethod
    def get_last_n_days_dates(
        end_date: datetime, days: int = 7
    ) -> List[datetime]:
        """Get list of dates for last N days including end_date.

        Args:
            end_date: End date (inclusive)
            days: Number of days to include

        Returns:
            List of datetime objects in chronological order

        Example:
            end_date = 2025-01-07, days = 7
            Returns: [2025-01-01, 2025-01-02, ..., 2025-01-07]
        """
        dates = []
        for i in range(days - 1, -1, -1):
            date = end_date - timedelta(days=i)
            dates.append(date)
        return dates
