from __future__ import annotations

from db.database import get_session
from db.repositories import (
    count_annotations_by_category_and_sentiment,
    list_annotations,
    list_reviews,
    sources_distribution,
    top_categories,
)


def main() -> None:
    with get_session() as session:
        print("Sources:", sources_distribution(session))
        print("Top categories:", top_categories(session))
        print(
            "Agg counts:",
            count_annotations_by_category_and_sentiment(session)[:5],
        )
        print("Reviews sample:")
        for r in list_reviews(session, limit=3):
            print(r.review_id, r.review_date, r.source, r.text[:60], "...")
        print("Annotations sample (Кэшбэк, негатив, апр-июнь 2025):")
        anns = list_annotations(
            session,
            category="Кэшбэк",
            sentiment="негатив",
            date_from="2025-04-01",
            date_to="2025-06-30",
            limit=5,
        )
        for a in anns:
            print(a.review_id, a.category.name, a.sentiment.name, a.summary)


if __name__ == "__main__":
    main()


