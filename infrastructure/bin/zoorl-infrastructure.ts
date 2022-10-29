#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";

import { ZoorlInfrastructureStack } from "../lib/zoorl-infrastructure-stack";
import { ZoorlPipelineStack } from "../lib/cicd/pipeline-stack";

// import { AddPermissionsBoundaryToRoles } from "../lib/permission-boundary";

const app = new cdk.App();
new ZoorlInfrastructureStack(app, "ZoorlInfrastructureStack", {
  stage: "dev",
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

const pipelineStack = new ZoorlPipelineStack(app, "ZoorPipelineStack", {
  // Nothing for now
});

// The permission boudary leverages the one defined at the bootstrap of the environments
// This is from:
// * the AWS Activate Workshop (https://catalog.us-east-1.prod.workshops.aws/workshops/13304db2-f715-48bf-ada0-92e5c4eea945/en-US/040-cicd/20-add-pipeline)
// * Adapted from https://stackoverflow.com/a/72743464
const permissionBoundaryArn = cdk.Fn.importValue('CICDPipelinePermissionsBoundaryArn');

const boundary = iam.ManagedPolicy.fromManagedPolicyArn(pipelineStack, 'Boundary', permissionBoundaryArn);
iam.PermissionsBoundary.of(pipelineStack).apply(boundary);
