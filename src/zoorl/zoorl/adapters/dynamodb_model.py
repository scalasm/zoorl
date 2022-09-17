from typing import Any, Optional
from mypy_boto3_dynamodb.service_resource import Table

from zoorl.core.model import UrlHash
from zoorl.core.model import UrlHashRepository


class DynamoDBUrlHashRepository(UrlHashRepository):
    """DynamoDB implementation of the UrlHash repository."""    

    def __init__(self, url_hashes_table: Table) -> None:
        self.url_hashes_table = url_hashes_table

    def save(self, url_hash: UrlHash) -> None:
        item = {
            "PK": url_hash.hash,
            "SK": url_hash.hash,
            "url": url_hash.url,
            "ttl": str(url_hash.ttl)
        }

        self.url_hashes_table.put_item(
            Item=item        
        )

    def get_by_hash(self, hash: str) -> Optional[UrlHash]:
        response = self.url_hashes_table.get_item(
            Key={
                "PK": hash, "SK": hash
            }
        )

        if "Item" not in response:
            return None
   
        item = response["Item"]
        return UrlHash(
            hash=item["PK"], url=item["url"], ttl=int(item["ttl"])
        )
