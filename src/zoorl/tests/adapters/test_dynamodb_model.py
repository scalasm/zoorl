from typing import Any, Dict, Optional
import pytest

import os
import boto3

from moto import mock_dynamodb

from mypy_boto3_dynamodb.service_resource import DynamoDBServiceResource
from mypy_boto3_dynamodb.service_resource import Table

from zoorl.adapters.dynamodb_model import DynamoDBUrlHashRepository
from zoorl.core.model import UrlHash


@pytest.fixture
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"


@pytest.fixture
def mock_dynamodb_resource(aws_credentials) -> DynamoDBServiceResource:
    """Mocked DynamoDB Resource """
    with mock_dynamodb():
        yield boto3.resource('dynamodb', region_name='us-east-1')


@pytest.fixture
def mock_url_hash_table(mock_dynamodb_resource: DynamoDBServiceResource) -> Table:
    """Ensure that we have a table for performing our tests."""

    test_table_name = "TestUrlHashes"
    
    return mock_dynamodb_resource.create_table(
        TableName=test_table_name,
        KeySchema=[
            {'AttributeName': 'PK','KeyType': 'HASH'},
            {'AttributeName': 'SK','KeyType': 'RANGE'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'PK','AttributeType': 'S'},
            {'AttributeName': 'SK','AttributeType': 'S'}
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 1,
            'WriteCapacityUnits': 1
        }
    )


@pytest.fixture
def repository(mock_url_hash_table: Table) -> DynamoDBUrlHashRepository:
    """The SUT is the repository implementing DynamoDB operations."""

    return DynamoDBUrlHashRepository(mock_url_hash_table)


class DynamoDBTestHelper:
    """Simple helper for making test assertion easier to read in test code."""
    def __init__(self, table: Table) -> None:
        self.table = table

    def assert_item_is_present(self, pk: str, sk: str, expected_values: Optional[Dict[str,Any]] = None) -> None:
        response = self.table.get_item(
            Key={
                "PK": pk, "SK": sk
            }
        )

        assert "Item" in response

        if expected_values:
            assert response["Item"] == expected_values

    def get_item_by_pk(self, pk: str, sk: str) -> Dict[str,Any]:
        response = self.table.get_item(
            Key={
                "PK": pk, "SK": sk
            }
        )

        if "Item" not in response:
            return None

        return response["Item"]


@pytest.fixture
def test_helper(mock_url_hash_table: Table) -> DynamoDBTestHelper:
    return DynamoDBTestHelper(mock_url_hash_table)


def test_save(repository: DynamoDBUrlHashRepository, test_helper: DynamoDBTestHelper) -> None:
    url_hash = "test_hash"
    url = "http://www.test.com"
    ttl = 1663519832

    repository.save(UrlHash(url_hash, url, ttl))

    test_helper.assert_item_is_present(url_hash, url_hash, {
        "PK": url_hash, 
        "SK": url_hash,
        "url": url,
        "ttl": str(ttl)
    })

def test_get_by_hash(repository: DynamoDBUrlHashRepository, test_helper: DynamoDBTestHelper) -> None:
    test_url_hash = "test_hash"
    test_url = "http://www.test.com"
    test_ttl = 1663519832

    repository.save(UrlHash(test_url_hash, test_url, test_ttl))

    url_hash = repository.get_by_hash(test_url_hash)

    assert url_hash.hash == test_url_hash
    assert url_hash.url == test_url
    assert url_hash.ttl == test_ttl
