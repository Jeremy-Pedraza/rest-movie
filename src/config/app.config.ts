import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  name: process.env.APP_NAME || 'mokka-backend',
  port: parseInt(process.env.APP_PORT, 10) || 3000,
  host: process.env.APP_HOST || 'localhost',
  url: process.env.APP_URL || 'http://localhost:3000',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  debug: process.env.APP_DEBUG === 'true',
}));
