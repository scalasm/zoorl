// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as cdk from 'aws-cdk-lib';
import * as constructs from "constructs";
import * as cognito from 'aws-cdk-lib/aws-cognito';

/**
 * Configuration properties for the AuthStack.
 */
 export interface AuthStackProps extends cdk.NestedStackProps {
    /**
     * The base name that will be use for naming User and Identity pools.
     */
    readonly basePoolName?: string;
}

/**
 * Authentication resources - essentially our Cognito User and Identity pools.
 */
export class AuthStack extends cdk.NestedStack {
    public readonly userPool: cognito.UserPool;
    public readonly userPoolClient: cognito.UserPoolClient;
    public readonly identityPool: cognito.CfnIdentityPool;

    public readonly userPoolIdOutput: cdk.CfnOutput;
    public readonly userPoolClientIdOutput: cdk.CfnOutput;
    public readonly identityPoolIdOutput: cdk.CfnOutput;

    public readonly regionOutput: cdk.CfnOutput;

    constructor(scope: constructs.Construct, id: string, props?: AuthStackProps) {
        super(scope, id, props);

        const poolName = props?.basePoolName || `zoorl-${this.region}`;

        this.userPool = new cognito.UserPool(this, "user-pool", {
            userPoolName: `${poolName}-up`,
            selfSignUpEnabled: true, // Allow users to sign up
            autoVerify: { email: true }, // Verify email addresses by sending a verification code
            signInAliases: { email: true } // Set email as alias
        });

        this.userPoolClient = new cognito.UserPoolClient(this, "user-pool-client", {
            userPool: this.userPool,
            authFlows: {
                adminUserPassword: true,
                userSrp: true
            },
            generateSecret: false // No need to generate a secret for webapps running in browser
        });

        this.identityPool = new cognito.CfnIdentityPool(this, "identity-pool", {
            identityPoolName: `${poolName}-idp`,
            allowUnauthenticatedIdentities: true,
            cognitoIdentityProviders: [{
                clientId: this.userPoolClient.userPoolClientId,
                providerName: this.userPool.userPoolProviderName
            }]
        });


        this.identityPoolIdOutput = new cdk.CfnOutput(this, "IdentityPoolId", {
            exportName: "IdentityPoolId",
            value: this.identityPool.ref || ""
        });
        this.userPoolClientIdOutput = new cdk.CfnOutput(this, "UserPoolClientId", {
            exportName: "UserPoolClientId",
            value: this.userPoolClient.userPoolClientId || ""
        });
        this.userPoolIdOutput = new cdk.CfnOutput(this, "UserPoolId", {
            exportName: "UserPoolId",
            value: this.userPool.userPoolId || ""
        });
        this.regionOutput = new cdk.CfnOutput(this, "Region", {
            value: this.region || ""
        });
    }
}