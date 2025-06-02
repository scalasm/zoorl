/**
 * Test configuration
 */
export const config = {
  // Test user credentials
  testUser: {
    username: 'test-user@example.com',
    password: 'Test@123456',
  },
  
  // AWS configuration - these should be loaded from environment variables or outputs file
  aws: {
    region: process.env.AWS_REGION || 'eu-west-1',
    userPoolId: process.env.USER_POOL_ID || '<not-set>',
    userPoolClientId: process.env.USER_POOL_CLIENT_ID || '<not-set>',
    identityPoolId: process.env.IDENTITY_POOL_ID || '<not-set>',
    apiUrl: process.env.API_URL || '<not-set>',
  },
  
  // Test timeout in milliseconds
  timeout: 30000,
};