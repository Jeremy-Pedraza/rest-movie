// src/modules/auth/strategies/local.strategy.ts

/**
 * @fileoverview Local Strategy para Passport
 * @module modules/auth/strategies
 *
 * Esta estrategia valida credenciales email/password.
 * Aunque usamos JWT como principal método, Local Strategy
 * es útil para validar credenciales en el endpoint de login.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // Usar email en lugar de username
      passwordField: 'password',
    });
  }

  /**
   * Valida las credenciales del usuario
   * Este método es llamado automáticamente por Passport
   *
   * @param email - Email del usuario
   * @param password - Contraseña del usuario
   * @returns Usuario validado
   */
  async validate(email: string, password: string): Promise<any> {
    // En este caso, la validación completa está en AuthService.login()
    // Esta estrategia podría usarse con @UseGuards(LocalAuthGuard) en el endpoint de login
    // pero preferimos manejar la validación directamente en el service por flexibilidad

    throw new UnauthorizedException(
      'Local strategy not implemented - use AuthService.login() directly',
    );
  }
}
