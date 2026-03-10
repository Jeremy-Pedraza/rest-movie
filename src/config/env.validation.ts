type Environment = Record<string, string | undefined>;

const NODE_ENV_VALUES = ['development', 'production', 'test'] as const;

function requireString(env: Environment, key: string, errors: string[]): string {
  const value = env[key]?.trim();
  if (!value) {
    errors.push(`${key} es obligatorio`);
    return '';
  }

  return value;
}

function requirePort(env: Environment, key: string, errors: string[]): number {
  const value = requireString(env, key, errors);
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    errors.push(`${key} debe ser un entero positivo`);
    return 0;
  }

  return parsed;
}

function requireBoolean(env: Environment, key: string, errors: string[]): boolean {
  const value = requireString(env, key, errors);
  if (value !== 'true' && value !== 'false') {
    errors.push(`${key} debe ser true o false`);
    return false;
  }

  return value === 'true';
}

function requireMinLength(
  env: Environment,
  key: string,
  minLength: number,
  errors: string[],
): string {
  const value = requireString(env, key, errors);
  if (value && value.length < minLength) {
    errors.push(`${key} debe tener al menos ${minLength} caracteres`);
  }

  return value;
}

function parseOrigins(env: Environment, errors: string[]): string[] {
  const value = requireString(env, 'CORS_ORIGIN', errors);
  if (!value) {
    return [];
  }

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    errors.push('CORS_ORIGIN debe incluir al menos un origen');
  }

  for (const origin of origins) {
    if (origin !== '*' && !/^https?:\/\/[^,\s]+$/i.test(origin)) {
      errors.push(`CORS_ORIGIN contiene un origen invalido: ${origin}`);
    }
  }

  return origins;
}

export function validateEnvironment(env: Environment): Environment {
  const errors: string[] = [];
  const nodeEnv = requireString(env, 'NODE_ENV', errors);

  if (nodeEnv && !NODE_ENV_VALUES.includes(nodeEnv as (typeof NODE_ENV_VALUES)[number])) {
    errors.push(`NODE_ENV debe ser uno de: ${NODE_ENV_VALUES.join(', ')}`);
  }

  requireString(env, 'APP_NAME', errors);
  requirePort(env, 'APP_PORT', errors);
  requireString(env, 'APP_HOST', errors);
  requireString(env, 'APP_URL', errors);
  requireString(env, 'API_PREFIX', errors);
  requirePort(env, 'APP_REQUEST_TIMEOUT', errors);

  requireString(env, 'DB_HOST', errors);
  requirePort(env, 'DB_PORT', errors);
  requireString(env, 'DB_USERNAME', errors);
  requireString(env, 'DB_PASSWORD', errors);
  requireString(env, 'DB_DATABASE', errors);
  requireBoolean(env, 'DB_SYNCHRONIZE', errors);
  requireBoolean(env, 'DB_LOGGING', errors);
  requireBoolean(env, 'DB_SSL', errors);

  const corsOrigins = parseOrigins(env, errors);
  const corsCredentials = requireBoolean(env, 'CORS_CREDENTIALS', errors);
  if (corsCredentials && corsOrigins.includes('*')) {
    errors.push('CORS_ORIGIN no puede ser * cuando CORS_CREDENTIALS=true');
  }

  requireString(env, 'CORS_METHODS', errors);

  requirePort(env, 'THROTTLE_TTL', errors);
  requirePort(env, 'THROTTLE_LIMIT', errors);

  requireMinLength(env, 'JWT_SECRET', 32, errors);
  requireMinLength(env, 'JWT_REFRESH_SECRET', 32, errors);
  requireString(env, 'JWT_EXPIRES_IN', errors);
  requireString(env, 'JWT_REFRESH_EXPIRES_IN', errors);
  requireString(env, 'JWT_ISSUER', errors);
  requireString(env, 'JWT_AUDIENCE', errors);

  requirePort(env, 'BCRYPT_ROUNDS', errors);
  requireString(env, 'LOG_DB_LEVEL', errors);
  requireString(env, 'LOG_IGNORE_PATHS', errors);

  if (errors.length > 0) {
    throw new Error(`Configuracion invalida:\n- ${errors.join('\n- ')}`);
  }

  return env;
}
