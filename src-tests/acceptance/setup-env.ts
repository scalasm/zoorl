import * as fs from 'fs';
import * as path from 'path';

/**
 * Sets up the environment variables for the tests by loading them from the CDK outputs file
 */
export function setupTestEnvironment(): void {
  try {
    // Path to the CDK outputs file
    const outputsFilePath = path.resolve(process.cwd(), 'cdk-outputs.json');
    
    if (!fs.existsSync(outputsFilePath)) {
      console.warn('CDK outputs file not found. Make sure to deploy the stack first.');
      return;
    }
    
    // Load the outputs file
    const outputs = JSON.parse(fs.readFileSync(outputsFilePath, 'utf8'));
    console.log('CDK outputs file loaded successfully.');
    console.log('Outputs:', JSON.stringify(outputs));
    
    // Extract the stack name (assuming there's only one stack or we want the first one)
    const stackName = Object.keys(outputs)[0];
    if (!stackName) {
      console.warn('No stack found in the outputs file.');
      return;
    }
    
    const stackOutputs = outputs[stackName];
    
    // Set environment variables from the outputs
    if (stackOutputs.UserPoolId) {
      process.env.USER_POOL_ID = stackOutputs.UserPoolId;
    }
    
    if (stackOutputs.UserPoolClientId) {
      process.env.USER_POOL_CLIENT_ID = stackOutputs.UserPoolClientId;
    }
    
    if (stackOutputs.IdentityPoolId) {
      process.env.IDENTITY_POOL_ID = stackOutputs.IdentityPoolId;
    }
    
    if (stackOutputs.ApiEndpoint) {
      process.env.API_URL = stackOutputs.ApiEndpoint;
    }
    
    if (stackOutputs.Region) {
      process.env.AWS_REGION = stackOutputs.Region;
    }
    
    console.log('Environment variables set from CDK outputs.');
  } catch (error) {
    console.error('Error setting up test environment:', error);
  }
}