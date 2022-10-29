// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as cdk from "aws-cdk-lib";
import * as pipelines from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";

/**
 * CI/CD pipeline.
 */
export class ZoorlPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Set your Github username and repository name
    const branch = "7-create-cicd-pipeline";
    const gitHubUsernameRepository = "scalasm/zoorl";

    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      pipelineName: "MyCDKPipeline",
      synth: new pipelines.CodeBuildStep("SynthStep", {
        input: pipelines.CodePipelineSource.gitHub(gitHubUsernameRepository, branch, {
          authentication: cdk.SecretValue.secretsManager("GITHUB_TOKEN"),
        }),
        installCommands: ["npm install -g aws-cdk"],
        commands: [
            "cd infrastructure/", 
            "npm ci", 
            "npm run build", 
            "npx cdk synth"
        ],
      }),
    });
    // Pipeline code goes here
  }
}
