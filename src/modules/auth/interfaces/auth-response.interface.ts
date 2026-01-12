// src/modules/auth/interfaces/auth-response.interface.ts

/**
 * @fileoverview Interfaces para respuestas de autenticación
 * @module modules/auth/interfaces
 */

import { IUserResponse } from '@modules/user';

/**
 * Respuesta de login/register exitoso
 */
export interface IAuthResponse {
  /** Usuario autenticado */
  user: IUserResponse;
  /** Access token JWT */
  accessToken: string;
  /** Refresh token JWT */
  refreshToken: string;
  /** Tipo de token */
  tokenType: 'Bearer';
  /** Tiempo de expiración en segundos */
  expiresIn: number;
}

/**
 * Respuesta de refresh token exitoso
 */
export interface IRefreshTokenResponse {
  /** Nuevo access token */
  accessToken: string;
  /** Nuevo refresh token (rotación) */
  refreshToken: string;
  /** Tipo de token */
  tokenType: 'Bearer';
  /** Tiempo de expiración en segundos */
  expiresIn: number;
}

/**
 * Respuesta de logout exitoso
 */
export interface ILogoutResponse {
  /** Mensaje de confirmación */
  message: string;
  /** Timestamp del logout */
  loggedOutAt: Date;
}

/**
 * Respuesta de cambio de contraseña exitoso
 */
export interface IPasswordChangeResponse {
  /** Mensaje de confirmación */
  message: string;
  /** Timestamp del cambio */
  changedAt: Date;
  /** Indica si debe cerrar otras sesiones */
  shouldLogoutOtherSessions: boolean;
}

/**
 * Respuesta de solicitud de reset de contraseña
 */
export interface IForgotPasswordResponse {
  /** Mensaje de confirmación */
  message: string;
  /** Email al que se envió el reset */
  email: string;
  /** Timestamp de la solicitud */
  requestedAt: Date;
}

/**
 * Respuesta de reset de contraseña exitoso
 */
export interface IResetPasswordResponse {
  /** Mensaje de confirmación */
  message: string;
  /** Timestamp del reset */
  resetAt: Date;
}

/**
 * Información de sesión activa
 */
export interface ISessionInfo {
  /** ID de la sesión */
  id: string;
  /** User agent del cliente */
  userAgent: string;
  /** IP del cliente */
  ipAddress: string;
  /** Timestamp de creación */
  createdAt: Date;
  /** Timestamp de última actividad */
  lastActivityAt: Date;
  /** Timestamp de expiración */
  expiresAt: Date;
  /** Indica si es la sesión actual */
  isCurrent: boolean;
}
