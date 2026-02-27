// src/modules/user/interfaces/user-response.interface.ts

/**
 * @fileoverview Interfaces para respuestas de usuario
 * @module modules/user/interfaces
 */

import { UserStatus } from '../entities/user.entity';

/**
 * Respuesta de usuario (sin datos sensibles)
 */
export interface IUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  roles: IRoleResponse[];
  createdAt: Date;
  updatedAt: Date | null;
}

/**
 * Respuesta de rol
 */
export interface IRoleResponse {
  id: string;
  name: string;
  description: string | null;
}

/**
 * Respuesta de roles disponibles del sistema
 */
export interface IAvailableRoleResponse {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  hierarchy: number;
}

/**
 * Respuesta de usuario mínima (para listas)
 */
export interface IUserMinimalResponse {
  id: string;
  email: string;
  fullName: string;
  avatar: string | null;
  status: UserStatus;
}

/**
 * Respuesta de perfil de usuario
 */
export interface IUserProfileResponse extends IUserResponse {
  metadata: Record<string, unknown> | null;
  preferences: Record<string, unknown> | null;
}

/**
 * Respuesta de usuario con tiendas asignadas
 *
 * @description
 * Extiende IUserResponse agregando información de tiendas asignadas.
 * Solo usuarios con rol USER tienen tiendas asignadas.
 *
 * @example
 * ```typescript
 * const userWithStores: IUserWithStoresResponse = {
 *   ...userData,
 *   assigned_stores: [
 *     { id: 'uuid1', nombre: 'Sucursal Centro', codigo: 'TDA-001' },
 *     { id: 'uuid2', nombre: 'Mall del Sol', codigo: 'TDA-002' },
 *   ],
 *   assigned_stores_count: 2,
 * };
 * ```
 */
export interface IUserWithStoresResponse extends IUserResponse {
  /**
   * Tiendas asignadas al usuario (solo rol USER)
   */
  assigned_stores?: Array<{
    id: string;
    nombre: string;
    codigo: string;
    ciudad: string;
    activo: boolean;
  }>;

  /**
   * Cantidad de tiendas asignadas
   */
  assigned_stores_count: number;
}
