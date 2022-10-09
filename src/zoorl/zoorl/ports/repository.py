from abc import ABC, abstractmethod
from typing import Optional

from zoorl.core.model import UrlHash

class UrlHashRepository(ABC):
    """Interface for manipulating Url hashes."""
    
    @abstractmethod
    def save(self, url_hash: UrlHash) -> None:
        """Save a URL hash within the repository.

        Arguments:
            url_hash: the Url Hash to save.

        """
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
