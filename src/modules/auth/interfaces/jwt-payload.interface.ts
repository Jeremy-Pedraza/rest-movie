// src/modules/auth/interfaces/jwt-payload.interface.ts

/**
 * @fileoverview Interfaces para JWT
 * @module modules/auth/interfaces
 */

/**
 * Payload del token JWT
 *
 * IMPORTANTE: Los campos marcados como opcionales permiten compatibilidad
 * con tokens JWT antiguos que no tienen esos campos.
 *
 * Al generar nuevos tokens, se deben incluir todos los campos para
 * soportar multi-tenancy correctamente.
 */
export interface IJwtPayload {
  /** ID del usuario */
  sub: string;

  /** Email del usuario */
  email: string;

  /** Roles del usuario */
  roles: string[];

  /** 🆕 ID de la company (tenant) */
  companyId?: string | null;

  /** 🆕 Schema de PostgreSQL del tenant */
  schema?: string | null;

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
 *
 * NOTA: Esta interface es la versión simplificada que retorna JwtStrategy.
 * Para la versión completa con todos los datos de sesión, usar UserSessionDto.
 *
 * Esta interface se mantiene por compatibilidad, pero se recomienda
 * usar UserSessionDto en su lugar.
 *
 * @deprecated Usar UserSessionDto en su lugar
 */
export interface IAuthUser {
  /** ID del usuario */
  id: string;

  /** Email del usuario */
  email: string;

  /** Roles del usuario */
  roles: string[];

  /** 🆕 ID de la company (tenant) */
  companyId?: string | null;

  /** 🆕 Schema del tenant */
  schema?: string | null;
}
