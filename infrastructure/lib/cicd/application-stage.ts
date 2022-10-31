// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as cdk from "aws-cdk-lib";
import { ZoorlApplicationStack } from "../zoorl-application-stack";
import { Construct } from "constructs";

/**
 * Deployable unit collecting all required stacks for our application (e.g., frontend and backend in dev/prod environments).
 */
export class ApplicationStage extends cdk.Stage {
  public readonly apiUrlOutput: cdk.CfnOutput;

  public readonly userPoolIdOutput: cdk.CfnOutput;
  public readonly userPoolClientIdOutput: cdk.CfnOutput;
  public readonly identityPoolIdOutput: cdk.CfnOutput;
  public readonly regionOutput: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const applicationStack = new ZoorlApplicationStack(this, "application-stack", {
      stage: "dev",
    });

    // Expose application details for this stage: API URL and auth
    // this.apiUrlOutput = applicationStack.apiStack.apiUrlOutput;

    // this.identityPoolIdOutput = applicationStack.authStack.identityPoolIdOutput;
    // this.userPoolClientIdOutput = applicationStack.authStack.userPoolClientIdOutput;
    // this.userPoolIdOutput = applicationStack.authStack.userPoolIdOutput;
    // this.regionOutput = applicationStack.authStack.regionOutput;
  }
}
