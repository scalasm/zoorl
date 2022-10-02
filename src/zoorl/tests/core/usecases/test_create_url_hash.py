"""Unit tests for create url usecase."""
import pytest
from pytest_mock import MockerFixture
from unittest.mock import Mock

from zoorl.core.usecases.create_url_hash import (
    CreateUrlHashUseCase,
    CreateUrlHashUseCaseRequest,
    CreateUrlHashUseCaseResponse,
    DEFAULT_TTL
)

from zoorl.core.model import UrlHashRepository

# Shortcut for the package that contains a few functions we want to mock
ZOORL_PACKAGE = "zoorl.core.usecases.create_url_hash"


@pytest.fixture(autouse=True)
def mock_compute_epoch_time_from_ttl(module_mocker: MockerFixture) -> Mock:
    """Mock 'compute_epoch_time_from_ttl' function to return always return the same TTL specified as input value."""
    return module_mocker.patch(
        ZOORL_PACKAGE + ".compute_epoch_time_from_ttl", side_effect=lambda ttl: ttl
    )


@pytest.fixture(autouse=True)
def mock_compute_hash(module_mocker: MockerFixture) -> Mock:
    """Mock 'compute_hash' function to return values from a predictable sequence."""
    return module_mocker.patch(
        ZOORL_PACKAGE + ".compute_hash", side_effect=["123", "456", "789"]
    )


@pytest.fixture
def mock_url_hash_repository(mocker: MockerFixture) -> Mock:
    """Mock repository."""
    
    return mocker.Mock(spec=UrlHashRepository)


@pytest.fixture
def usecase(mock_url_hash_repository: UrlHashRepository) -> CreateUrlHashUseCase:
    """Use case fixture."""
    
    return CreateUrlHashUseCase(mock_url_hash_repository)


@pytest.mark.parametrize("uc_request,expected_uc_response", [
    (
        CreateUrlHashUseCaseRequest(url = "http://www.test-without-ttl.com"), 
        CreateUrlHashUseCaseResponse(url_hash = "123", url = "http://www.test-without-ttl.com", ttl = DEFAULT_TTL)
    ),
    (
        CreateUrlHashUseCaseRequest(url = "http://www.test-with-explicit-ttl.com", ttl = 48), 
        CreateUrlHashUseCaseResponse(url_hash = "123", url = "http://www.test-with-explicit-ttl.com", ttl = 48)
    )
])
def test_create_url_hash(usecase: CreateUrlHashUseCase, uc_request: CreateUrlHashUseCaseRequest, expected_uc_response: CreateUrlHashUseCaseResponse) -> None:
    """Verify that creating a URL hash works, with or without specifying a TTL."""

    response = usecase.create(uc_request)

    assert response == expected_uc_response
