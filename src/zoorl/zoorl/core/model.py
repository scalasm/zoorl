"""Data model and operations."""

from dataclasses import dataclass


@dataclass
class UrlHash:
    """A URL hash in our datastore."""
    hash: str
    url: str
    ttl: int
