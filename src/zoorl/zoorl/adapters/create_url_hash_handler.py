"""AWS Lambda adapter for executing the use case for creating a new URL hash."""

from typing import Any

from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.logging import correlation_paths

from zoorl.adapters.lambda_support import app, tracer, logger, url_hash_repository

from zoorl.core.usecases.create_url_hash import (
    CreateUrlHashUseCaseRequest,
    CreateUrlHashUseCase
)

usecase = CreateUrlHashUseCase(
    url_hash_repository=url_hash_repository
)

@app.post("/u")
@tracer.capture_method
def handle() -> dict:
    """Wraps the use case for creating a new URL hash.

    Note that we directly extract the JSON payload from the body and perform our operations. 
    API gateway has already performed input validation so we guarenteed to have the required
    fields when this is executed.

    Returns:
        the payload for URL redirection, including the expiration time.
    """
    
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
    """AWS Lambda entry point function.

    Note that we relay on AWS Lambda Powertools for Python to process our 
    response and set fields when needed.

    Arguments:
        event: the APIGateway event payload 
        context: Lambda context (e.g., environment variables)

    Returns:
        Response suitable for being processed by API Gateway.
    """

    logger.debug(f"Correlation ID => {logger.get_correlation_id()}")
    
    return app.resolve(event, context)
