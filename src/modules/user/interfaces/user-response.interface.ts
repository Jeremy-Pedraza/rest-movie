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
