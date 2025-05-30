/**
 * AWS Lambda adapter for executing the use case for creating a new URL hash
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import { logger } from '../../utils/logger';
import { tracer } from '../../utils/tracer';
import { CreateUrlHashUseCase } from '../../usecases/create-url-hash.usecase';
import { urlHashRepository } from '../../utils/dependencies';
import { CreateUrlHashRequest } from '../../dto/url-hash.dto';

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
  .use(httpJsonBodyParser())
  .use(injectLambdaContext(logger, { clearState: true }))
  .use(captureLambdaHandler(tracer));