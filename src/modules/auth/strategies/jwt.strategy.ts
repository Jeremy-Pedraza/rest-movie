// src/modules/auth/strategies/jwt.strategy.ts

/**
 * @fileoverview JWT Strategy para Passport
 * @module modules/auth/strategies
 * 
 * ✅ FASE 3: ACTUALIZADO para retornar UserSessionDto completo
 * 
 * Cambios:
 * - Inyecta UserService para buscar usuario completo
 * - Retorna UserSessionDto en lugar de IAuthUser
 * - Incluye company, schema, roles y permisos
 * - Valida estado del usuario (activo, no eliminado)
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { IJwtPayload, UserSessionDto } from '../interfaces';
import { UserService } from '@modules/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService, // ✅ Inyectar UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret-change-in-production',
      issuer: configService.get<string>('jwt.issuer'),
      audience: configService.get<string>('jwt.audience'),
    });
  }

  /**
   * Valida el payload del JWT y retorna el usuario autenticado
   * 
   * Este método es llamado automáticamente por Passport después de verificar el token.
   * Ahora retorna UserSessionDto completo con toda la información del usuario,
   * incluyendo company, schema, roles y permisos.
   * 
   * @param payload - Payload decodificado del JWT
   * @returns Usuario autenticado completo (UserSessionDto)
   * @throws UnauthorizedException si el usuario no existe o está inactivo
   */
  async validate(payload: IJwtPayload): Promise<UserSessionDto> {
    // Verificar que el payload tenga los campos requeridos
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Token inválido - payload incompleto');
    }

    // 🔍 Buscar usuario completo con company, roles y permisos
    const user = await this.userService.findByIdWithCompanyAndRoles(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Validar estado del usuario
    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Usuario inactivo o eliminado');
    }

    // ✅ Construir UserSessionDto completo
    return {
      // Datos básicos del usuario
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      
      // Multi-tenant info (con fallback al payload por compatibilidad)
      companyId: user.companyId || payload.companyId || null,
      schema: user.company?.schema || payload.schema || null,
      
      // Roles y permisos
      roles: user.roleNames,
      permissions: user.roles?.flatMap(role => 
        role.permissions?.map(p => ({
          id: p.id,
          name: p.name,              // Nombre completo (module.action)
          module: p.module || '',    // Módulo
          action: p.action || '',    // Acción
          description: p.description || undefined, // Descripción opcional
        })) || []
      ) || [],
      
      // Estado del usuario
      status: user.status,
      emailVerified: user.emailVerified,
      
      // Información de sesión (mínima por ahora)
      session: {
        id: '', // TODO: Si tienes sessionId en payload, agregarlo aquí
        sessionUid: payload.sub, // Temporal - usar ID del usuario
        startedAt: new Date(payload.iat! * 1000),
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
      },
      
      // Información de la company (tenant)
      company: user.company ? {
        id: user.company.id,
        name: user.company.name,
        schema: user.company.schema,
        isActive: user.company.isActive,
      } : {
        // Fallback si no hay company cargada
        id: user.companyId || '',
        name: 'Unknown',
        schema: payload.schema || 'public',
        isActive: true,
      },
      
      // Timestamps
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
