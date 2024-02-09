// mongodb
require('dotenv').config();
require('./config/db');
const express = require('express');
const cors = require("cors");
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const tasksRoutes = require('./routes/routes');

const app = express();
const port = process.env.PORT || 8000;

// For accepting post form data
const bodyParser = require('express').json;


app.use(bodyParser());
app.use(cors());
app.use(express.json());

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
  apis: ['./routes/*.js'], // Update the path to match your actual routes folder
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes 
app.use('/api', tasksRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});