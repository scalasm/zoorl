"""Data model and operations."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class UrlHash:
    """A URL hash in our datastore."""
    hash: str
    url: str
    ttl: int

class UrlHashRepository(ABC):
    """Interface for manipulating Url hashes."""
    
    @abstractmethod
    def save(self, url_hash: UrlHash) -> None:
        pass

    @abstractmethod
    def get_by_hash(self, hash: str) -> Optional[UrlHash]:
        """Returns the UrlHash, if present.
        
        Args:
            hash: the required hash  

        Returns:
            the requested UrlHash or None if no such hash was found
        """
        pass
