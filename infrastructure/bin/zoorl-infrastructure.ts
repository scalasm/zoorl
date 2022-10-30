#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";

import { ZoorlApplicationStack } from "../lib/zoorl-application-stack";
import { ZoorlPipelineStack } from "../lib/cicd/pipeline-stack";

const app = new cdk.App();

// This is an application stack for personal development - it is separated from 
// the other staged stacks that will be handled by the pipeline.
new ZoorlApplicationStack(app, "ZoorlPersonalStack", {
  stage: "personal",
});

// CI/CD pipeline stack
const pipelineStack = new ZoorlPipelineStack(app, "ZoorlPipelineStack");

// The permission boudary leverages the one defined at the bootstrap of the environments
// This is from:
// * the AWS Activate Workshop (https://catalog.us-east-1.prod.workshops.aws/workshops/13304db2-f715-48bf-ada0-92e5c4eea945/en-US/040-cicd/20-add-pipeline)
// * Adapted from https://stackoverflow.com/a/72743464
const permissionBoundaryArn = cdk.Fn.importValue('CICDPipelinePermissionsBoundaryArn');

const boundary = iam.ManagedPolicy.fromManagedPolicyArn(pipelineStack, 'Boundary', permissionBoundaryArn);
iam.PermissionsBoundary.of(pipelineStack).apply(boundary);
