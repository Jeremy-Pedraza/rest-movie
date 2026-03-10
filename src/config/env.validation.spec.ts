import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  const validEnv = {
    NODE_ENV: 'test',
    APP_NAME: 'api-test',
    APP_PORT: '3001',
    APP_HOST: 'localhost',
    APP_URL: 'http://localhost:3001',
    API_PREFIX: 'api/v1',
    APP_REQUEST_TIMEOUT: '30000',
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_USERNAME: 'postgres',
    DB_PASSWORD: 'postgres',
    DB_DATABASE: 'rest_test',
    DB_SYNCHRONIZE: 'false',
    DB_LOGGING: 'false',
    DB_SSL: 'false',
    CORS_ORIGIN: 'http://localhost:3000',
    CORS_METHODS: 'GET,POST',
    CORS_CREDENTIALS: 'false',
    THROTTLE_TTL: '60',
    THROTTLE_LIMIT: '10',
    JWT_SECRET: '12345678901234567890123456789012',
    JWT_REFRESH_SECRET: 'abcdefghijklmnopqrstuvwxyz123456',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    JWT_ISSUER: 'issuer',
    JWT_AUDIENCE: 'audience',
    BCRYPT_ROUNDS: '10',
    LOG_DB_LEVEL: 'none',
    LOG_IGNORE_PATHS: '/health,/health/ready',
  };

  it('accepts a valid environment', () => {
    expect(validateEnvironment(validEnv)).toBe(validEnv);
  });

  it('rejects wildcard origins when credentials are enabled', () => {
    expect(() =>
      validateEnvironment({
        ...validEnv,
        CORS_ORIGIN: '*',
        CORS_CREDENTIALS: 'true',
      }),
    ).toThrow('CORS_ORIGIN no puede ser * cuando CORS_CREDENTIALS=true');
  });

  it('rejects short JWT secrets', () => {
    expect(() =>
      validateEnvironment({
        ...validEnv,
        JWT_SECRET: 'short-secret',
      }),
    ).toThrow('JWT_SECRET debe tener al menos 32 caracteres');
  });
});
