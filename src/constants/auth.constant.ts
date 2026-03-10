export const AUTH_BOOTSTRAP_DEFAULTS = {
  FIRST_NAME: 'Admin',
  LAST_NAME: 'System',
} as const;

export const AUTH_BOOTSTRAP_MESSAGES = {
  OMITTED: '  -> Admin bootstrap omitted: BOOTSTRAP_ADMIN_EMAIL/BOOTSTRAP_ADMIN_PASSWORD not set',
  ALREADY_EXISTS: '  -> Admin user already exists, skipping',
  ROLE_MISSING: '  -> ERROR: Role "administrador" not found. Run role seed first.',
  NOT_ALLOWED: 'ALLOW_ADMIN_BOOTSTRAP=true es obligatorio para crear un administrador',
} as const;
