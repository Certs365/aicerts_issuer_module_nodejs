// mongodb
require('dotenv').config();
require('./src/config/db');
const express = require('express');
const cors = require("cors");
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const tasksRoutes = require('./src/routes/index');
const certificateRoutes = require("./src/routes/certificate_designer")

const app = express();
const port = process.env.PORT || 8000;

// For accepting post form data
const bodyParser = require('body-parser');
// const bodyParser = require('express').json;

// app.use(express.json());

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Issuer module apis',
      version: '1.0.0',
      description: 'API documentation for Issuer Module API',
    },
  },
  apis: ['./src/routes/*.js'], // Update the path to match your actual routes folder
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Adjust the limit as necessary
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true })); // For URL-encoded payloads

// Routes 
app.use('/api', tasksRoutes);
app.use('/api',certificateRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  setTimeout(function () { next(); }, 1200000); // 120 seconds
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT. Closing server gracefully.');
  // Close the server gracefully
  server.close(() => {
    console.log('Server closed.');
    process.exit(0); // Exit the process with a success code
  });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});