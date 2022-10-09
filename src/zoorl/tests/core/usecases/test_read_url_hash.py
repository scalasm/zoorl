"""Unit tests for read url hash usecase."""

import pytest
from pytest_mock import MockerFixture
from unittest.mock import Mock

from zoorl.core.usecases.read_url_hash import (
    ReadUrlHashUseCase,
    ReadUrlHashUseCaseRequest,
    UrlHashNotFoundError
)

from zoorl.core.model import UrlHashRepository
from zoorl.core.model import UrlHash


@pytest.fixture
def mock_url_hash_repository(mocker: MockerFixture) -> Mock:
    """Mock repository."""
    
    return mocker.Mock(spec=UrlHashRepository)


@pytest.fixture
def usecase(mock_url_hash_repository: UrlHashRepository) -> ReadUrlHashUseCase:
    """Use case fixture."""
    
    return ReadUrlHashUseCase(mock_url_hash_repository)


def test_happy_path(usecase: ReadUrlHashUseCase, mock_url_hash_repository: Mock) -> None:
    """Verify that happy path is fine."""
    
    test_url_hash = "12345"
    test_url = "https://www.test.com"
    test_ttl = 100

    mock_url_hash_repository.get_by_hash.return_value = UrlHash(
        hash = test_url_hash, url = test_url, ttl = test_ttl
    )

    response = usecase.read_url(
        ReadUrlHashUseCaseRequest(hash=test_url_hash)
    )

    assert response.url_hash == test_url_hash
    assert response.url == test_url
    assert response.ttl == test_ttl


def test_url_hash_not_found_throws_exception(usecase: ReadUrlHashUseCase, mock_url_hash_repository: Mock) -> None:
    """Verify that if the hash does not exist, then a UrlHashNotFoundError is raised."""
    test_url_hash = "no_existing_hash"

    mock_url_hash_repository.get_by_hash.return_value = None

    with pytest.raises(UrlHashNotFoundError) as exception_info:
        usecase.read_url(
            ReadUrlHashUseCaseRequest(hash=test_url_hash)
        )

    assert exception_info.type == UrlHashNotFoundError
    assert str(exception_info.value) == "The specified URL hash is invalid or expired!"
