/**
 * Dependencies configuration
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBUrlHashRepository } from '../adapters/secondary/dynamodb-repository.adapter';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Initialize repository
export const urlHashRepository = new DynamoDBUrlHashRepository(
  docClient,
  process.env.URL_HASHES_TABLE || 'url-hashes'
);