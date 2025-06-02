// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as cdk from "aws-cdk-lib";
import * as constructs from "constructs";

import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';

import { EnvironmentConfig } from "@config/environment-config";
import { IObservabilityContributor, ObservabilityHelper } from "./shared/observability";


/**
 * Configuration properties for this stack.
 */
export interface StatefulStackProps extends cdk.NestedStackProps {
  readonly appConfig: EnvironmentConfig;
}

/**
 * Stateful resources for this microservice stack: databasers, queues, event buses
 */
export class StatefulStack extends cdk.NestedStack implements IObservabilityContributor {

  public readonly urlHashesTable: dynamodb.Table;

  constructor(scope: constructs.Construct, id: string, props: StatefulStackProps) {
    super(scope, id, props);

    this.urlHashesTable = new dynamodb.Table(this, "UrlHashesTable", {
      tableName: "UrlHashes",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,      
      partitionKey: {
        name: "PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: dynamodb.AttributeType.STRING,
      },
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      timeToLiveAttribute: "ttl",
      contributorInsightsEnabled: true
    });
  }

  contributeWidgets(dashboard: cloudwatch.Dashboard): void {
    const observabilityHelper = new ObservabilityHelper(dashboard);

    observabilityHelper.createDynamoDBTableSection({
      table: this.urlHashesTable,
      descriptiveName: "Orders table",
    });
  }
}
