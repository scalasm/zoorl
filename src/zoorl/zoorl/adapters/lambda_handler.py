from typing import Any, Dict
import boto3  
import os

from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.logging import correlation_paths

from zoorl.adapters.dynamodb_model import DynamoDBUrlHashRepository

from zoorl.core.usecases.read_url_hash import (
    ReadUrlHashUseCase,
    ReadUrlHashUseCaseRequest
)

from zoorl.core.usecases.create_url_hash import (
    CreateUrlHashUseCaseRequest,
    CreateUrlHashUseCase
)

tracer = Tracer()
logger = Logger()
app = APIGatewayRestResolver()

dynamodb = boto3.resource("dynamodb")

url_hash_repository = DynamoDBUrlHashRepository(
    dynamodb.Table(
        os.getenv("URL_HASHES_TABLE")
    )
)

create_url_hash = CreateUrlHashUseCase(
    url_hash_repository=url_hash_repository
)

read_url_hash = ReadUrlHashUseCase(
    url_hash_repository=url_hash_repository
)

@app.get("/u/<url_hash>")
@tracer.capture_method
def handle(url_hash: str) -> dict:
    """Returns the URL associated to the given hash."""
    logger.info(f"Returning URL for hash \"{url_hash}\" .")

    response = read_url_hash.read_url(ReadUrlHashUseCaseRequest(hash = url_hash))

    logger.info(f"Got response for hash \"{url_hash}\": {response.url} .")

    return {
        "url": response.url
    }

@app.post("/u")
@tracer.capture_method
def handle() -> dict:
    payload: dict[str, Any] = app.current_event.json_body  # deserialize json str to dict

    response = create_url_hash.create(
        CreateUrlHashUseCaseRequest(
            url = payload.get("url", None),
            ttl = payload.get("ttl", None)
        )
    )

    return {
        "url_hash": response.url_hash,
        "url": response.url,
        "ttl": response.ttl
    }

@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
def handle(event: dict, context: LambdaContext) -> dict:
    logger.debug(f"Correlation ID => {logger.get_correlation_id()}")
    
    return app.resolve(event, context)
