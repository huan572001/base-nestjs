import { INestApplication } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const applyCors = (app: INestApplication) => {
  const corsOptions: CorsOptions = {
    origin: '*', // Allow specific domains : ['http://localhost:3000', 'http://localhost:3001']
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow specific methods
    credentials: true, // Enable sending of cookies and authorization headers
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
    preflightContinue: false, // Pass the CORS preflight response to the next handler
    optionsSuccessStatus: 204, // Provide status for successful OPTIONS request
  };
  app.enableCors(corsOptions);
};
