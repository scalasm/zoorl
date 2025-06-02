import { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand, 
  AdminSetUserPasswordCommand, 
  AdminDeleteUserCommand,
  InitiateAuthCommand,
  AuthFlowType
} from '@aws-sdk/client-cognito-identity-provider';

/**
 * Utility class for managing Cognito authentication in tests
 */
export class CognitoAuth {
  private readonly userPoolId: string;
  private readonly userPoolClientId: string;
  private readonly region: string;
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private idToken: string | null = null;
  
  constructor(
    userPoolId: string,
    userPoolClientId: string,
    region: string
  ) {
    this.userPoolId = userPoolId;
    this.userPoolClientId = userPoolClientId;
    this.region = region;
    
    this.cognitoClient = new CognitoIdentityProviderClient({ region });
  }
  
  /**
   * Creates a test user in the Cognito user pool
   */
  async createTestUser(username: string, password: string): Promise<void> {
    // Create the user
    await this.cognitoClient.send(
      new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        TemporaryPassword: password,
        MessageAction: 'SUPPRESS', // Don't send welcome email
      })
    );
    
    // Set the permanent password
    await this.cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        Password: password,
        Permanent: true,
      })
    );
  }
  
  /**
   * Deletes a test user from the Cognito user pool
   */
  async deleteTestUser(username: string): Promise<void> {
    await this.cognitoClient.send(
      new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      })
    );
  }
  
  /**
   * Signs in a user and returns the authentication tokens
   */
  async signIn(username: string, password: string): Promise<any> {
    const response = await this.cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: this.userPoolClientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      })
    );
    
    if (!response.AuthenticationResult?.IdToken) {
      throw new Error('Failed to authenticate: No ID token returned');
    }
    
    this.idToken = response.AuthenticationResult.IdToken;
    return response.AuthenticationResult;
  }
  
  /**
   * Gets the JWT token for API requests
   */
  getIdToken(): string {
    if (!this.idToken) {
      throw new Error('Not authenticated. Call signIn() first.');
    }
    return this.idToken;
  }
}
