const express = require("express");
const cors = require("cors");
const openapi = require("@wesleytodd/openapi");

// Import routers for endpoints
const remediationRouter = require("./routes/automated-code-remediation");
const medstoreRouter = require("./routes/medstore-swagger");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure OpenAPI with explicit paths
const oapi = openapi({
  openapi: "3.0.0",
  info: {
    title: "PerfAI Test Endpoints",
    description: "API endpoints for performance testing",
    version: "2.0.0",
  },
  components: {
    securitySchemes: {
      basicAuth: {
        type: "http",
        scheme: "basic",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          status: { type: "string" },
          message: { type: "string" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
    },
    responses: {
      NotFound: {
        description: "The specified resource was not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
          },
        },
      },
    },
  },
  // Explicitly define paths for the remediation and medstore routers
  paths: { 
    ...remediationRouter.apiSpec,
    ...medstoreRouter.apiSpec,
  },
});

// Use the OpenAPI middleware
app.use(oapi);


// Mount the remediation router
app.use("/api/remediation", oapi.path(remediationRouter.apiSpec), remediationRouter);

// Mount the medstore router
app.use("/api/medstore", oapi.path(medstoreRouter.apiSpec), medstoreRouter);

// Create a reusable error handler
const errorHandler = (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: "API endpoint not found",
    timestamp: new Date().toISOString(),
  });
};

// Custom 404 handler for API routes
app.use("/api/*", errorHandler);

// Serve SwaggerUI at a custom URL as an alternative to the default /api/docs
app.use(
  "/swagger",
  oapi.swaggerui({
    // SwaggerUI configuration options
    docExpansion: "list",
    deepLinking: true,
  })
);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API documentation available at:`);
  console.log(`- http://localhost:${PORT}/api/docs (default UI)`);
  console.log(`- http://localhost:${PORT}/swagger (SwaggerUI)`);
  console.log(`- http://localhost:${PORT}/openapi.json (OpenAPI JSON)`);
});
