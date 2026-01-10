import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  refreshLongExpiresIn: process.env.JWT_REFRESH_LONG_EXPIRES_IN || '30d',
  issuer: process.env.JWT_ISSUER || 'mokka-api',
  audience: process.env.JWT_AUDIENCE || 'mokka-client',
}));
