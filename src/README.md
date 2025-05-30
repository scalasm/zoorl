# Zoorl TypeScript Implementation

This directory contains the TypeScript implementation of the Zoorl URL shortener service, following a hexagonal architecture pattern tailored for AWS Lambda functions.

## Project Structure

- `adapters/` - Contains primary and secondary adapters
  - `primary/` - Lambda function handlers using Middy and AWS Lambda Powertools
  - `secondary/` - Repository implementations for data access
- `dto/` - Data Transfer Objects for requests and responses
- `usecases/` - Core business logic
- `utils/` - Utility functions and shared dependencies

## Development

1. Install dependencies:
```
npm install
```

2. Build the project:
```
npm run build
```

3. Run tests:
```
npm test
```

## Architecture

The project follows a hexagonal architecture pattern:

- Core business logic is isolated in the `usecases/` directory
- External interfaces are defined in the `adapters/` directory
- Data structures are defined in the `dto/` directory
- Dependencies are injected through constructors

## AWS Lambda Handlers

- `create-url-hash.adapter.ts` - Creates a new URL hash
- `read-url-hash.adapter.ts` - Reads a URL hash
- `redirect.adapter.ts` - Redirects to the original URL