from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple


SCHEMA_SQL = r"""
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS reviews (
  review_id INTEGER PRIMARY KEY,
  text TEXT NOT NULL,
  date_raw TEXT NOT NULL,
  review_date TEXT NOT NULL,
  source TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_date
  ON reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_reviews_source
  ON reviews(source);

CREATE TABLE IF NOT EXISTS categories (
  category_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS sentiments (
  sentiment_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

INSERT OR IGNORE INTO sentiments(name)
VALUES ('позитив'), ('негатив'), ('нейтральный');

CREATE TABLE IF NOT EXISTS annotations (
  annotation_id INTEGER PRIMARY KEY,
  review_id INTEGER NOT NULL
    REFERENCES reviews(review_id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL
    REFERENCES categories(category_id),
  sentiment_id INTEGER NOT NULL
    REFERENCES sentiments(sentiment_id),
  summary TEXT NOT NULL,
  UNIQUE (review_id, category_id, summary)
);

CREATE INDEX IF NOT EXISTS idx_annotations_review
  ON annotations(review_id);
CREATE INDEX IF NOT EXISTS idx_annotations_category
  ON annotations(category_id);
CREATE INDEX IF NOT EXISTS idx_annotations_sentiment
  ON annotations(sentiment_id);

CREATE VIEW IF NOT EXISTS v_annotations AS
SELECT
  a.annotation_id,
  r.review_id,
  r.review_date,
  r.source,
  r.text,
  c.name AS category,
  s.name AS sentiment,
  a.summary
FROM annotations a
JOIN reviews r ON r.review_id = a.review_id
JOIN categories c ON c.category_id = a.category_id
JOIN sentiments s ON s.sentiment_id = a.sentiment_id;
"""


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments."""
    p = argparse.ArgumentParser(
        description="Load reviews and annotations JSON into SQLite."
    )
    p.add_argument(
        "-i",
        "--input-reviews",
        required=True,
        type=Path,
        help="Path to input_dict_150_with_date_source.json",
    )
    p.add_argument(
        "-a",
        "--input-annotations",
        required=True,
        type=Path,
        help="Path to output_dict_150_llama.json",
    )
    p.add_argument(
        "-o",
        "--output-db",
        required=True,
        type=Path,
        help="Path to output SQLite DB (will be created/updated)",
    )
    return p.parse_args()


def load_json(path: Path) -> Any:
    """Load JSON file with UTF-8 encoding."""
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def ddmmyyyy_to_iso(date_raw: str) -> str:
    """Convert dd.mm.yyyy -> yyyy-mm-dd."""
    parts = date_raw.split(".")
    if len(parts) != 3:
        return date_raw
    d, m, y = parts
    return f"{y}-{m}-{d}"


def ensure_schema(conn: sqlite3.Connection) -> None:
    """Create schema objects if not exist."""
    conn.executescript(SCHEMA_SQL)


def upsert_category(conn: sqlite3.Connection, name: str) -> int:
    """Return category_id for name, inserting if needed."""
    conn.execute(
        "INSERT OR IGNORE INTO categories(name) VALUES (?)",
        (name,),
    )
    row = conn.execute(
        "SELECT category_id FROM categories WHERE name = ?",
        (name,),
    ).fetchone()
    return int(row[0])


def get_sentiment_id(conn: sqlite3.Connection, name: str) -> int:
    """Return sentiment_id for name (must exist)."""
    row = conn.execute(
        "SELECT sentiment_id FROM sentiments WHERE name = ?",
        (name,),
    ).fetchone()
    if not row:
        raise ValueError(f"Unknown sentiment: {name}")
    return int(row[0])


def insert_reviews(conn: sqlite3.Connection, rows: Iterable[Dict[str, Any]]) -> None:
    """Insert reviews from input JSON."""
    data: List[Tuple[int, str, str, str, str]] = []
    for r in rows:
        rid = int(r["review_id"])
        text = str(r["text"])
        date_raw = str(r["date"])
        review_date = ddmmyyyy_to_iso(date_raw)
        source = str(r.get("source", ""))
        data.append((rid, text, date_raw, review_date, source))

    conn.executemany(
        """
        INSERT OR REPLACE INTO reviews
        (review_id, text, date_raw, review_date, source)
        VALUES (?, ?, ?, ?, ?)
        """,
        data,
    )


def insert_annotations(
    conn: sqlite3.Connection, rows: Iterable[Dict[str, Any]]
) -> None:
    """Insert annotations from output JSON."""
    for item in rows:
        rid = int(item["review_id"])
        anns = item.get("annotations", []) or []
        if not anns:
            continue
        for ann in anns:
            cat = str(ann["category"]).strip()
            summary = str(ann["summary"]).strip()
            sent = str(ann["sentiment"]).strip()

            cat_id = upsert_category(conn, cat)
            sent_id = get_sentiment_id(conn, sent)

            conn.execute(
                """
                INSERT OR IGNORE INTO annotations
                (review_id, category_id, sentiment_id, summary)
                VALUES (?, ?, ?, ?)
                """,
                (rid, cat_id, sent_id, summary),
            )


def main(input_reviews, input_annotations, output_db) -> None:
    """Entry point."""
    # Convert string paths to Path objects if needed
    input_reviews = Path(input_reviews) if isinstance(input_reviews, str) else input_reviews
    input_annotations = Path(input_annotations) if isinstance(input_annotations, str) else input_annotations
    output_db = Path(output_db) if isinstance(output_db, str) else output_db
    
    reviews = load_json(input_reviews)
    ann = load_json(input_annotations)

    with sqlite3.connect(output_db) as conn:
        conn.execute("PRAGMA foreign_keys = ON;")
        ensure_schema(conn)
        insert_reviews(conn, reviews)
        insert_annotations(conn, ann)
        conn.commit()


if __name__ == "__main__":
    main(r'D:\Projects\CustomerSentimentChecker\backend\json\customer_reviews.json',
    r'D:\Projects\CustomerSentimentChecker\backend\json\llm_results_banki_i_sravni.json',
    r'D:\Projects\CustomerSentimentChecker\backend\customer_reviews.db')

