// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as cdk from "aws-cdk-lib";
import * as constructs from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { SubnetConfiguration } from "aws-cdk-lib/aws-ec2";

/**
 * Maximum number of AZ that we want to create subnets in our VPC.
 */
const MAX_AZ_IN_VPC = 3;

/**
 * Network stack for hosting the application.
 * 
 * This stack only defines private subnets since our lambda functions will not 
 * be accesses directly from the outside environment and won"t need to contact
 * any external service (thus, no NAT Gateway is provided).
 * 
 * Private links (gateway endpoints) are defined for AWS S3 and AWS DynamoDB.
 */
export class NetworkStack extends cdk.NestedStack {

  readonly vpc: ec2.IVpc;

  constructor(scope: constructs.Construct, id: string, props?: cdk.NestedStackProps) {
    super(scope, id, props);

    // In this VPC we only want to host private resources that will not be accessed from the 
    // outside and won"t need to call external resources - no NAT gateway is needed 
    this.vpc = new ec2.Vpc(this, "vpc", {
      cidr: "10.10.0.0/16",
      natGateways: 0, // No NAT Gateway
      maxAzs: MAX_AZ_IN_VPC,
      subnetConfiguration: [
        {
          name: "private-subnet",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24      
        }
      ]
    });

    cdk.Aspects.of(this.vpc).add(new cdk.Tag("Name", "zoorl-vpc"));
    
    this._tagSubnets(this.vpc.privateSubnets, "Name", "zoorl-private-subnet");

    // Since we only have private subnets, our lambdas cannot access Internet and, thus, no AWS services.
    // This is not a problem - we use the VPC endpoints for AWS DynamoDB and S3, the services we use for data storage.
    this.vpc.addGatewayEndpoint("s3-endpoint", {
      service: ec2.GatewayVpcEndpointAwsService.S3
    });
    this.vpc.addGatewayEndpoint("dynamodb-endpoint", {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB
    });
  }
  
  /**
   * Set the name of the specified subnet
   * @param subnets 
   * @param tagName 
   * @param tagValue 
   */
   private _tagSubnets(subnets: ec2.ISubnet[], tagName: string, tagValue: string) {
    for (const subnet of subnets) {
      cdk.Aspects.of(subnet).add(new cdk.Tag(tagName, tagValue));
    }
  }
}