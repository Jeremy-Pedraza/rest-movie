import { registerAs } from '@nestjs/config';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export default registerAs(
  'cors',
  (): CorsOptions => ({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
      : ['http://localhost:3000', 'http://localhost:4200'],
    methods: process.env.CORS_METHODS
      ? process.env.CORS_METHODS.split(',').map((method) => method.trim())
      : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Request-Id',
    ],
    exposedHeaders: ['X-Request-Id', 'X-Total-Count'],
    maxAge: 86400, // 24 hours
  }),
);
