# Zoorl business logic 

Zoorl business logic is implemented using clean architecture package layout with some caveats.

# Directory structure
- `zoorl` - is the root package for the application
- `tests` - is the root folder for tests

# Bussiness logic

There are three main packages
- `core` - contains data model entities, use cases and utility classes
- `port` - contains the lambda functions that invoke the use cases and deal with AWS concerns like metrics. 
- `adapter` - contains the adapters for accessing data (essentially DynamoDB)

# Limits and compromises

- We use [AWS Lambda Powertools]() in order to improve system observability but this has some caveats 
since we may find undeserirable dependencies from 3rd party system inside the application. 
  - As long as possible, we will limit these concerns (e.g., metrics) to ports and adapters, not the core packages.
- We use Python Type Hints for Boto3 but this impacts over runtime performance by making execution 4 times slower 
  and about 20% more memory-consuming
  - No solution - for now having type hints is more important than performances.
  