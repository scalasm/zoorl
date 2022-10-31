// Copyright Mario Scalas 2021. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { config, SharedIniFileCredentials, Organizations } from "aws-sdk";

/**
 * Represents the information about the stage currently being processed by the OrganizationsHelper instance.
 */
export class StageDetails {
  constructor(public name: string, public accountId: string, public order: string) {}
}

/**
 * Herlper class that helps processing accounts in the current organizations in order to perform some
 * additional tasks (e.g., creating new application deployment stages).
 */
export class OrganizationsHelper {
  /**
   * Iterates the given action across all stages (typical use case is creating different application deployment stages). This code
   * is an adaptation from  https://activate.workshop.aws/040_cicd/steps/22-add-pipeline.html#add-the-stages .
   * @param action the action to be performed (e.g., create a new deplyment stage)
   */
  forEachStage(action: (stageDetails: StageDetails) => void): void {
    const AWS_PROFILE = "cicd";
    if (!process.env.CODEBUILD_BUILD_ID) {
      config.credentials = new SharedIniFileCredentials({
        profile: AWS_PROFILE,
      });
    }

    console.log(config.credentials);

    const orgClient = new Organizations({ region: "us-east-1" });
    orgClient
      .listAccounts()
      .promise()
      .then(async (results) => {
        let stagesDetails = [];
        if (results.Accounts) {
          for (const account of results.Accounts) {
            const tags = (await orgClient.listTagsForResource({ ResourceId: account.Id! }).promise()).Tags;
            if (tags && tags.length > 0) {
              const accountType = tags.find((tag) => tag.Key === "AccountType")!.Value;
              if (accountType === "STAGE") {
                const stageName = tags.find((tag) => tag.Key === "StageName")!.Value;
                const stageOrder = tags.find((tag) => tag.Key === "StageOrder")!.Value;
                stagesDetails.push(new StageDetails(stageName, account.Id!, stageOrder));
              }
            }
          }
        }
        stagesDetails.sort((a, b) => (a.order > b.order ? 1 : -1));
        for (let stageDetailsIndex in stagesDetails) {
          let stageDetails = stagesDetails[stageDetailsIndex];
          action(stageDetails);
        }
      })
      .catch((error) => {
        console.log(error);
        switch (error.code) {
          case "CredentialsError": {
            console.error(
              "\x1b[31m",
              `Failed to get credentials for "${AWS_PROFILE}" profile. Make sure to run "aws configure sso --profile ${AWS_PROFILE} && aws sso login --profile ${AWS_PROFILE} && npx cdk-sso-sync ${AWS_PROFILE}"\n\n`
            );
            break;
          }
          case "ExpiredTokenException": {
            console.error(
              "\x1b[31m",
              `Token expired, run "aws sso login --profile ${AWS_PROFILE} && npx cdk-sso-sync ${AWS_PROFILE}"\n\n`
            );
            break;
          }
          case "AccessDeniedException": {
            console.error(
              "\x1b[31m",
              `Unable to call the AWS Organizations ListAccounts API. Make sure to add a PolicyStatement with the organizations:ListAccounts action to your synth action`
            );
            break;
          }
          default: {
            console.error(error.message);
          }
        }
        //force CDK to fail in case of an unknown exception
        process.exit(1);
      });
  }
}
