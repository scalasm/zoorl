# Zoorl architecture guidelines

- Zoorl is a serverless application based on AWS technology.
- it leverages AWS CDK best practices and patterns, reusing existing constructs provide by Amazon, by the CDK community, and defining its own in this codebase.
- it provides a REST API through use of AWS API Gateway, and secured by AWS 

# Repository structure
- Source code is hosted on a Git repo host on github.com - it is a public repository accessed through SSH key when developing locally.

- The same code repository includes both infrastructure (VPC, lambda functions, queues, AWS Step Functions workflows, ...) and application source code.
- The repository structure is the following:
  - `root folder` includes README.md and other project configuration data, like 
  - `openapi` folder includes the definition of any REST API it may need to be implemented
  - `src` folder includes the application code, implemented following a variation of hexagonal architecture tailored for Lambda functions and serverless mindset.
  - `infrastructure` folder contains the CDK app itself
  - `acceptance-tests` folder contains automated tests that are run against target AWS environments

# Application code 

- Application code is writted in Typescript, and it consists mainly of Lambda function handlers, utilities, and use cases, consistent with hexagonal architecture.

Under the `src` folder we have the following structure
- `adapters`folder contains primary adapters, 
  - `primary` contains the Lambda function handlers, implemented using the [Middy](https://middy.js.org/) and [Powertools for AWS Lambda (TypeScript)](https://docs.powertools.aws.dev/lambda/typescript/latest/), with latest compatible versions.
  - standard PowerTools's features for primary adapters are tracer, logger, and validations. Other features, like idempotency and metrics, may be included if useful for the functionality.
  - `secondary` contain the repositories that provide abstractions for data access to external, event publishing through AWS Event Bridge, publishing or reading queues, etc.
- Naming convention for adapters is `<adapter name>.adapter.ts`
- `dto` folder contains DTOs representing request and reponses for both lambda functions and repository
  - Naming convention is `<usecase name>.dto.ts`
- `usecases` contain the use cases code called by the lambda function adapters. 
  - These are pure Typescript code that will received and produce DTOs, using secondary adapters as needed.
  - Naming convention is `<usecase name>.usecase.ts` 

# Security
- REST API is secured through a custom Cognito user pool that is deployed as part of the infrastructure.
- an `admin` user is created as part of the infrastructure creation with a default password

# Testing strategy

We test infrastructure definition using CDK best practices.
 - Infrastructure code is stored in the `test` folder, mimicking the same folder structure as tested file. For example: tests for `lib/zoorl-application-stack.ts` are in `test/zoorl-application-stack.test.ts`

We test Typescript code using Jest, and favour use of interfaces for decoupling code. For example, we want our usecases to deal with secondary adapters only through interfaces.
 - Application code tests are side to side wit the code. For example, tests for `usecases/get-url-mapping.usecase.ts` is `usecases/get-url-mapping.usecase.test.ts`

# CI/CD
** IGNORE THIS SECTION - I AM STILL WORKING ON IT **
- There are three target environments for deployment
 - `develop` is the test environment - changes to `main` branch are immediately built and deployed here
 - `staging` is a certification environment, the same code built and deployed to `develop` will be promoted to `staging` after manual approval step by developer
 - `production` is the production environment, where manual approval is required.

 These environments may share the same AWS account or deployed to separate environments: the configuration must allow that, both in terms of paramenters and any IAM permission required.

- we use CDK Pipelines and related AWS tools for implementing our CI/CD strategy

# Local development
Developers must be able to run a local stack using [Localstack](https://www.localstack.cloud/) and deploy to a target AWS environment.


