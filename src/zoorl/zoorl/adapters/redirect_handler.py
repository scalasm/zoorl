"""AWS Lambda adapter for implementing the redirection use case.

This adapter will invoke the use case for reading the URL hash 
and will perform HTTP 301 redirect by setting the  location header
in the reponse.

This will trigger the client web browser to perform redirection 
to the mapped site.
"""

from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.utilities.data_classes.api_gateway_authorizer_event import APIGatewayAuthorizerRequestEvent
from aws_lambda_powertools.event_handler import (
    Response, 
    content_types
)
from aws_lambda_powertools.logging import correlation_paths

from zoorl.core.usecases.read_url_hash import (
    ReadUrlHashUseCase,
    ReadUrlHashUseCaseRequest
)
from zoorl.adapters import http_response_codes
from zoorl.adapters.lambda_support import app, tracer, logger, url_hash_repository

usecase = ReadUrlHashUseCase(
    url_hash_repository=url_hash_repository
)

@app.get("/r/<url_hash>")
@tracer.capture_method
def handle_redirect(url_hash: str) -> Response:
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
