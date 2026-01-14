// Archivo temporal de verificación de tipos - FASE 2
// Este archivo se puede eliminar después de validar

import { IJwtPayload, IAuthUser, UserSessionDto } from '@modules/auth/interfaces';
import { AuthRequest } from '@types/express';

// ============================================
// VERIFICACIÓN 1: IJwtPayload con campos nuevos
// ============================================

const jwtPayloadOld: IJwtPayload = {
  sub: 'user-id-123',
  email: 'user@example.com',
  roles: ['admin', 'user'],
  // companyId y schema son opcionales - tokens antiguos sin estos campos
};

const jwtPayloadNew: IJwtPayload = {
  sub: 'user-id-123',
  email: 'user@example.com',
  roles: ['admin', 'user'],
  companyId: 'company-id-456', // ✅ Nuevo campo
  schema: 'restaurant_valle_schema', // ✅ Nuevo campo
  iat: Date.now(),
  exp: Date.now() + 3600,
};

// ============================================
// VERIFICACIÓN 2: IAuthUser con campos nuevos
// ============================================

const authUserOld: IAuthUser = {
  id: 'user-id-123',
  email: 'user@example.com',
  roles: ['admin'],
  // companyId y schema son opcionales
};

const authUserNew: IAuthUser = {
  id: 'user-id-123',
  email: 'user@example.com',
  roles: ['admin'],
  companyId: 'company-id-456', // ✅ Nuevo campo
  schema: 'restaurant_valle_schema', // ✅ Nuevo campo
};

// ============================================
// VERIFICACIÓN 3: UserSessionDto completo
// ============================================

const userSession: UserSessionDto = {
  id: 'user-id-123',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  companyId: 'company-id-456',
  schema: 'restaurant_valle_schema',
  roles: ['admin', 'user'],
  permissions: [
    {
      id: 'perm-1',
      module: 'users',
      name: 'user.read',
      canRead: true,
      canWrite: true,
      canEdit: true,
      canDelete: false,
    },
  ],
  status: 'active',
  emailVerified: true,
  session: {
    id: 'session-id-123',
    sessionUid: 'session-uid-456',
    deviceId: 'device-id-789',
    startedAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
  },
  company: {
    id: 'company-id-456',
    name: 'Restaurant Valle',
    schema: 'restaurant_valle_schema',
    isActive: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================
// VERIFICACIÓN 4: AuthRequest
// ============================================

function testAuthRequest(request: AuthRequest) {
  // ✅ Type-safe access
  const userId: string = request.user.id;
  const schema: string | null = request.user.schema;
  const companyId: string | null = request.user.companyId;
  const roles: string[] = request.user.roles;

  console.log('User ID:', userId);
  console.log('Schema:', schema);
  console.log('Company ID:', companyId);
  console.log('Roles:', roles);
}

// ============================================
// VERIFICACIÓN 5: Compatibilidad con null
// ============================================

const userSessionWithoutCompany: UserSessionDto = {
  id: 'user-id-123',
  email: 'user@example.com',
  firstName: 'Admin',
  lastName: 'Global',
  companyId: null, // ✅ Usuarios globales sin company
  schema: null, // ✅ Schema null = public schema
  roles: ['super-admin'],
  permissions: [],
  status: 'active',
  emailVerified: true,
  session: {
    id: 'session-id',
    sessionUid: 'session-uid',
    startedAt: new Date(),
  },
  company: {
    id: 'public',
    name: 'Global',
    schema: 'public',
    isActive: true,
  },
  createdAt: new Date(),
};

console.log('✅ Todas las verificaciones de tipos pasaron');
console.log('✅ IJwtPayload soporta companyId y schema (opcionales)');
console.log('✅ IAuthUser soporta companyId y schema (opcionales)');
console.log('✅ UserSessionDto completo con todos los campos');
console.log('✅ AuthRequest con type-safe access');

export {};
