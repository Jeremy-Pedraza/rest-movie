/**
 * @fileoverview Constantes para seeds de base de datos
 * @module database/seeds
 */

// ============================================
// MÓDULOS DEL SISTEMA
// ============================================

export const MODULES = {
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  LOGS: 'logs',
  SESSIONS: 'sessions',
  TASKS: 'tasks',
  CACHE: 'cache',
  HEALTH: 'health',
  QUEUE: 'queue',
  NOTIFICATIONS: 'notifications',
} as const;

// ============================================
// ACCIONES ESTÁNDAR
// ============================================

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage', // Acceso total al módulo
  RUN: 'run', // Ejecutar (para tasks)
  SEND: 'send', // Enviar (para notifications)
  CLEAR: 'clear', // Limpiar (para cache)
} as const;

// ============================================
// DEFINICIÓN DE PERMISOS POR MÓDULO
// ============================================

export interface PermissionDefinition {
  name: string;
  module: string;
  action: string;
  description: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Users
  {
    name: 'users.create',
    module: MODULES.USERS,
    action: ACTIONS.CREATE,
    description: 'Crear usuarios',
  },
  { name: 'users.read', module: MODULES.USERS, action: ACTIONS.READ, description: 'Ver usuarios' },
  {
    name: 'users.update',
    module: MODULES.USERS,
    action: ACTIONS.UPDATE,
    description: 'Actualizar usuarios',
  },
  {
    name: 'users.delete',
    module: MODULES.USERS,
    action: ACTIONS.DELETE,
    description: 'Eliminar usuarios',
  },
  {
    name: 'users.manage',
    module: MODULES.USERS,
    action: ACTIONS.MANAGE,
    description: 'Gestión total de usuarios',
  },

  // Roles
  {
    name: 'roles.create',
    module: MODULES.ROLES,
    action: ACTIONS.CREATE,
    description: 'Crear roles',
  },
  { name: 'roles.read', module: MODULES.ROLES, action: ACTIONS.READ, description: 'Ver roles' },
  {
    name: 'roles.update',
    module: MODULES.ROLES,
    action: ACTIONS.UPDATE,
    description: 'Actualizar roles',
  },
  {
    name: 'roles.delete',
    module: MODULES.ROLES,
    action: ACTIONS.DELETE,
    description: 'Eliminar roles',
  },
  {
    name: 'roles.manage',
    module: MODULES.ROLES,
    action: ACTIONS.MANAGE,
    description: 'Gestión total de roles',
  },

  // Permissions
  {
    name: 'permissions.read',
    module: MODULES.PERMISSIONS,
    action: ACTIONS.READ,
    description: 'Ver permisos',
  },
  {
    name: 'permissions.manage',
    module: MODULES.PERMISSIONS,
    action: ACTIONS.MANAGE,
    description: 'Gestión de permisos',
  },

  // Logs
  { name: 'logs.read', module: MODULES.LOGS, action: ACTIONS.READ, description: 'Ver logs' },
  {
    name: 'logs.delete',
    module: MODULES.LOGS,
    action: ACTIONS.DELETE,
    description: 'Eliminar logs',
  },
  {
    name: 'logs.manage',
    module: MODULES.LOGS,
    action: ACTIONS.MANAGE,
    description: 'Gestión total de logs',
  },

  // Sessions
  {
    name: 'sessions.read',
    module: MODULES.SESSIONS,
    action: ACTIONS.READ,
    description: 'Ver sesiones',
  },
  {
    name: 'sessions.delete',
    module: MODULES.SESSIONS,
    action: ACTIONS.DELETE,
    description: 'Revocar sesiones',
  },
  {
    name: 'sessions.manage',
    module: MODULES.SESSIONS,
    action: ACTIONS.MANAGE,
    description: 'Gestión de sesiones',
  },

  // Tasks
  {
    name: 'tasks.read',
    module: MODULES.TASKS,
    action: ACTIONS.READ,
    description: 'Ver tareas programadas',
  },
  { name: 'tasks.run', module: MODULES.TASKS, action: ACTIONS.RUN, description: 'Ejecutar tareas' },
  {
    name: 'tasks.manage',
    module: MODULES.TASKS,
    action: ACTIONS.MANAGE,
    description: 'Gestión de tareas',
  },

  // Cache
  {
    name: 'cache.read',
    module: MODULES.CACHE,
    action: ACTIONS.READ,
    description: 'Ver estadísticas de cache',
  },
  {
    name: 'cache.clear',
    module: MODULES.CACHE,
    action: ACTIONS.CLEAR,
    description: 'Limpiar cache',
  },
  {
    name: 'cache.manage',
    module: MODULES.CACHE,
    action: ACTIONS.MANAGE,
    description: 'Gestión de cache',
  },

