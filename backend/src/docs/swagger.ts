import swaggerJsdoc from "swagger-jsdoc";

/**
 * Swagger Configuration
 * ---------------------
 * This file sets up Swagger JSDoc for API documentation.
 * - Defines the OpenAPI specification (version, title, description, servers).
 * - Scans route files for JSDoc annotations to auto-generate docs.
 *
 * Usage:
 *   Import `swaggerSpec` into your Express app and mount it with swagger-ui-express.
 *   Example:
 *     import swaggerUi from "swagger-ui-express";
 *     import swaggerSpec from "./docs/swagger";
 *     app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
 */
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Interview Questions API", 
      version: "1.0.0", 
      description: "API to generate interview questions using Gemini AI", 
    },
    servers: [{ url: "http://localhost:3000" }],
  },
  apis: ["./src/routes/*.ts"], 
};

// Generate Swagger specification from options
const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

