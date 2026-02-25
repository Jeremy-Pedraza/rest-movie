// src/modules/auth/strategies/local.strategy.ts

/**
 * @fileoverview Local Strategy para Passport
 * @module modules/auth/strategies
 *
 * Esta estrategia valida credenciales email/password.
 * Aunque usamos JWT como principal método, Local Strategy
 * es útil para validar credenciales en el endpoint de login.
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthService } from '../auth.service';
import { HandleErrorService } from '@shared/common';
import { ERROR_CODES, RESPONSE_MESSAGES } from '@constants';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(
    private readonly authService: AuthService,
    private readonly handleError: HandleErrorService,
  ) {
    super({
      usernameField: 'email', // Usar email en lugar de username
      passwordField: 'password',
    });
  }

  /**
   * Valida las credenciales del usuario
   * Este método es llamado automáticamente por Passport
   *
   * @param args - [email, password] requeridos por Passport pero no usados
   * @returns Usuario validado
   */
  validate(...args: [string, string]): never {
    // En este caso, la validación completa está en AuthService.login()
    // Esta estrategia podría usarse con @UseGuards(LocalAuthGuard) en el endpoint de login
    // pero preferimos manejar la validación directamente en el service por flexibilidad

    // Evitar warning de parámetro no usado
    void args;

    this.handleError.unauthorized(
      `${RESPONSE_MESSAGES.AUTH.UNAUTHORIZED}: use AuthService.login() directly`,
      ERROR_CODES.AUTH_UNAUTHORIZED,
    );
  }
}
