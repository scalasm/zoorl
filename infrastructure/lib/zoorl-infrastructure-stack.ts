// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { CoreMicroserviceStack } from './core/microservice-stack';

export class ZoorlInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const networkStack = new NetworkStack(this, "network");

    const restApi = this.buildRestApi();

    const coreMicroserviceStack = new CoreMicroserviceStack(this, "core-microservice", {
      vpc: networkStack.vpc,
      restApi: restApi
    });
  }
  
  private buildRestApi(): apigateway.RestApi {
    const api = new apigateway.RestApi(this, 'api', {
      restApiName: "Zoorl API",
      description: 'Zoorl API',
      deployOptions: {
        stageName: 'dev',
      },
      // 👇 enable CORS
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: ['*'],
      },
    });
  
    // 👇 create an Output for the API URL
    new cdk.CfnOutput(this, 'apiUrl', {value: api.url});

    return api;
  }
}
