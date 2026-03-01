declare namespace NodeJS {
  interface ProcessEnv {
    // Application
    NODE_ENV: 'development' | 'production' | 'test';
    APP_NAME: string;
    APP_PORT: string;
    APP_HOST: string;
    APP_URL: string;
    API_PREFIX: string;
    APP_DEBUG: string;

    // Database
    DB_HOST: string;
    DB_PORT: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_DATABASE: string;
    DB_SYNCHRONIZE: string;
    DB_LOGGING: string;
    DB_SSL: string;

    // CORS
    CORS_ORIGIN: string;
    CORS_METHODS: string;
    CORS_CREDENTIALS: string;

    // Throttler
    THROTTLE_TTL: string;
    THROTTLE_LIMIT: string;

    // Swagger
    SWAGGER_ENABLED: string;
    SWAGGER_TITLE: string;
    SWAGGER_DESCRIPTION: string;
    SWAGGER_VERSION: string;
    SWAGGER_PATH: string;

    // JWT
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_ISSUER: string;
    JWT_AUDIENCE: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES_IN: string;

    // Security
    BCRYPT_ROUNDS: string;

    // Logging
    LOG_LEVEL: string;
    LOG_DB_LEVEL: 'all' | 'warnings' | 'errors' | 'none';
    LOG_CONSOLE: string;
    LOG_TO_FILE: string;
    LOG_DIR: string;
    LOG_MAX_SIZE: string;
    LOG_MAX_FILES: string;
  }
}
