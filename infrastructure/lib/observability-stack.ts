// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Dashboard, TextWidget } from 'aws-cdk-lib/aws-cloudwatch';
import { IObservabilityContributor } from './shared/common-observability';

/**
 * Configuration properties for the observability stack.
 */
interface ObservabilityStackProps extends StackProps {
	readonly stage: string;
}

/**
 * Dashboard and metrics stack.
 */
export class ObservabilityStack extends Stack {

    private readonly dashboard: Dashboard;

	constructor(scope: Construct, id: string, props: ObservabilityStackProps) {
		super(scope, id, props);

		this.dashboard = new Dashboard(
			this,
			`Zoorl-Dashboard-${props.stage}`, {
				dashboardName: `Zoorl-Dashboard_${props.stage}`,
			}
		);

        this.dashboard.addWidgets(
            new TextWidget({
                markdown: `# Zoorl - Function Metrics 
Here you can see all the metrics for the *Zoorl* stack. These includes

## Available metrics
* Lambda functions

## TODO metrics
* API Gateway
* DynamoDB tables
                `,
                width: 24,
                height: 6,
            })
        );

		// Note: sections are contributed by microservices implementing IObservabilityContributor
	}

    hookDashboardContributions(contributors: IObservabilityContributor[]): void {
        if (!contributors)
            return;
        
        contributors.forEach( 
            (contributor) => contributor.contributeWidgets(this.dashboard) 
        );
    }
}