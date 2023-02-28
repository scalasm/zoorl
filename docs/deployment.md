# Deployment

There are two stacks within this application:
- **Personal application stack** (`ZoorlPersonalStack`) - this is a stack
developers can deploy within their sandbox and play with it.
- **CI/CD pipeline stack**  (`ZoorlPipelineStack`) - this is the pipeline
stack that will create a CodePipeline instance with all stages configured
according to the `Activate Workshop` configuration.

# Deploy the Personal application stack

```
aws sso login --profile development

npm run cdk:deploy -- ZoorlPersonalStack --profile development
```

# Deploy the CI/CD Pipeline stack

```
aws sso login --profile cicd

npm run cdk:deploy -- ZoorlPipelineStack --profile cicd
```

The pipeline is configured to listed to changes on the `main` branch of 
the GitHub repository (you can edit the cdk.json file, if needed).

# F.A.Q.

## Error when deploying/destroying the CI/CD pipeline 

If you get something like `Token expired, run "aws sso login --profile cicd && npx cdk-sso-sync cicd"` then 
see How to use AWS CDK with AWS SSO & Profiles](https://www.matscloud.com/blog/2020/06/25/how-to-use-aws-cdk-with-aws-sso-profiles/).

A convenience tweaked script is provided in this directory and here is how to use it:
```
aws sso login –-profile cicd
python3 docs/aws_sso.py cicd
cdk deploy --profile cicd PipelineStack
```
