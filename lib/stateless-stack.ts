// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as fs from "fs";
import * as path from 'path';

import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as constructs from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambda_nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";

import { IObservabilityContributor, ObservabilityHelper } from "./shared/observability";

/**
 * Configuration properties for the Stateless stack.
 */
export interface StatelessStackProps extends cdk.NestedStackProps {
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
  
  /**
   * DynamoDB table where URL hashes will be stored.
   */	
  urlHashesTable: dynamodb.Table;
}

interface CommonResponseModels {
  readonly readUrlHashResponseModel: apigateway.Model;
  readonly http404NotFoundResponseModel: apigateway.Model;
}

// Define a constant for the adapters/primary directory
const PRIMARY_ADAPTERS = "../src/adapters/primary";

/**
 * Core Zoorl logic for managing the creation of URL hashes and their retrieval through
 * a RESTful API.
 *
 * It provides a new resource "/u" and two endpoints:
 *  * POST /u - creates a new URL hash
 *  * GET /u/{hash} - Lookup a URL hash and, if found, returns an HTTP 301 Permanently Moved
 *    to trigger browser redirection.
 */
export class StatelessStack extends cdk.NestedStack implements IObservabilityContributor {

  private readonly urlHashesResource: apigateway.Resource;
  private readonly redirectResource: apigateway.Resource;

  private readonly defaultFunctionSettings: any;

  private readonly createUrlHashFunction: lambda.IFunction;
  private readonly readUrlHashFunction: lambda.IFunction;
  private readonly redirectToUrlFunction: lambda.IFunction;

  private readonly commonResponseModels: CommonResponseModels;
  
  private readonly restApi: apigateway.RestApi;

  constructor(scope: constructs.Construct, id: string, props: StatelessStackProps) {
    super(scope, id, props);

    this.restApi = props.restApi;

    const lambdaPowerToolsConfig = {
      LOG_LEVEL: 'DEBUG',
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
      POWERTOOLS_TRACE_ENABLED: 'enabled',
      POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: 'captureHTTPsRequests',
      POWERTOOLS_SERVICE_NAME: 'zoorl-service',
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'captureResult',
      POWERTOOLS_METRICS_NAMESPACE: 'zoorl',
    };

    // All lambda functions are Python 3.9-based and will be hosted in in private subnets inside target VPC.
    this.defaultFunctionSettings = {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 256,
      // Functions are pretty quick, so this is quite conservative
      timeout: cdk.Duration.seconds(5),
      tracing: lambda.Tracing.ACTIVE,
      handler: 'handler',
      bundling: {
        minify: true,
        externalModules: ['aws-sdk'],
      },
      environment: {
        ...lambdaPowerToolsConfig,
        URL_HASHES_TABLE: props.urlHashesTable.tableName
      }
    };

    this.commonResponseModels = this.initializeSharedResponseModels(props);

    this.urlHashesResource = props.restApi.root.addResource("u");
    this.redirectResource = props.restApi.root.addResource("r");

    this.createUrlHashFunction = this.bindCreateUrlHashFunction(props);

    this.readUrlHashFunction = this.bindReadUrlHashFunction(props);

    this.redirectToUrlFunction = this.bindRedirectToUrlFunction(props);
  }

  public contributeWidgets(dashboard: cloudwatch.Dashboard): void {
    const observabilityHelper = new ObservabilityHelper(dashboard);

    observabilityHelper.createLambdaFunctionSection({
      function: this.createUrlHashFunction,
      descriptiveName: "Create URL Hash",
    });

    observabilityHelper.createLambdaFunctionSection({
      function: this.readUrlHashFunction,
      descriptiveName: "Read URL Hash",
    });

    observabilityHelper.createLambdaFunctionSection({
      function: this.redirectToUrlFunction,
      descriptiveName: "Redirect to URL",
    });
  }

  private initializeSharedResponseModels(props: StatelessStackProps): CommonResponseModels {
    const http404NotFoundResponseModel = this.createModelFromJsonSchemaFile(
      path.join(PRIMARY_ADAPTERS, "resource-not-found.response.schema.json"), "Http404Response");

    const readUrlHashResponseModel = this.createModelFromJsonSchemaFile(`${PRIMARY_ADAPTERS}/read-url-hash.response.schema.json`, "ReadUrlHashResponse")

    return {
      readUrlHashResponseModel,
      http404NotFoundResponseModel
    };
  }

