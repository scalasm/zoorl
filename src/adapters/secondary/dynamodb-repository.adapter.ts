/**
 * DynamoDB implementation of the UrlHash repository
 */

import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { UrlHashDto } from '../../dto/url-hash.dto';
import { UrlHashRepository } from './repository.adapter';

export class DynamoDBUrlHashRepository implements UrlHashRepository {
  constructor(
    private readonly docClient: DynamoDBDocumentClient,
    private readonly tableName: string
  ) {}

  async save(urlHash: UrlHashDto): Promise<void> {
    const item = {
      PK: urlHash.hash,
      SK: urlHash.hash,
      url: urlHash.url,
      ttl: urlHash.ttl.toString()
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item
      })
    );
  }

  async getByHash(hash: string): Promise<UrlHashDto | undefined> {
    const response = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: hash,
          SK: hash
        }
      })
    );

    if (!response.Item) {
      return undefined;
    }

    const item = response.Item;
    return {
      hash: item.PK,
      url: item.url,
      ttl: parseInt(item.ttl)
    };
  }
}