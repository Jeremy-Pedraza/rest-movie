// src/modules/auth/strategies/jwt.strategy.ts

/**
 * @fileoverview JWT Strategy para Passport
 * @module modules/auth/strategies
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { IJwtPayload, IAuthUser } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
      issuer: configService.get<string>('jwt.issuer'),
      audience: configService.get<string>('jwt.audience'),
    });
  }

  /**
   * Valida el payload del JWT y retorna el usuario autenticado
   * Este método es llamado automáticamente por Passport después de verificar el token
   *
   * @param payload - Payload decodificado del JWT
   * @returns Usuario autenticado para agregar al request
   */
  async validate(payload: IJwtPayload): Promise<IAuthUser> {
    // Verificar que el payload tenga los campos requeridos
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Token inválido - payload incompleto');
    }

    // Retornar el usuario que se agregará a request.user
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
    };
  }
}
