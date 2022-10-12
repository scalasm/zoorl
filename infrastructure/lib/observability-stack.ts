// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Dashboard, TextWidget, GraphWidget } from "aws-cdk-lib/aws-cloudwatch";
import {
  IObservabilityContributor,
  STANDARD_RESOLUTION,
  SIZE_FULL_WIDTH,
} from "./shared/common-observability";

import * as apigateway from "aws-cdk-lib/aws-apigateway";

/**
 * Configuration properties for the observability stack.
 */
interface ObservabilityStackProps extends StackProps {
  readonly stage: string;

  readonly restApi: apigateway.RestApi;
}

/**
 * Dashboard and metrics stack.
 */
export class ObservabilityStack extends Stack {
  private readonly dashboard: Dashboard;

  constructor(scope: Construct, id: string, props: ObservabilityStackProps) {
    super(scope, id, props);

    this.dashboard = new Dashboard(this, `Zoorl-Dashboard-${props.stage}`, {
      dashboardName: `Zoorl-Dashboard_${props.stage}`,
    });

    this.dashboard.addWidgets(
      new TextWidget({
        markdown: `
# Zoorl 
Here you can see all the metrics for the *Zoorl* stack. These includes@
* API Gateway (global)
* Lambda functions
* DynamoDB tables
`,
        width: 24,
        height: 3,
      })
    );

    // Note: sections are contributed by microservices implementing IObservabilityContributor

    // API Gateway (REST API) is shared resource across different microservices
    // TODO In future we may want to add "resource" dimensions so that we can track errors for
    // specific microservices.
    this.dashboard.addWidgets(
      new TextWidget({
        markdown: `
# REST API metrics 
Peformance metrics for the API Gateway supporting the REST API.

## Metadata
* name: ${props.restApi.restApiName}
* Domain name: ${props.restApi.domainName?.domainName}
`,
        width: SIZE_FULL_WIDTH,
        height: 4, // Increase this if you want to avoid vscrolls for long text
      })
    );

    this.dashboard.addWidgets(
      new GraphWidget({
        title: "APIGateway requests, client errors, and server errors",
        width: SIZE_FULL_WIDTH,
        left: [props.restApi.metricCount({ period: STANDARD_RESOLUTION })],
        right: [
          props.restApi.metricClientError({ period: STANDARD_RESOLUTION }),
          props.restApi.metricServerError({ period: STANDARD_RESOLUTION }),
        ],
      }),
      new GraphWidget({
        title: "APIGateway latency",
        width: SIZE_FULL_WIDTH,
        left: [props.restApi.metricLatency({ period: STANDARD_RESOLUTION, statistic: "p99", label: "p99 latency" })],
      })
    );
  }

  /**
   * Process the specified list of widgets contributors, allowing them to append widgets to the dahboard.
   *
   * @param contributors widgets contributors for the Cloudwatch dashboard.
   */
  hookDashboardContributions(contributors: IObservabilityContributor[]): void {
    if (!contributors) return;

    contributors.forEach((contributor) => contributor.contributeWidgets(this.dashboard));
  }
}
