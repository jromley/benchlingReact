import logging
from datetime import datetime, timezone

import feedparser
from sqlalchemy import text

from app.config import settings
from app.db import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

FEEDS = [
    ("MIT Technology Review", "https://www.technologyreview.com/topic/artificial-intelligence/feed"),
    ("Ars Technica", "https://arstechnica.com/ai/feed/"),
    ("OpenAI Blog", "https://openai.com/news/rss.xml"),
    ("VentureBeat", "https://venturebeat.com/category/ai/feed/"),
]

MAX_ARTICLES_PER_FEED = 10


def parse_published(entry) -> datetime | None:
    if getattr(entry, "published_parsed", None):
        return datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
    return None


def fetch_and_store():
    with engine.begin() as conn:
        for source, url in FEEDS:
            try:
                feed = feedparser.parse(url)
            except Exception:
                logger.exception("Failed to fetch feed %s", url)
                continue

            for entry in feed.entries[:MAX_ARTICLES_PER_FEED]:
                conn.execute(
                    text(
                        """
                        INSERT INTO news_articles (title, link, source, published_at)
                        VALUES (:title, :link, :source, :published_at)
                        ON CONFLICT (link) DO NOTHING
                        """
                    ),
                    {
                        "title": entry.get("title", "Untitled"),
                        "link": entry.get("link"),
                        "source": source,
                        "published_at": parse_published(entry),
                    },
                )
            logger.info("Fetched %d entries from %s", len(feed.entries[:MAX_ARTICLES_PER_FEED]), source)


if __name__ == "__main__":
    fetch_and_store()
