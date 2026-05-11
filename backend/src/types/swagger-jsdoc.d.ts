/**
 * Module Augmentation: swagger-jsdoc
 * ----------------------------------
 * Extends TypeScript definitions for the "swagger-jsdoc" package.
 * - Defines the Options interface used to configure swagger-jsdoc.
 * - Ensures type safety when passing configuration to swaggerJsdoc().
 *
 * Keys:
 *   - definition: OpenAPI specification object (info, servers, etc.)
 *   - apis: Array of file paths to scan for Swagger JSDoc annotations
 *
 * Export:
 *   - swaggerJsdoc(options: Options): object
 *     Generates the Swagger specification based on provided options.
 *
 * Usage:
 *   import swaggerJsdoc from "swagger-jsdoc";
 *   const spec = swaggerJsdoc({ definition, apis });
 */

declare module "swagger-jsdoc" {
  interface Options {
    definition: object; // OpenAPI definition object
    apis: string[];     // Paths to files containing Swagger annotations
  }

  // Function that generates Swagger specification from given options
  export default function swaggerJsdoc(options: Options): object;
}

