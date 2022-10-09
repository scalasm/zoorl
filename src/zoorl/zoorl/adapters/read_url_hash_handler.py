"""AWS Lambda adapter for implementing the redirection use case.

This adapter will invoke the use case, and format the HTTP response to instruct
the client web browser to perform redirection to the mapped site.
"""
import boto3  
import json
import os

from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.utilities.data_classes.api_gateway_authorizer_event import APIGatewayAuthorizerRequestEvent
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import (
    APIGatewayRestResolver,
    Response, 
    content_types
)
from aws_lambda_powertools.logging import correlation_paths

from zoorl.adapters.dynamodb_model import DynamoDBUrlHashRepository
from zoorl.core.usecases.read_url_hash import (
    ReadUrlHashUseCase,
    ReadUrlHashUseCaseRequest,
    UrlHashNotFoundError
)
from zoorl.adapters import http_response_codes

tracer = Tracer()
logger = Logger()
app = APIGatewayRestResolver()

dynamodb = boto3.resource("dynamodb")

usecase = ReadUrlHashUseCase(
    url_hash_repository=DynamoDBUrlHashRepository(
        dynamodb.Table(
            os.getenv("URL_HASHES_TABLE")
        )
    )
)

@app.get("/u/<url_hash>")
@tracer.capture_method
def handle(url_hash: str) -> Response:
    """Returns the HTTP 301 response that will trigger redirection.
    
    On receiving an HTTP 301 response and 'Location' header, we trigger the 
    client web browser to perform redirection to the specified page.
    
    Arguments:
        url_hash: the desired URL hash

    Returns:
        The configured HTTP 301 Permanently Moved 'Response' object object    
    
    Raises:
        UrlHashNotFoundError: if the hash was not found
    """
    
    logger.info(f"Returning URL for hash \"{url_hash}\" .")

    response = usecase.read_url(ReadUrlHashUseCaseRequest(hash = url_hash))

    logger.info(f"Got response for hash \"{url_hash}\": {response.url} .")

    return Response(
        status_code = http_response_codes.MOVED_PERMANENTLY,
        headers = {
            "Location": response.url
        },
        content_type = content_types.TEXT_HTML, # We always redirect to another HTML page
        body = None # there is no body, but the argument is mandatory
    )


@app.exception_handler(UrlHashNotFoundError)
def handle_invalid_limit_qs(ex: UrlHashNotFoundError) -> Response:
    """Returns a HTTP 404 is the the requested URL hash is not found.
    
    Arguments:
        ex: the exception

    Returns:
        The configured HTTP 404 'Response' object    
    """

    metadata = {"path": app.current_event.path, "query_strings": app.current_event.query_string_parameters}
    logger.error(f"Malformed request: {ex}", extra=metadata)

    return Response(
        status_code = http_response_codes.NOT_FOUND,
        content_type = content_types.APPLICATION_JSON,
        body = json.dumps({
            "message": str(ex)
        })
    )

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
