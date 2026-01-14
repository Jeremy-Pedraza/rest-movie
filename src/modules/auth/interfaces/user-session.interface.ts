// src/modules/auth/interfaces/user-session.interface.ts

/**
 * @fileoverview Interface para datos de sesión de usuario
 * @module modules/auth/interfaces
 */

/**
 * Usuario autenticado con información completa de sesión
 * 
 * Este DTO contiene TODA la información disponible después de autenticación:
 * - Datos del usuario
 * - Información de la company (tenant)
 * - Datos de la sesión
 * - Roles y permisos
 * 
 * Disponible en: request.user (después de JwtAuthGuard)
 */
export interface UserSessionDto {
  /** ID del usuario */
  id: string;

  /** Email del usuario */
  email: string;

  /** Nombre completo */
  firstName: string;
  lastName: string;

  /** ID de la company (tenant) */
  companyId: string | null;

  /** Schema de PostgreSQL del tenant */
  schema: string | null;

  /** Roles del usuario */
  roles: string[];

  /** Permisos del usuario */
  permissions: UserPermission[];

  /** Estado del usuario */
  status: string;
  emailVerified: boolean;

  /** Información de la sesión actual */
  session: {
    id: string;
    sessionUid: string;
    deviceId?: string;
    startedAt: Date;
    expiresAt?: Date;
  };

  /** Información de la company (tenant) */
  company: {
    id: string;
    name: string;
    schema: string;
    isActive: boolean;
  };

  /** Timestamps */
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Permiso de usuario
 */
export interface UserPermission {
  id: string;
  module: string;
  name: string;
  canRead: boolean;
  canWrite: boolean;
  canEdit: boolean;
  canDelete: boolean;
}
