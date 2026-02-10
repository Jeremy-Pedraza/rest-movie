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

  /** Tiendas asignadas al usuario (solo para rol USER) */
  assigned_stores?: AssignedStore[];

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
 *
 * Basado en PermissionEntity (module.action)
 * Ejemplo: { id: 'perm-1', name: 'users.read', module: 'users', action: 'read' }
 */
export interface UserPermission {
  id: string;
  name: string; // Nombre completo (module.action)
  module: string; // Módulo (users, roles, etc.)
  action: string; // Acción (create, read, update, delete)
  description?: string; // Descripción opcional
}

/**
 * Tienda asignada al usuario
 *
 * Solo los campos necesarios para validación de permisos en ReportAccessGuard.
 * Los usuarios con rol USER solo pueden acceder a reportes de sus tiendas asignadas.
 */
export interface AssignedStore {
  id: string;
  codigo: string;
  nombre: string;
  company_id: string;
}
