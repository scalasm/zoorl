/**
 * AWS Lambda adapter for implementing the redirection use case
 * 
 * This adapter will invoke the use case for reading the URL hash
 * and will perform HTTP 301 redirect by setting the location header
 * in the response.
 * 
 * This will trigger the client web browser to perform redirection
 * to the mapped site.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';

import middy from '@middy/core';

import { ReadUrlHashUseCase, UrlHashNotFoundError } from '../../usecases/read-url-hash.usecase';
import { urlHashRepository } from '../../utils/dependencies';

const logger = new Logger();
const tracer = new Tracer();
const metrics = new Metrics();

const usecase = new ReadUrlHashUseCase(urlHashRepository);

/**
 * Returns the HTTP 301 response that will trigger redirection
 * 
 * On receiving an HTTP 301 response and 'Location' header, we trigger the
 * client web browser to perform redirection to the specified page.
 * 
 * @param event - API Gateway event
 * @returns The configured HTTP 301 Permanently Moved response
 */
export const redirectHandler = async (
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
      statusCode: 301,
      headers: {
        'Location': response.url,
        'Content-Type': 'text/html'
      },
      body: ''
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
export const handler = middy(redirectHandler)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer));