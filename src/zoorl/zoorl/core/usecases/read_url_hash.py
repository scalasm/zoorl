"""Read an hash for a given URL."""

from dataclasses import dataclass
from typing import Optional
from zoorl.core.model import UrlHash
from zoorl.core.model import UrlHashRepository
from zoorl.core.utils import compute_epoch_time_from_ttl
from zoorl.core.utils import compute_hash

# Default TTL is 1 day (24 hours)
DEFAULT_TTL = 24

@dataclass
class ReadUrlHashUseCaseRequest:
    """Contains the desired hash to lookup."""
    hash: str


@dataclass
class ReadUrlHashUseCaseResponse:
    """The response contains every information associated to the hash."""
    url_hash: str
    url: str
    ttl: int


class UrlHashNotFoundError(Exception):
    """Exception thrown if the requested URL hash is not found."""
    pass


class ReadUrlHashUseCase:
    """Use case for reading a URL hash."""

    def __init__(self, url_hash_repository: UrlHashRepository) -> None:
        self.url_hash_repository = url_hash_repository
    
    def read_url(self, request: ReadUrlHashUseCaseRequest) -> ReadUrlHashUseCaseResponse:
        """Finds the URL associated to the requested hash.
        
        Args:
            request: contains the desired URL hash to lookup
        
        Returns:
            the URL, hash, and TTL, if the hash is present
        
        Raises:
            UrlHashNotFoundError: if no such hash was found
        """
        url_hash = self.url_hash_repository.get_by_hash(request.hash)

        if not url_hash:
            raise UrlHashNotFoundError("No such hash found or it has expired!")

        return ReadUrlHashUseCaseResponse(url_hash=url_hash.hash, url=url_hash.url, ttl=url_hash.ttl)
