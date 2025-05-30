// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import { Dashboard, Metric, GraphWidget, TextWidget } from "aws-cdk-lib/aws-cloudwatch";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ddb from "aws-cdk-lib/aws-dynamodb";

/**
 * Half horizontal screen space within a Cloudwatch dashboard space.
 */
export const SIZE_HALF_WIDTH = 12;

/**
 * Full horizontal screen space within a Cloudwatch dashboard space.
 */
export const SIZE_FULL_WIDTH = 2 * SIZE_HALF_WIDTH;

/**
 * Standard resolution for non-custom Cloudwatch metrics is 1 (one) minute.
 */
export const STANDARD_RESOLUTION = cdk.Duration.minutes(1);

/**
 * High resolution for non-custom Cloudwatch metrics is 1 (one) second.
 */
export const HIGH_RESOLUTION = cdk.Duration.seconds(1);

/**
 * Hook interface for contributing widgets to the Cloudwatch Dashboard.
 */
export interface IObservabilityContributor {
  /**
   * Hook method for contributing new widgets to the dashboard.
   *
   * @param dashboard the target dashboard
   */
  contributeWidgets(dashboard: Dashboard): void;
}

interface BaseSectionProps {
  /**
   * A human-readable name that will be used in the section title.
   */
  readonly descriptiveName: string;

  /**
   * An optional description - if not provided, a default one will be set.
   * Note that you can use markdown syntax here: it will be injected inside the description.
   */
  readonly description?: string;
}

/**
 * Configuration properties for creating a section for monitoring a specific function.
 */
export interface LambdaFunctionSectionProps extends BaseSectionProps {
  /**
   * The function name is the lambda function id (e.g., typically from CFN).
   */
  readonly function: lambda.IFunction;

  /**
   * A human-readable name for function (e.g. "Create URL Hash")
   */
  readonly descriptiveName: string;
}

/**
 * Configuration properties for Cloudwatch section about a DynamoDB table.
 */
export interface DynamoDBTableSectionProps extends BaseSectionProps {
  readonly table: ddb.Table;
}

/**
 * Helper for building dashboard sections in a standard way.
 */
export class ObservabilityHelper {
  constructor(private readonly dashboard: Dashboard) {}

  /**
   * Creates a new section inside the target dashboard with metrics for a given function.
   *
   * See https://docs.aws.amazon.com/lambda/latest/dg/monitoring-metrics.html for reference.
   *
   * @param props configuration options for this section
   */
  public createLambdaFunctionSection(props: LambdaFunctionSectionProps): void {
    const description = props.description || "Performance monitors for this lambda function.";

    this.dashboard.addWidgets(
      new TextWidget({
        markdown: `
# Function: ${props.descriptiveName} 
${description}
`,
        width: SIZE_FULL_WIDTH,
        height: 2, // Increase this if you want to avoid vscrolls for long text
      })
    );

    //Widgets related to the Lambda function
    this.dashboard.addWidgets(
      new GraphWidget({
        title: "AWS Function Invocations, Errors, and throttles",
        width: SIZE_HALF_WIDTH,
        left: [
          props.function.metricErrors({ period: STANDARD_RESOLUTION }),
          props.function.metricInvocations({ period: STANDARD_RESOLUTION }),
        ],
        right: [props.function.metricThrottles({ period: STANDARD_RESOLUTION })],
      }),
      new GraphWidget({
        title: "AWS Function URL Request Duration and Latency (p99)",
        width: SIZE_HALF_WIDTH,
        left: [
          new Metric({
            namespace: "AWS/Lambda",
            metricName: "UrlRequestLatency",
            dimensionsMap: {
              FunctionName: props.function.functionName,
            },
            statistic: "p99",
            label: "p99 Latency",
            period: STANDARD_RESOLUTION,
          }),
          props.function.metricDuration(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: "AWS Function Concurrent executions (Max)",
        width: SIZE_HALF_WIDTH,
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/Lambda",
            metricName: "ConcurrentExecutions",
            dimensionsMap: {
              FunctionName: props.function.functionName,
            },
            statistic: "max",
            label: "Max",
            period: STANDARD_RESOLUTION,
          }),
        ],
      })
    );
  }

  public createDynamoDBTableSection(props: DynamoDBTableSectionProps): void {
    const description = props.description || "Performance monitors for this DynamoDB table.";

    this.dashboard.addWidgets(
      new TextWidget({
        markdown: `
# Table: ${props.descriptiveName} 
${description}

## Metadata
* Table name: ${props.table.tableName}
* Table ARN: ${props.table.tableArn}
`,
        width: SIZE_FULL_WIDTH,
        height: 4, // Increase this if you want to avoid vscrolls for long text
      })
    );

    this.dashboard.addWidgets(
      new GraphWidget({
        title: "DynamoDB Table consumed WCU/RCU",
        width: SIZE_FULL_WIDTH,
        left: [
          props.table.metricConsumedReadCapacityUnits({ period: STANDARD_RESOLUTION }),
          props.table.metricConsumedWriteCapacityUnits({ period: STANDARD_RESOLUTION }),
        ],
      })
    );
  }
}