  private bindCreateUrlHashFunction(props: StatelessStackProps): lambda.Function {
    const createUrlHashFunction = new lambda_nodejs.NodejsFunction(this, 'hello-world-function', {
      ...this.defaultFunctionSettings,
      POWERTOOLS_SERVICE_NAME: 'CrateUrlHashFunction',
      handler: 'handler',
      entry: path.join(__dirname, `${PRIMARY_ADAPTERS}/create-url-hash.adapter.ts`),
    });
    props.urlHashesTable.grantWriteData(createUrlHashFunction);

    // POST /u
    const requestModel = this.createModelFromJsonSchemaFile(`${PRIMARY_ADAPTERS}/create-url-hash.request.schema.json`, "CreateUrlHashRequest");

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
            "application/json": this.commonResponseModels.readUrlHashResponseModel,
          },
        },
      ],
    });

    return createUrlHashFunction;
  }

  private bindReadUrlHashFunction(props: StatelessStackProps): lambda.Function {
    const readUrlHashFunction = new lambda_nodejs.NodejsFunction(this, 'read-url-by-hash-function', {
      ...this.defaultFunctionSettings,
      POWERTOOLS_SERVICE_NAME: 'ReadUrlByHash',
      handler: 'handler',
      entry: path.join(__dirname, `${PRIMARY_ADAPTERS}/redirect.adapter.ts`),
    });

    props.urlHashesTable.grantReadData(readUrlHashFunction);

    // GET /u/{url_hash}
    this.urlHashesResource
      .addResource("{url_hash}")
      .addMethod("GET", new apigateway.LambdaIntegration(readUrlHashFunction, { proxy: true }), {
        authorizationType: apigateway.AuthorizationType.NONE,

        methodResponses: [
          {
            statusCode: "200",
            responseModels: {
              "application/json": this.commonResponseModels.readUrlHashResponseModel,
            },
          },
          {
            statusCode: "404",
            responseModels: {
              "application/json": this.commonResponseModels.http404NotFoundResponseModel,
            },
          },
        ],
      });

    return readUrlHashFunction;
  }

  private bindRedirectToUrlFunction(props: StatelessStackProps): lambda.Function {
    const redirectToUrlFunction = new lambda_nodejs.NodejsFunction(this, 'redirect-to-url-function', {
      ...this.defaultFunctionSettings,
      POWERTOOLS_SERVICE_NAME: 'RedirectToUrl',
      handler: 'handler',
      entry: path.join(__dirname, `${PRIMARY_ADAPTERS}/redirect.adapter.ts`),
    });

    props.urlHashesTable.grantReadData(redirectToUrlFunction);
    // GET /r/{url_hash}
    this.redirectResource
      .addResource("{url_hash}")
      .addMethod("GET", new apigateway.LambdaIntegration(redirectToUrlFunction, { proxy: true }), {
        authorizationType: apigateway.AuthorizationType.NONE,

        methodResponses: [
          {
            statusCode: "301",
            responseModels: {} // No response model needed for 301 redirect,
          },
          {
            statusCode: "404",
            responseModels: {
              "application/json": this.commonResponseModels.http404NotFoundResponseModel,
            },
          },
        ],
      });

    return redirectToUrlFunction;
  }

  private setUpRequestResponseModels(targetResource: apigateway.Resource, 
    operationName: string, httpVerb: string, requestJsonSchemaPath: string, responseJsonSchemaPath: string,
    integration: apigateway.Integration, methodOptions: apigateway.MethodOptions): any {
    
    const requestModel = this.createModelFromJsonSchemaFile(requestJsonSchemaPath, `${operationName}Request`);
    const responseModel = this.createModelFromJsonSchemaFile(responseJsonSchemaPath, `${operationName}Response`);

    const requestValidator = new apigateway.RequestValidator(this, `${operationName}RequestValidator`, {
      restApi: this.restApi,
      requestValidatorName: `Validate Payload and parameters for ${operationName}`,
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    targetResource.addMethod(httpVerb, integration, {
      ...methodOptions,

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
  }

  private createModelFromJsonSchemaFile(responseJsonSchemaPath: string, modelName: string) {
    const responseSchema = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, responseJsonSchemaPath),
        "utf8"
      )
    );
    const responseModel = this.restApi.addModel(
      `${modelName}Model`, {
      modelName: `${modelName}Model`,
      contentType: "application/json",
      schema: responseSchema,
    }
    );
    return responseModel;
  }
}
