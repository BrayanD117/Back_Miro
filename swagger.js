const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const express = require("express");

const router = express.Router();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
    },
    servers: [
      {
        url: "/api/p",
      },
    ],
  },
  apis: ["./routes/*.js", "./docs/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = router;
