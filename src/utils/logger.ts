/**
 * Logger configuration
 */

import { Logger } from '@aws-lambda-powertools/logger';

export const logger = new Logger({
  serviceName: 'zoorl',
  logLevel: process.env.LOG_LEVEL as Logger['logLevel'] || 'INFO'
});