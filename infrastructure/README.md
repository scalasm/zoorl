# Zoorl AWS infrastructure 

This is the CDK app for the Zoorl infrastructure. It contains the definition for the networking, security,
DynamoDB tables, and function definitions.

Note that the Lambda functions code is host inside the `src` folder in project root.

# How to deploy the stack 

## Inside the current accoutn for a profile
```
npm run cdk:deploy -- --profile development
```