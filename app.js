// mongodb
require('dotenv').config();
require('./src/config/db');
const express = require('express');
const cors = require("cors");
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const tasksRoutes = require('./src/routes/routes');

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
      title: 'User module apis',
      version: '1.0.0',
      description: 'API documentation for User Module API',
    },
  },
  apis: ['./src/routes/*.js'], // Update the path to match your actual routes folder
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
// Configure CORS with whitelisted routes
// const corsOptions = {
//   origin: ['https://example.com'], // Add allowed origins
//   methods: ['GET', 'POST'], // Add allowed methods
// };

// Middleware
// app.use(cors(corsOptions)); // Use CORS middleware with custom options
app.use(cors());
app.use(bodyParser.json());

// Routes 
app.use('/api', tasksRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});