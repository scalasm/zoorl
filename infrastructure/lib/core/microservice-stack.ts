// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as constructs from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as pylambda from '@aws-cdk/aws-lambda-python-alpha';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import path = require('path');
import { S3DataDistributionType } from 'aws-cdk-lib/aws-stepfunctions-tasks';

export interface CoreMicroserviceStackProps extends cdk.NestedStackProps {
  readonly vpc: ec2.IVpc;
}

/**
 * Core Zoorl logic for managing the creation of URL hashes and their retrieval through 
 * a RESTful API.
 * 
 * It provides two endpoints:
 *  * Create a new URL hash
 *  * Lookup a URL hash and get the
 * 
 * Additional behavior, like HTTP redirect, is performed through AWS API Gateway transforms.
 */
export class CoreMicroserviceStack extends cdk.NestedStack {
  constructor(scope: constructs.Construct, id: string, props: CoreMicroserviceStackProps) {
    super(scope, id, props);

    const urlHashesTable = new ddb.Table(this, "UrlHashesTable", {
      tableName: "UrlHashes",
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: "PK",
        type: ddb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: ddb.AttributeType.STRING,
      },
      timeToLiveAttribute: "ttl",
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // All lambda functions are Python 3.9-based and will be hosted in in private subnets inside target VPC.
    const defaultFunctionSettings = {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      runtime: lambda.Runtime.PYTHON_3_9,
      entry: '../src/zoorl/',
      handler: 'handle',
      environment: {
        URL_HASHES_TABLE: urlHashesTable.tableName
      },
      // Functions are pretty quick, so this is quite conservative
      timeout: cdk.Duration.seconds(5)
    }

    const createUrlHashFunction = new pylambda.PythonFunction(this, 'create-url-hash-function', {
      ...defaultFunctionSettings,
      index: 'zoorl/adapters/create_url_hash_handler.py',
    });
    urlHashesTable.grantWriteData(createUrlHashFunction);

    const readUrlHashFunction = new pylambda.PythonFunction(this, 'read-url-hash-function', {
      ...defaultFunctionSettings,
      index: 'zoorl/adapters/read_url_hash_handler.py',
    });
    urlHashesTable.grantReadData(readUrlHashFunction);

    // TODO Map lambda functions to REST APIs

    // TODO Add security restrictions for everything but the lookup / redirect endpoints
  }
}
