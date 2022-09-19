from typing import Any
import boto3  
import os

from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.logging import correlation_paths

from zoorl.adapters.dynamodb_model import DynamoDBUrlHashRepository

from zoorl.core.usecases.create_url_hash import (
    CreateUrlHashUseCaseRequest,
    CreateUrlHashUseCase
)

tracer = Tracer()
logger = Logger()
app = APIGatewayRestResolver()

dynamodb = boto3.resource("dynamodb")

usecase = CreateUrlHashUseCase(
    url_hash_repository=DynamoDBUrlHashRepository(
        dynamodb.Table(
            os.getenv("URL_HASHES_TABLE")
        )
    )
)

@app.post("/u")
@tracer.capture_method
def handle() -> dict:
    payload: dict[str, Any] = app.current_event.json_body  # deserialize json str to dict

    response = usecase.create(
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
