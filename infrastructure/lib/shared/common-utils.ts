// Copyright Mario Scalas 2022. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as apigateway from "aws-cdk-lib/aws-apigateway";

/**
 * Typed definition of the input parameters for jsonSchema() function.
 */
export interface JsonSchemaNamedParameters {
  /**
   * The name for the model .
   */
  modelName: string;
  /**
   * (optional) The description for the model - if not provided, 'modelName' will be used
   */
  modelTitle?: string;
  /**
   * A map for <property, property specification> entries, defined according to 'apigateway.JsonSchema'.
   */
  properties: { [name: string]: apigateway.JsonSchema };
  /**
   * (optional) The required properties, if any.
   */
  requiredProperties?: string[];
}

/**
 * Shortcut helper for creating a JSON Schema document to represent request/response models for AWS API Gateway in CDK.
 * @param schemaParameters JSON schema definition.
 * @returns the 'apigateway.ModelOptions' to be included in the definition of request/response models
 */
export function jsonSchema(schemaParameters: JsonSchemaNamedParameters): apigateway.ModelOptions {
  const parameters = {
    ...schemaParameters,
    modelTitle: schemaParameters.modelTitle || schemaParameters.modelName,
    requiredProperties: schemaParameters.requiredProperties || [],
  };

  return {
    contentType: "application/json",
    modelName: parameters.modelName,
    schema: {
      type: apigateway.JsonSchemaType.OBJECT,
      schema: apigateway.JsonSchemaVersion.DRAFT4,
      title: parameters.modelTitle,
      properties: parameters.properties,
      required: parameters.requiredProperties,
    },
  };
}
