/**
 * AWS Lambda adapter for executing the use case for creating a new URL hash
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';

import middy from '@middy/core';

import { CreateUrlHashUseCase } from '../../usecases/create-url-hash.usecase';
import { urlHashRepository } from '../../utils/dependencies';
import { CreateUrlHashRequest } from '../../dto/url-hash.dto';

const logger = new Logger();
const tracer = new Tracer();
const metrics = new Metrics();

const usecase = new CreateUrlHashUseCase(urlHashRepository);

/**
 * Wraps the use case for creating a new URL hash
 * 
 * Note that we directly extract the JSON payload from the body and perform our operations.
 * API gateway has already performed input validation so we are guaranteed to have the required
 * fields when this is executed.
 * 
 * @param event - API Gateway event
 * @returns the payload for URL redirection, including the expiration time
 */
export const createUrlHashHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const payload = event.body as unknown as Record<string, any>;
  
  const response = await usecase.create({
    url: payload.url,
    ttl: payload.ttl
  } as CreateUrlHashRequest);

  return {
    statusCode: 200,
    body: JSON.stringify({
      url_hash: response.url_hash,
      url: response.url,
      ttl: response.ttl
    })
  };
};

// Export the handler with middleware
export const handler = middy(createUrlHashHandler)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));