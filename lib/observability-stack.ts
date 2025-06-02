// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Dashboard, TextWidget, GraphWidget } from "aws-cdk-lib/aws-cloudwatch";
import {
  IObservabilityContributor,
  STANDARD_RESOLUTION,
  SIZE_FULL_WIDTH,
} from "./shared/observability";

import * as apigateway from "aws-cdk-lib/aws-apigateway";

/**
 * Configuration properties for the observability stack.
 */
interface ObservabilityStackProps extends cdk.NestedStackProps {
  /**
   * A prefix that will be used to name internally creasted resources.
   */
  readonly dashboardName: string;

  readonly contributors: IObservabilityContributor[]
}

/**
 * Dashboard and metrics stack.
 */
export class ObservabilityStack extends cdk.NestedStack {
  private readonly dashboard: Dashboard;

  constructor(scope: Construct, id: string, props: ObservabilityStackProps) {
    super(scope, id, props);

    const dashboardName = props.dashboardName.replace(
      /[\s\[\]{}()\-–.,;:'"!?\\/]+/g,
      "_"
    );

    this.dashboard = new Dashboard(this, "dashboard", {
      dashboardName: dashboardName,
    });

    this.dashboard.addWidgets(
      new TextWidget({
        markdown: `
# ${props.dashboardName} 
Here you can see all the metrics for the stack resources. These includes all the resources created in this stack, like:
* API Gateway
* Lambda functions
* DynamoDB tables
* and more...
`,
        width: 24,
        height: 3,
      })
    );

    props.contributors.forEach((contributor) =>
      contributor.contributeWidgets(this.dashboard)
    );
  }
}
