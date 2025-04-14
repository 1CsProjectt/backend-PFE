// config/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Management API',
      version: '1.0.0',
      description: 'API for managing users with cookie-based auth',
    },
    servers: [
      {
        url: 'http://localhost:5000',
      },
    ],
  },
  apis: [`${__dirname}/../routes/*.js`], 
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
export  {swaggerSpec};
