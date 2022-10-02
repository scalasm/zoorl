"""Create an hash for a given URL."""
from dataclasses import dataclass
from typing import Optional
from zoorl.core.model import UrlHash
from zoorl.core.model import UrlHashRepository
from zoorl.core.utils import compute_epoch_time_from_ttl
from zoorl.core.utils import compute_hash

# Default TTL is 1 day (24 hours)
DEFAULT_TTL = 24

@dataclass
class CreateUrlHashUseCaseRequest:
    url: str
    ttl: Optional[int] = None

@dataclass
class CreateUrlHashUseCaseResponse:
    url_hash: str
    url: str
    ttl: int

class CreateUrlHashUseCase:
    """Use case for creating a new URL hash."""
    def __init__(self, url_hash_repository: UrlHashRepository) -> None:
        self.url_hash_repository = url_hash_repository
    
    def create(self, request: CreateUrlHashUseCaseRequest) -> CreateUrlHashUseCaseResponse:
        """Create a URL hash.
        
        Args:
            request: URL and (optional) TTL
        
        Returns:
            the URL hash information.
        """
        ttl = request.ttl or DEFAULT_TTL

        url_hash = UrlHash(
            hash = compute_hash(request.url),
            url = request.url,
            ttl = compute_epoch_time_from_ttl(ttl)
        )

        self.url_hash_repository.save(url_hash)

        return CreateUrlHashUseCaseResponse(url_hash=url_hash.hash, url=url_hash.url, ttl=url_hash.ttl)
