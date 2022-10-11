// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import { 
    Dashboard,
    Metric,
    GraphWidget,
    TextWidget
} from "aws-cdk-lib/aws-cloudwatch";

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

/**
 * Configuration properties for creating a section for monitoring a specific function.
 */
export interface LambdaFunctionSectionProps {
    /**
     * The function name is the lambda function id (e.g., typically from CFN).
     */
    readonly functionName: string;

    /**
     * A human-readable name for function (e.g. "Create URL Hash")
     */
    readonly functionNameDescription: string;

    /**
     * An optional description - if not provided, a default one will be set.
     * Note that you can use markdown syntax here: it will be injected inside the description.
     */
    readonly description?: string;
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
        const description = props.description || "Performance monitors for this lambda function."

        this.dashboard.addWidgets(
            new TextWidget({
                markdown: `# Function: ${props.functionNameDescription} 
${description}
## Metadata
- Function name: ${props.functionName}`,
                width: SIZE_FULL_WIDTH,
                height: 3
            })
        );

		//Widgets related to the Lambda function
		this.dashboard.addWidgets(
			new GraphWidget({
				title: 'AWS Function URL 4xx/5xx errors (sum)',
				width: SIZE_HALF_WIDTH,
				left: [
					new Metric({
						namespace: 'AWS/Lambda',
						metricName: 'Url5xxCount',
						dimensionsMap: {
							FunctionName: props.functionName,
						},
						statistic: 'sum',
						label: 'Sum 5xx Errors',
						period: STANDARD_RESOLUTION,
					}),
					new Metric({
						namespace: 'AWS/Lambda',
						metricName: 'Url4xxCount',
						dimensionsMap: {
							FunctionName: props.functionName,
						},
						statistic: 'sum',
						label: 'Sum 4xx Errors',
						period: STANDARD_RESOLUTION,
					}),
				],
			}),
			new GraphWidget({
				title: 'AWS Function Invocations and Errors (sum)',
				width: SIZE_HALF_WIDTH,
				left: [
					new Metric({
						namespace: 'AWS/Lambda',
						metricName: 'Invocations',
						dimensionsMap: {
							FunctionName: props.functionName,
						},
						statistic: 'sum',
						label: 'Invocations (sum)',
						period: STANDARD_RESOLUTION,
					}),
					new Metric({
						namespace: 'AWS/Lambda',
						metricName: 'Errors',
						dimensionsMap: {
							FunctionName: props.functionName,
						},
						statistic: 'sum',
						label: 'Errors (sum)',
						period: STANDARD_RESOLUTION,
					}),
				],
			}),
			new GraphWidget({
				title: 'AWS Function URL Request Duration and Latency (p99)',
				width: SIZE_HALF_WIDTH,
				left: [
					new Metric({
						namespace: 'AWS/Lambda',
						metricName: 'UrlRequestLatency',
						dimensionsMap: {
							FunctionName: props.functionName,
						},
						statistic: 'p99',
						label: 'p99 Latency',
						period: STANDARD_RESOLUTION,
					}),
					new Metric({
						namespace: 'AWS/Lambda',
						metricName: 'Duration',
						dimensionsMap: {
							FunctionName: props.functionName,
						},
						statistic: 'p99',
						label: 'p99 Duration',
						period: STANDARD_RESOLUTION,
					}),
				],
			}),
            new cloudwatch.GraphWidget({
				title: 'AWS Function Concurrent executions (Max)',
				width: SIZE_HALF_WIDTH,
				left: [
					new cloudwatch.Metric({
						namespace: 'AWS/Lambda',
						metricName: 'ConcurrentExecutions',
						dimensionsMap: {
							FunctionName: props.functionName,
						},
						statistic: 'max',
						label: 'Max',
						period: STANDARD_RESOLUTION,
					}),
				],
			})
		);
    }
}