import boto3  
import os
import json

from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver
from aws_lambda_powertools.logging import correlation_paths

from zoorl.adapters.dynamodb_model import DynamoDBUrlHashRepository

from zoorl.core.usecases.read_url_hash import (
    ReadUrlHashUseCase,
    ReadUrlHashUseCaseRequest,
    UrlHashNotFoundError
)

#tracer = Tracer()
logger = Logger()
#app = APIGatewayHttpResolver()

dynamodb = boto3.resource("dynamodb")

usecase = ReadUrlHashUseCase(
    url_hash_repository=DynamoDBUrlHashRepository(
        dynamodb.Table(
            os.getenv("URL_HASHES_TABLE")
        )
    )
)

# @app.get("/u/<url_hash>")
# @tracer.capture_method
# def handle(url_hash: str) -> dict:
#     """Returns the URL associated to the given hash."""
#     logger.info(f"Returning URL for hash \"{url_hash}\" .")

#     response = usecase.read_url(ReadUrlHashUseCaseRequest(hash = url_hash))

#     logger.info(f"Got response for hash \"{url_hash}\": {response.url} .")

#     return {
#         "url": response.url
#     }

#@logger.inject_lambda_context(correlation_id_path=correlation_paths.LAMBDA_FUNCTION_URL)
#@tracer.capture_lambda_handler
# def handle(event: dict, context: LambdaContext) -> dict:
#     logger.debug(f"Correlation ID => {logger.get_correlation_id()}")
    
#     return app.resolve(event, context)
def handle(event: dict, context: LambdaContext) -> dict:
    try:
        logger.info(f"Got Event: \"{event}\" .")

        url_hash = event["pathParameters"]["url_hash"]

        logger.info(f"Returning URL for hash \"{url_hash}\" .")

        response = usecase.read_url(ReadUrlHashUseCaseRequest(hash = url_hash))

        logger.info(f"Got response for hash \"{url_hash}\": {response.url} .")

        return {
            "statusCode": "200",
            "contentType": "application/json",
            "body": json.dumps({
                "url": response.url
            })
        }
    except UrlHashNotFoundError as e:
        return {
            "statusCode": "404",
            "contentType": "application/json",
            "body": json.dumps({
                "message": "Hash does not exist or it has expired!"
            })
        }
    except Exception as e:
        return {
            "statusCode": "500",
            "contentType": "application/json",
            "body": json.dumps({
                "message": "Whops: " + str(e)
            })
        }