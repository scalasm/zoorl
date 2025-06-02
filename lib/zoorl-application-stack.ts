// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { NetworkStack } from "./network-stack";
import { AuthStack } from "./auth-stack";
import { StatelessStack } from "./stateless-stack";
import { ObservabilityStack } from "./observability-stack";

import { EnvironmentConfig } from "./config/environment-config";
import { StatefulStack } from "./stateful-stack";

/**
 * Configuration properties for ZoorlInfrastructureStack instances.
 */
export interface ZoorlApplicationStackProps extends cdk.StackProps {
  /**
   * Stage name for the stack (e.g., "dev", "prod", ...)
   */
  readonly appConfig: EnvironmentConfig;
}

/**
 * Application stack per Zoorl is composed by:
 *  - VPC - private subnets and routes to DynamoDB and AWS S3
 *  - Cognito User and Identity pools
 *  - REST API on AWS API Gateway
 *  - Core microservice exposed as resource ("/u") on the REST API
 */
export class ZoorlApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ZoorlApplicationStackProps) {
    super(scope, id, props);

    const networkStack = new NetworkStack(this, "network");

    const authStack = new AuthStack(this, "auth");

    const restApi = this.buildRestApi();
    const restApiAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, "UrlShortenerFunctionAuthorizer", {
      cognitoUserPools: [authStack.userPool],
    });

    const statefulStack = new StatefulStack(this, "stateful", {
      appConfig: props.appConfig,
    });

    const statelessStack = new StatelessStack(this, "stateless", {
      vpc: networkStack.vpc,
      restApi: restApi,
      authorizer: restApiAuthorizer,
      urlHashesTable: statefulStack.urlHashesTable,
    });

    new ObservabilityStack(this, "observability", {
      dashboardName: `Zoorl (${props?.appConfig.shared.stage})`,
      contributors: [
        statelessStack,
        statefulStack,
      ],
    });

  }

  private buildRestApi(): apigateway.RestApi {
    const api = new apigateway.RestApi(this, "api", {
      restApiName: "Zoorl API",
      description: "A simple URL shortening service",
      deployOptions: {
        stageName: "v1",
      },
      // 👇 enable CORS
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
    });

    // 👇 create an Output for the API URL
    new cdk.CfnOutput(this, "apiUrl", {
      value: api.url,
    });

    return api;
  }
}
