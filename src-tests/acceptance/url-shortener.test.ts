import { CognitoAuth } from './cognito-auth';
import { ApiClient } from './api-client';
import { config } from './config';

describe('URL Shortener API Integration Tests', () => {
  let cognitoAuth: CognitoAuth;
  let apiClient: ApiClient;
  let authToken: string;
  
  // Increase the test timeout since we're dealing with real API calls
  jest.setTimeout(config.timeout);
  
  beforeAll(async () => {
    // Create the test user before running any tests
    cognitoAuth = new CognitoAuth(
      config.aws.userPoolId,
      config.aws.userPoolClientId,
      config.aws.region
    );
    
    try {
      // Create the test user
      await cognitoAuth.createTestUser(
        config.testUser.username,
        config.testUser.password
      );
      
      // Initialize the API client
      apiClient = new ApiClient(config.aws.apiUrl);
      
      // Sign in and get the token
      await cognitoAuth.signIn(
        config.testUser.username,
        config.testUser.password
      );
      
      authToken = cognitoAuth.getIdToken();
      apiClient.setAuthToken(authToken);
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });
  
  afterAll(async () => {
    // Clean up the test user after all tests are done
    try {
      await cognitoAuth.deleteTestUser(config.testUser.username);
    } catch (error) {
      console.error('Error in test cleanup:', error);
    }
  });
  
  test('should create a short URL and verify it exists', async () => {
    // Test data
    const originalUrl = 'https://example.com/some-long-path';
    
    // Create a short URL
    const createResponse = await apiClient.createShortUrl(originalUrl);
    
    // Verify the response structure
    expect(createResponse).toBeDefined();
    expect(createResponse.url_hash).toBeDefined();
    expect(createResponse.url).toBe(originalUrl);
    expect(createResponse.ttl).toBeDefined();
    
    // Get the created URL by its hash
    const urlHash = createResponse.url_hash;
    const getResponse = await apiClient.getShortUrl(urlHash);
    
    // Verify the retrieved URL matches what we created
    expect(getResponse).toBeDefined();
    expect(getResponse.url_hash).toBe(urlHash);
    expect(getResponse.url).toBe(originalUrl);
    expect(getResponse.ttl).toBeDefined();
  });
  
  test('should create a short URL with custom TTL and verify it exists', async () => {
    // Test data
    const originalUrl = 'https://example.com/another-path';
    const customTtl = 3600; // 1 hour in seconds
    
    // Create a short URL with custom TTL
    const createResponse = await apiClient.createShortUrl(originalUrl, customTtl);
    
    // Verify the response structure
    expect(createResponse).toBeDefined();
    expect(createResponse.url_hash).toBeDefined();
    expect(createResponse.url).toBe(originalUrl);
    expect(createResponse.ttl).toBe(customTtl);
    
    // Get the created URL by its hash
    const urlHash = createResponse.url_hash;
    const getResponse = await apiClient.getShortUrl(urlHash);
    
    // Verify the retrieved URL matches what we created
    expect(getResponse).toBeDefined();
    expect(getResponse.url_hash).toBe(urlHash);
    expect(getResponse.url).toBe(originalUrl);
    expect(getResponse.ttl).toBe(customTtl);
  });
});