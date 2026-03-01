import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default-secret-change-me',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  issuer: process.env.JWT_ISSUER || 'api-rest',
  audience: process.env.JWT_AUDIENCE || 'api-rest-client',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));
