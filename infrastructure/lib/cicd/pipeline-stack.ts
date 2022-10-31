// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as pipelines from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";

import { ApplicationStage } from "./application-stage";
import { OrganizationsHelper } from "./pipeline-helpers";

/**
 * CI/CD pipeline.
 */
export class ZoorlPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Set your Github username and repository name
    const githubSettings = this.node.tryGetContext("github");

    const branch = githubSettings["repo_branch"] as string;
    const gitHubUsernameRepository = `${githubSettings["alias"]}/${githubSettings["repo_name"]}`;

    const synthStep = new pipelines.CodeBuildStep("SynthStep", {
      input: pipelines.CodePipelineSource.gitHub(gitHubUsernameRepository, branch, {
        authentication: cdk.SecretValue.secretsManager("GITHUB_TOKEN"),
      }),
      installCommands: [
        "npm install -g aws-cdk"
      ],
      commands: [
        "cd infrastructure/",
        "npm ci",
        "npm run build",
        "npm --version",
        "cdk synth ZoorlPipelineStack"
      ],
      primaryOutputDirectory: "infrastructure/cdk.out"
    });

    const pipelineName = "zoorl-pipeline";

    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      pipelineName: pipelineName,
      // We deploy to multiple accounts and they need to share the encryption key for the artifacts bucket
      crossAccountKeys: true,
      synth: synthStep,
      // We use docker to build our Lambda functions
      dockerEnabledForSynth: true,
      synthCodeBuildDefaults: {
        // This pipeline will need to enumerate the accounts in the organization in order to synthesize the deployment stages.
        rolePolicy: [
          new iam.PolicyStatement({
            actions: [
              "organizations:ListAccounts", 
              "organizations:ListTagsForResource"
            ],
            resources: ["*"],
          }),
        ],
      },
    });

    new OrganizationsHelper()
      .forEachStage((stageDetails) => {

        const preSteps = [];

        if (stageDetails.name === "production") {
          preSteps.push(
            new pipelines.ManualApprovalStep("PromoteToProd")
          );
        }

        pipeline.addStage(
          new ApplicationStage(this, stageDetails.name, {
            stageName: stageDetails.name,
            env: {
              account: stageDetails.accountId
            }
          }), 
          {
            pre: preSteps,
          }
        );
    });

    new cdk.CfnOutput(this, "PipelineConsoleUrl", {
      value: `https://${
        cdk.Stack.of(this).region
      }.console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipelineName}/view?region=${
        cdk.Stack.of(this).region
      }`,
    });
  }
}
