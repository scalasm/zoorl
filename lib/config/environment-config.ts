import * as cdk from "aws-cdk-lib";
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { Region, Stage } from "@config/types";

export interface AwsEnvironment {
  account: string;
  region: string;
}

export interface EnvironmentConfig {
  shared: {
    stage: Stage;
    serviceName: string;
    metricNamespace: string;
    logging: {
      logLevel: 'DEBUG' | 'INFO' | 'ERROR';
      logEvent: 'true' | 'false';
    };
  };
  env: AwsEnvironment;
  stateless: {
    runtimes: lambda.Runtime;
  };
  stateful: {
    tableName: string;
  };
}

export const getEnvironmentConfig = (stage: Stage, app: cdk.App): EnvironmentConfig => {
  switch (stage) {
    case Stage.develop:
      return {
        shared: {
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
          },
          serviceName: `my-aws-kata-${Stage.develop}`,
          metricNamespace: `my-aws-kata-${Stage.develop}`,
          stage: Stage.develop,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_20_X,
        },
        env: app.node.tryGetContext(Stage.develop),
        stateful: {
          tableName: `orders-table-${Stage.develop}`,
        },
      };
    case Stage.staging:
      return {
        shared: {
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
          },
          serviceName: `my-aws-kata-${Stage.staging}`,
          metricNamespace: `my-aws-kata-${Stage.staging}`,
          stage: Stage.develop,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_20_X,
        },
        env: app.node.tryGetContext(Stage.staging),
        stateful: {
          tableName: `orders-table-${Stage.staging}`,
        },
      };      
    case Stage.prod:
      return {
        shared: {
          logging: {
            logLevel: 'INFO',
            logEvent: 'true',
          },
          serviceName: `my-aws-kata-${Stage.prod}`,
          metricNamespace: `my-aws-kata-${Stage.prod}`,
          stage: Stage.prod,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_20_X,
        },
        env: app.node.tryGetContext(Stage.prod),
        stateful: {
          tableName: `orders-table-${Stage.prod}`,
        },
      };
      default:
        return {
          shared: {
            logging: {
              logLevel: 'DEBUG',
              logEvent: 'true',
            },
            serviceName: `my-aws-kata-${stage}`,
            metricNamespace: `my-aws-kata-${stage}`,
            stage: stage,
          },
          stateless: {
            runtimes: lambda.Runtime.NODEJS_20_X,
          },
          env: app.node.tryGetContext(stage) || app.node.tryGetContext(Stage.develop),
          stateful: {
            tableName: `orders-table-${stage}`,
          },
        };
    };
};  