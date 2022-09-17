import boto3  
import os
import json

from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools import Logger

from zoorl.adapters.dynamodb_model import DynamoDBUrlHashRepository

from zoorl.core.usecases.create_url_hash import (
    CreateUrlHashUseCaseRequest,
    CreateUrlHashUseCaseResponse,
    CreateUrlHashUseCase
)

dynamodb = boto3.resource("dynamodb")

usecase = CreateUrlHashUseCase(
    url_hash_repository=DynamoDBUrlHashRepository(
        dynamodb.Table(
            os.getenv("URL_HASHES_TABLE")
        )
    )
)

logger = Logger()

def handle(event: dict, context: LambdaContext) -> dict:
    try:
        response = usecase.create(
            CreateUrlHashUseCaseRequest(
                url = event.get("url", None),
                ttl = event.get("ttl", None)
            )
        )

        return {
            "statusCode": "200",
            "contentType": "application/json",
            "body": json.dumps({
                "hash": response.url_hash,
                "url": response.url,
                "ttl": response.ttl
            })
        }
    except Exception as e: 
        return {
            "statusCode": "500",
            "contentType": "application/json",
            "body": json.dumps({
                "message": "Something bad happened: " + str(e)
            })
        }
