// src/modules/auth/interfaces/jwt-payload.interface.ts

/**
 * @fileoverview Interfaces para JWT
 * @module modules/auth/interfaces
 */

/**
 * Payload del token JWT
 */
export interface IJwtPayload {
  /** ID del usuario */
  sub: string;
  /** Email del usuario */
  email: string;
  /** Roles del usuario */
  roles: string[];
  /** Timestamp de emisión */
  iat?: number;
  /** Timestamp de expiración */
  exp?: number;
  /** Emisor del token */
  iss?: string;
  /** Audiencia del token */
  aud?: string;
}

/**
 * Usuario autenticado (agregado al request)
 */
export interface IAuthUser {
  /** ID del usuario */
  id: string;
  /** Email del usuario */
  email: string;
  /** Roles del usuario */
  roles: string[];
}
