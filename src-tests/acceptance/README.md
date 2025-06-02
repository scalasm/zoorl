# Integration Tests for Zoorl API

This directory contains integration tests for the Zoorl URL shortener API secured with Amazon Cognito.

## Prerequisites

1. The application must be deployed to AWS using `npm run deploy` command
2. The deployment must generate a `cdk-outputs.json` file with the necessary outputs

## Running the Tests

To run the integration tests:

```bash
npm run test:integration
```

## Test Flow

1. Before tests:
   - Creates a test user in the Cognito user pool
   - Authenticates with the test user credentials
   - Gets the JWT token for API requests

2. Tests:
   - Create a short URL and verify it exists
   - Create a short URL with custom TTL and verify it exists

3. After tests:
   - Deletes the test user from the Cognito user pool

## Configuration

Test configuration is stored in `config.ts`. The tests use environment variables that are loaded from the CDK outputs file.

Required environment variables:
- USER_POOL_ID
- USER_POOL_CLIENT_ID
- IDENTITY_POOL_ID
- API_URL
- AWS_REGION

These are automatically loaded from the `cdk-outputs.json` file by the `setup-env.ts` script.