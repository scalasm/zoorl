// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as constructs from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as pylambda from "@aws-cdk/aws-lambda-python-alpha";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";

import { jsonSchema } from "../shared/common-utils";
import { IObservabilityContributor, ObservabilityHelper } from "../shared/common-observability";

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

  /**
   * Authorizer for API calls - if endpoints are to be protected, this is the authorizer to use.
   */
  readonly authorizer: apigateway.Authorizer;
}

/**
 * (internal) Typed interface for the shared settings for the lambda functions we use in this microservice.
 */
interface DefaultLambdaSettings {
  vpc: cdk.aws_ec2.IVpc;
  vpcSubnets: {
    subnetType: cdk.aws_ec2.SubnetType;
  };
  runtime: cdk.aws_lambda.Runtime;
  entry: string;
  handler: string;
  environment: { [key: string]: string };
  // Functions are pretty quick, so this is quite conservative
  timeout: cdk.Duration;
}

/**
 * Core Zoorl logic for managing the creation of URL hashes and their retrieval through
 * a RESTful API.
 *
 * It provides a new resource "/u" and two endpoints:
 *  * POST /u - creates a new URL hash
 *  * GET /u/{hash} - Lookup a URL hash and, if found, returns an HTTP 301 Permanently Moved
 *    to trigger browser redirection.
 */
export class CoreMicroserviceStack extends cdk.NestedStack implements IObservabilityContributor {
  private readonly urlHashesTable: ddb.Table;

  private readonly urlHashesResource: apigateway.Resource;

  private readonly defaultFunctionSettings: DefaultLambdaSettings;

  private readonly createUrlHashFunction: lambda.IFunction;
  private readonly readUrlHashFunction: lambda.IFunction;

  constructor(scope: constructs.Construct, id: string, props: CoreMicroserviceStackProps) {
    super(scope, id, props);

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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // All lambda functions are Python 3.9-based and will be hosted in in private subnets inside target VPC.
    this.defaultFunctionSettings = {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      runtime: lambda.Runtime.PYTHON_3_9,
      entry: "../src/zoorl/",
      handler: "handle",
      environment: {
        URL_HASHES_TABLE: this.urlHashesTable.tableName,
        POWERTOOLS_SERVICE_NAME: "zoorl",
        POWERTOOLS_LOGGER_LOG_EVENT: "true",
        LOG_LEVEL: "INFO",
      },
      // Functions are pretty quick, so this is quite conservative
      timeout: cdk.Duration.seconds(5),
    };

    this.urlHashesResource = props.restApi.root.addResource("u");

    this.createUrlHashFunction = this.bindCreateUrlHashFunction(props);

    this.readUrlHashFunction = this.bindReadUrlHashFunction(props);
  }

  contributeWidgets(dashboard: cloudwatch.Dashboard): void {
    const observabilityHelper = new ObservabilityHelper(dashboard);

    observabilityHelper.createLambdaFunctionSection({
      function: this.createUrlHashFunction,
      descriptiveName: "Create URL Hash",
    });

    observabilityHelper.createLambdaFunctionSection({
      function: this.readUrlHashFunction,
      descriptiveName: "Read URL Hash",
    });

    observabilityHelper.createDynamoDBTableSection({
      table: this.urlHashesTable,
      descriptiveName: "URL hashes table",
    });
  }

  private bindCreateUrlHashFunction(props: CoreMicroserviceStackProps): lambda.Function {
    const createUrlHashFunction = new pylambda.PythonFunction(this, "create-url-hash-function", {
      ...this.defaultFunctionSettings,
      index: "zoorl/adapters/create_url_hash_handler.py",
    });
    this.urlHashesTable.grantWriteData(createUrlHashFunction);

    // POST /u
    const requestModel = props.restApi.addModel(
      "CreateUrlHashRequestModel",
      jsonSchema({
        modelName: "CreateUrlHashRequestModel",
        properties: {
          url: { type: apigateway.JsonSchemaType.STRING },
          ttl: { type: apigateway.JsonSchemaType.INTEGER },
        },
        requiredProperties: ["url"],
      })
    );

    const responseModel = props.restApi.addModel(
      "CreateUrlHashResponseModel",
      jsonSchema({
        modelName: "CreateUrlHashResponseModel",
        properties: {
          url_hash: { type: apigateway.JsonSchemaType.STRING },
          url: { type: apigateway.JsonSchemaType.STRING },
          ttl: { type: apigateway.JsonSchemaType.INTEGER },
        },
        requiredProperties: ["url_hash", "url", "ttl"],
      })
    );

    const requestValidator = new apigateway.RequestValidator(this, "ZoorlRequestValidator", {
      restApi: props.restApi,
      requestValidatorName: "Validate Payload and parameters",
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    this.urlHashesResource.addMethod("POST", new apigateway.LambdaIntegration(createUrlHashFunction, { proxy: true }), {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: props.authorizer,

      requestModels: {
        "application/json": requestModel,
      },
      requestValidator: requestValidator,
      methodResponses: [
        {
          statusCode: "200",
          responseModels: {
            "application/json": responseModel,
          },
        },
      ],
    });

    return createUrlHashFunction;
  }

  private bindReadUrlHashFunction(props: CoreMicroserviceStackProps): lambda.Function {
    const readUrlHashFunction = new pylambda.PythonFunction(this, "read-url-hash-function", {
      ...this.defaultFunctionSettings,
      index: "zoorl/adapters/read_url_hash_handler.py",
    });
    this.urlHashesTable.grantReadData(readUrlHashFunction);
    const http404NotFoundResponseModel = props.restApi.addModel(
      "Http404ResponseModel",
      jsonSchema({
        modelName: "Http404ResponseModel",
        properties: {
          message: { type: apigateway.JsonSchemaType.STRING },
        },
        requiredProperties: ["message"],
      })
    );

    // GET /u/{url_hash}
    this.urlHashesResource
      .addResource("{url_hash}")
      .addMethod("GET", new apigateway.LambdaIntegration(readUrlHashFunction, { proxy: true }), {
        authorizationType: apigateway.AuthorizationType.NONE,

        methodResponses: [
          {
            statusCode: "404",
            responseModels: {
              "application/json": http404NotFoundResponseModel,
            },
          },
        ],
      });

    return readUrlHashFunction;
  }
}
