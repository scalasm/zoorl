/**
 * AWS Lambda adapter for implementing the read URL hash use case
 * 
 * This adapter will invoke the use case, and return the URL hash information
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import { captureLambdaHandler, captureMethod } from '@aws-lambda-powertools/tracer';
import { logger } from '../../utils/logger';
import { tracer } from '../../utils/tracer';
import { ReadUrlHashUseCase, UrlHashNotFoundError } from '../../usecases/read-url-hash.usecase';
import { urlHashRepository } from '../../utils/dependencies';

const usecase = new ReadUrlHashUseCase(urlHashRepository);

/**
 * Returns the URL Hash data for the specified resource
 * 
 * @param event - API Gateway event
 * @returns the URL hash information or error response
 */
export const readUrlHashHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const urlHash = event.pathParameters?.url_hash;
    
    if (!urlHash) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'URL hash parameter is required' })
      };
    }
    
    logger.info(`Returning URL for hash "${urlHash}"`);
    
    const response = await usecase.readUrl({ hash: urlHash });
    
    logger.info(`Got response for hash "${urlHash}": ${response.url}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        url_hash: response.url_hash,
        url: response.url,
        ttl: response.ttl
      })
    };
  } catch (error) {
    if (error instanceof UrlHashNotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: error.message })
      };
    }
    
    logger.error('Unexpected error', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

// Export the handler with middleware
export const handler = middy(readUrlHashHandler)
  .use(injectLambdaContext(logger, { clearState: true }))
  .use(captureLambdaHandler(tracer));