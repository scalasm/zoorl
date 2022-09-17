import boto3  
import os
import json

from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools import Logger

from zoorl.adapters.dynamodb_model import DynamoDBUrlHashRepository

from zoorl.core.usecases.read_url_hash import (
    ReadUrlHashUseCase,
    ReadUrlHashUseCaseRequest,
    UrlHashNotFoundError
)

logger: Logger = Logger()

dynamodb = boto3.resource("dynamodb")

usecase = ReadUrlHashUseCase(
    url_hash_repository=DynamoDBUrlHashRepository(
        dynamodb.Table(
            os.getenv("URL_HASHES_TABLE")
        )
    )
)

def handle(event: dict, context: LambdaContext) -> dict:
    url_hash = event.get("url_hash", None)

    try:
        response = usecase.read_url(ReadUrlHashUseCaseRequest(hash = url_hash))

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
