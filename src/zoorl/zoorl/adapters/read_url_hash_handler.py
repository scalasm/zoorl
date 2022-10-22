"""AWS Lambda adapter for implementing the redirection use case.

This adapter will invoke the use case, and format the HTTP response to instruct
the client web browser to perform redirection to the mapped site.
"""

from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.utilities.data_classes.api_gateway_authorizer_event import APIGatewayAuthorizerRequestEvent
from aws_lambda_powertools.logging import correlation_paths

from zoorl.core.usecases.read_url_hash import (
    ReadUrlHashUseCase,
    ReadUrlHashUseCaseRequest
)
from zoorl.adapters.lambda_support import app, tracer, logger, url_hash_repository

usecase = ReadUrlHashUseCase(
    url_hash_repository=url_hash_repository
)

@app.get("/u/<url_hash>")
@tracer.capture_method
def handle(url_hash: str) -> dict:
    """Returns the URL Hash data for the specified resource.
    
    Arguments:
        url_hash: the desired URL hash

    Returns:
        the URL hash information.   
    
    Raises:
        UrlHashNotFoundError: if the hash was not found
    """
    
    logger.info(f"Returning URL for hash \"{url_hash}\" .")

    response = usecase.read_url(ReadUrlHashUseCaseRequest(hash = url_hash))

    logger.info(f"Got response for hash \"{url_hash}\": {response.url} .")

    return {
        "url_hash": response.url_hash,
        "url": response.url,
        "ttl": response.ttl
    }


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
def handle(event: APIGatewayAuthorizerRequestEvent, context: LambdaContext) -> dict:
    """AWS Lambda entry point function.

    Note that we relay on AWS Lambda Powertools for Python to process our 
    response and set fields when needed.

    Arguments:
        event: the APIGateway event payload 
        context: Lambda context (e.g., environment variables)

    Returns:
        Response suitable for being processed by API Gateway.
    """

    logger.info(f"Context \"{context}\" .")

    logger.debug(f"Correlation ID => {logger.get_correlation_id()}")
    
    response = app.resolve(event, context)

    logger.info(f"Response \"{response}\" .")

    return response
