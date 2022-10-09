// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as constructs from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as pylambda from '@aws-cdk/aws-lambda-python-alpha';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import path = require('path');

import { jsonSchema } from '../shared/common-utils';
import { Default } from 'aws-cdk-lib/region-info';

/**
 * Configuration properties for the CoreMicroserviceStack.
 */
export interface CoreMicroserviceStackProps extends cdk.NestedStackProps {
  /**
   * Target VPC where lambda functions and other resources will be created.
   */
  readonly vpc: ec2.IVpc;
  /**
   * Target API Gateway REST API under which the resources will be created. 
   */
  readonly restApi: apigateway.RestApi;
}

/**
 * Typed interface for the shared settings for the lambda functions we use in this microservice.
 */
interface DefaultLambdaSettings {
  vpc: cdk.aws_ec2.IVpc; 
  vpcSubnets: { 
    subnetType: cdk.aws_ec2.SubnetType; 
  }; 
  runtime: cdk.aws_lambda.Runtime; 
  entry: string; 
  handler: string; 
  environment: { [key: string]: string; };
  // Functions are pretty quick, so this is quite conservative
  timeout: cdk.Duration;
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
  private readonly restApi: apigateway.RestApi;

  private readonly urlHashesTable: ddb.Table;

  private readonly urlHashesResource: apigateway.Resource;

  private readonly defaultFunctionSettings: DefaultLambdaSettings;

  constructor(scope: constructs.Construct, id: string, props: CoreMicroserviceStackProps) {
    super(scope, id, props);
    
    this.restApi = props.restApi;

    this.urlHashesTable = new ddb.Table(this, "UrlHashesTable", {
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
    this.defaultFunctionSettings = {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      runtime: lambda.Runtime.PYTHON_3_9,
      entry: '../src/zoorl/',
      handler: 'handle',
      environment: {
        URL_HASHES_TABLE: this.urlHashesTable.tableName,
        POWERTOOLS_SERVICE_NAME: "zoorl",
        POWERTOOLS_LOGGER_LOG_EVENT: "true",
        LOG_LEVEL: "INFO"
      },
      // Functions are pretty quick, so this is quite conservative
      timeout: cdk.Duration.seconds(5)
    }

    // Map Lambda function to REST API resources
    this.urlHashesResource = props.restApi.root.addResource('u');

    this.bindCreateUrlHashFunction();

    this.bindReadUrlHashFunction();

    // TODO Add security restrictions for everything but the lookup / redirect endpoints
  }

  private bindCreateUrlHashFunction() {
    const createUrlHashFunction = new pylambda.PythonFunction(this, 'create-url-hash-function', {
      ...this.defaultFunctionSettings,
      index: 'zoorl/adapters/create_url_hash_handler.py',
    });
    this.urlHashesTable.grantWriteData(createUrlHashFunction);

    // POST /u
    const requestModel = this.restApi.addModel('CreateUrlHashRequestModel',
      jsonSchema({
        modelName: "CreateUrlHashRequestModel",
        properties: {
          url: { type: apigateway.JsonSchemaType.STRING },
          ttl: { type: apigateway.JsonSchemaType.INTEGER }
        },
        requiredProperties: ["url"]
      })
    );

    const responseModel = this.restApi.addModel('CreateUrlHashResponseModel',
      jsonSchema({
        modelName: "CreateUrlHashResponseModel",
        properties: {
          url_hash: { type: apigateway.JsonSchemaType.STRING },
          url: { type: apigateway.JsonSchemaType.STRING },
          ttl: { type: apigateway.JsonSchemaType.INTEGER }
        },
        requiredProperties: ["url_hash", "url", "ttl"]
      })
    );

    const requestValidator = new apigateway.RequestValidator(this, 'ZoorlRequestValidator', {
      restApi: this.restApi,
      requestValidatorName: 'Validate Payload and parameters',
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    this.urlHashesResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createUrlHashFunction, { proxy: true }), {
        requestModels: {
          "application/json": requestModel
        },
        requestValidator: requestValidator,
        methodResponses: [
          {
            statusCode: "200",
            responseModels: { 
              "application/json": responseModel 
            }
          }
        ]
      }
    );
  }
  
  private bindReadUrlHashFunction() {
    const readUrlHashFunction = new pylambda.PythonFunction(this, 'read-url-hash-function', {
      ...this.defaultFunctionSettings,
      index: 'zoorl/adapters/read_url_hash_handler.py',
    });
    this.urlHashesTable.grantReadData(readUrlHashFunction);

    const http404NotFoundResponseModel = this.restApi.addModel('Http404ResponseModel',
      jsonSchema({
        modelName: "Http404ResponseModel",
        properties: {
          message: { type: apigateway.JsonSchemaType.STRING }
        },
        requiredProperties: ["message"]
      })
    );

    // GET /u/{url_hash}
    this.urlHashesResource.addResource("{url_hash}").addMethod(
      'GET',
      new apigateway.LambdaIntegration(readUrlHashFunction, { proxy: true }), {
        methodResponses: [
          {
            statusCode: "404",
            responseModels: { 
              "application/json": http404NotFoundResponseModel 
            }
          }
        ]
      }
    );
  }
}

