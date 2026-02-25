// src/modules/auth/strategies/jwt.strategy.ts

/**
 * @fileoverview JWT Strategy para Passport
 * @module modules/auth/strategies
 *
 * ✅ FASE 3: ACTUALIZADO para retornar UserSessionDto completo
 * ✅ FASE 4: INTEGRACIÓN CON REDIS - Cache de sesión de usuario (TTL 3h)
 *
 * Cambios:
 * - Inyecta UserService para buscar usuario completo
 * - Inyecta RedisService para cache de sesión
 * - Retorna UserSessionDto en lugar de IAuthUser
 * - Incluye company, schema, roles, permisos y tiendas asignadas
 * - Valida estado del usuario (activo, no eliminado)
 * - Cache de sesión con TTL de 3 horas para reducir carga a BD
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { IJwtPayload, UserSessionDto } from '../interfaces';
import { UserService } from '@modules/user/user.service';
import { RedisService } from '@shared/redis/redis.service';
import { HandleErrorService } from '@shared/common';
import { ERROR_CODES, RESPONSE_MESSAGES } from '@constants';

/**
 * TTL del cache de sesión: 55 minutos en segundos
 * (5 min menos que JWT de 60min para evitar edge cases)
 * ✅ FASE 1: Sincronizado con AUTH_USER_CACHE_TTL en AuthService
 */
const SESSION_CACHE_TTL = 3300;

/** Prefijo para claves de cache de sesión */
const SESSION_CACHE_PREFIX = 'session';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
    private readonly handleError: HandleErrorService,
  ) {
    const jwtSecret = configService.get<string>('jwt.secret');
    if (!jwtSecret) {
      throw new Error('JWT secret not configured. Ensure JWT_SECRET env var is set.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      issuer: configService.get<string>('jwt.issuer'),
      audience: configService.get<string>('jwt.audience'),
    });
  }

  /**
   * Valida el payload del JWT y retorna el usuario autenticado
   *
   * Este método es llamado automáticamente por Passport después de verificar el token.
   * Ahora retorna UserSessionDto completo con toda la información del usuario,
   * incluyendo company, schema, roles, permisos y tiendas asignadas.
   *
   * ✅ Usa Redis para cachear la sesión del usuario (TTL 3 horas)
   * - Reduce carga a la base de datos
   * - Mejora tiempos de respuesta
   * - Cache se invalida automáticamente por TTL
   *
   * @param payload - Payload decodificado del JWT
   * @returns Usuario autenticado completo (UserSessionDto)
   * @throws UnauthorizedException si el usuario no existe o está inactivo
   */
  async validate(payload: IJwtPayload): Promise<UserSessionDto> {
    // Verificar que el payload tenga los campos requeridos
    if (!payload.sub || !payload.email) {
      this.handleError.unauthorized(RESPONSE_MESSAGES.AUTH.TOKEN_INVALID, ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    const cacheKey = `${SESSION_CACHE_PREFIX}:${payload.schema}:user:${payload.sub}`;

    // ✅ Intentar obtener del cache primero
    const cachedSession = await this.redisService.getJson<UserSessionDto>(cacheKey);

    if (cachedSession) {
      // Validar que el usuario cacheado siga activo
      if (cachedSession.status !== 'active') {
        // Invalidar cache si el usuario no está activo
        await this.redisService.del(cacheKey);
        this.handleError.unauthorized(
          RESPONSE_MESSAGES.AUTH.USER_INACTIVE,
          ERROR_CODES.AUTH_USER_INACTIVE,
        );
      }
      return cachedSession;
    }

    // 🔍 Si no está en cache, buscar en BD
    const user = await this.userService.findByIdWithCompanyAndRoles(payload.sub);

    if (!user) {
      this.handleError.unauthorized(RESPONSE_MESSAGES.AUTH.USER_NOT_FOUND, ERROR_CODES.AUTH_USER_NOT_FOUND);
    }

    // Validar estado del usuario
    if (!user.isActive || user.deletedAt) {
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.USER_INACTIVE,
        ERROR_CODES.AUTH_USER_INACTIVE,
      );
    }

    // ✅ Construir UserSessionDto completo
    const userSession: UserSessionDto = {
      // Datos básicos del usuario
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,

      // Multi-tenant info (con fallback al payload por compatibilidad)
      companyId: user.company_id || payload.companyId || null,
      schema: user.company?.schema || payload.schema || null,

      // Roles y permisos
      roles: user.roleNames,
      permissions:
        user.roles?.flatMap(
          (role) =>
            role.permissions?.map((p) => ({
              id: p.id,
              name: p.name,
              module: p.module || '',
              action: p.action || '',
              description: p.description || undefined,
            })) || [],
        ) || [],

      // ✅ Tiendas asignadas (para ReportAccessGuard - solo rol USER las usa)
      assigned_stores:
        user.assigned_stores?.map((store: any) => ({
          id: store.id,
          codigo: store.codigo,
          nombre: store.nombre,
          company_id: store.company_id,
        })) || [],

      // Estado del usuario
      status: user.status,
      emailVerified: user.email_verified,

      // Información de sesión
      session: {
        id: '',
        sessionUid: payload.sub,
        startedAt: new Date(payload.iat! * 1000),
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
      },

      // Información de la company (tenant)
      company: user.company
        ? {
            id: user.company.id,
            name: user.company.name,
            schema: user.company.schema,
            isActive: user.company.is_active,
          }
        : {
            id: user.company_id || '',
            name: 'Unknown',
            schema: payload.schema || 'public',
            isActive: true,
          },

      // Timestamps
      createdAt: user.createdAt,
      updatedAt: user.updatedAt || undefined,
    };

    // ✅ Guardar en cache con TTL de 3 horas
    await this.redisService.setJson(cacheKey, userSession, { ttl: SESSION_CACHE_TTL });

    return userSession;
  }
}
