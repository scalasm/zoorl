import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { NetworkStack } from './network-stack';
import { CoreMicroserviceStack } from './core/microservice-stack';

export class ZoorlInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const networkStack = new NetworkStack(this, "network");

    const coreMicroserviceStack = new CoreMicroserviceStack(this, "core-microservice", {
      vpc: networkStack.vpc
    });

    // example resource
    // const queue = new sqs.Queue(this, 'ZoorlInfrastructureQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
