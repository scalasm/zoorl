"""AWS Lambda adapter for implementing the redirection use case.

This adapter will invoke the use case for reading the hash and 
provide two different behaviors:
  1. /u/{url_hash} - will return the JSON object associated to the 
    URL hash or HTTP 404 if not found  
  2. /r/{url_hash} - will perform HTTP 301 redirect by setting the 
    location header in the repose

Case 1 if for clients while case 2 actually performs the desired
redirect behavior of inducing the client web browser to perform 
redirection to the mapped site.
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
from zoorl.core.usecases.read_url_hash import UrlHashNotFoundError
from zoorl.adapters import http_response_codes

tracer = Tracer()
logger = Logger()
app = APIGatewayRestResolver()

dynamodb = boto3.resource("dynamodb")

url_hash_repository = DynamoDBUrlHashRepository(
    dynamodb.Table(
        os.getenv("URL_HASHES_TABLE")
    )
)

@app.exception_handler(UrlHashNotFoundError)
def handle_invalid_limit_qs(ex: UrlHashNotFoundError) -> Response:
    """Returns a HTTP 404 response is the the requested URL hash is not found. 
     
    The use case will throw this exception if not such URL hash is found,
    so we are only intercepting that exception and acting accordingly.
    
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