  // Health
  {
    name: 'health.read',
    module: MODULES.HEALTH,
    action: ACTIONS.READ,
    description: 'Ver estado del sistema',
  },

  // Queue
  { name: 'queue.read', module: MODULES.QUEUE, action: ACTIONS.READ, description: 'Ver colas' },
  {
    name: 'queue.manage',
    module: MODULES.QUEUE,
    action: ACTIONS.MANAGE,
    description: 'Gestión de colas',
  },

  // Notifications
  {
    name: 'notifications.send',
    module: MODULES.NOTIFICATIONS,
    action: ACTIONS.SEND,
    description: 'Enviar notificaciones',
  },
  {
    name: 'notifications.manage',
    module: MODULES.NOTIFICATIONS,
    action: ACTIONS.MANAGE,
    description: 'Gestión de notificaciones',
  },
];

// ============================================
// DEFINICIÓN DE ROLES
// ============================================

export interface RoleDefinition {
  name: string;
  description: string;
  hierarchy: number;
  isSystem: boolean;
  permissions: string[]; // nombres de permisos
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    name: 'super_admin',
    description: 'Super Administrador - Acceso total al sistema',
    hierarchy: 100,
    isSystem: true,
    permissions: PERMISSION_DEFINITIONS.map((p) => p.name), // Todos los permisos
  },
  {
    name: 'admin',
    description: 'Administrador - Gestión completa excepto configuración del sistema',
    hierarchy: 80,
    isSystem: true,
    permissions: [
      'users.create',
      'users.read',
      'users.update',
      'users.delete',
      'users.manage',
      'roles.read',
      'roles.update',
      'permissions.read',
      'logs.read',
      'logs.delete',
      'logs.manage',
      'sessions.read',
      'sessions.delete',
      'sessions.manage',
      'tasks.read',
      'tasks.run',
      'tasks.manage',
      'cache.read',
      'cache.clear',
      'cache.manage',
      'health.read',
      'queue.read',
      'queue.manage',
      'notifications.send',
      'notifications.manage',
    ],
  },
  {
    name: 'system',
    description: 'Sistema - Operaciones internas automatizadas',
    hierarchy: 60,
    isSystem: true,
    permissions: [
      'users.read',
      'logs.read',
      'logs.delete',
      'sessions.read',
      'sessions.delete',
      'tasks.read',
      'tasks.run',
      'cache.read',
      'cache.clear',
      'health.read',
      'queue.read',
      'queue.manage',
      'notifications.send',
    ],
  },
  {
    name: 'manager',
    description: 'Manager - Gestión limitada de usuarios y contenido',
    hierarchy: 40,
    isSystem: true,
    permissions: [
      'users.create',
      'users.read',
      'users.update',
      'roles.read',
      'permissions.read',
      'logs.read',
      'sessions.read',
      'tasks.read',
      'cache.read',
      'health.read',
      'queue.read',
      'notifications.send',
    ],
  },
  {
    name: 'user',
    description: 'Usuario estándar - Acceso básico',
    hierarchy: 20,
    isSystem: true,
    permissions: [
      'users.read', // Solo puede ver su propio perfil (controlado en service)
      'health.read',
    ],
  },
  {
    name: 'guest',
    description: 'Invitado - Solo lectura pública',
    hierarchy: 10,
    isSystem: true,
    permissions: ['health.read'],
  },
];

// ============================================
// USUARIOS INICIALES
// ============================================

export interface UserDefinition {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: string[]; // nombres de roles
  emailVerified: boolean;
  status: 'active' | 'pending';
}

export const USER_DEFINITIONS: UserDefinition[] = [
  {
    email: 'admin@mokka.app',
    password: 'Admin123!', // Se hasheará en el seed
    firstName: 'Admin',
    lastName: 'Mokka',
    roles: ['super_admin'],
    emailVerified: true,
    status: 'active',
  },
  {
    email: 'system@mokka.app',
    password: 'System123!',
    firstName: 'System',
    lastName: 'User',
    roles: ['system'],
    emailVerified: true,
    status: 'active',
  },
  {
    email: 'manager@mokka.app',
    password: 'Manager123!',
    firstName: 'Manager',
    lastName: 'User',
    roles: ['manager'],
    emailVerified: true,
    status: 'active',
  },
  {
    email: 'user@mokka.app',
    password: 'User123!',
    firstName: 'Test',
    lastName: 'User',
    roles: ['user'],
    emailVerified: true,
    status: 'active',
  },
];
