// src/modules/auth/auth.module.ts

/**
 * @fileoverview Módulo de autenticación completo
 * @module modules/auth
 *
 * Este módulo proporciona:
 * - Login/Registro
 * - Refresh token con rotación
 * - Gestión de sesiones
 * - Cambio de contraseña
 * - Forgot/Reset password
 * - JWT Strategy
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

// Shared modules
import { QueueModule } from '@modules/queue';
import { UserModule } from '@modules/user';
import { CommonModule } from '@shared/common';

// Local imports
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { SessionEntity } from './entities';
import { JwtStrategy, LocalStrategy } from './strategies';

@Module({
  imports: [
    // TypeORM - Registrar SessionEntity
    TypeOrmModule.forFeature([SessionEntity]),

    // Passport con estrategia por defecto JWT
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    // JWT Module con configuración asíncrona
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret =
          configService.get<string>('jwt.secret') || 'default-secret-change-in-production';
        const expiresIn = Number(configService.get<string>('jwt.expiresInString') || '15m');
        const issuer = configService.get<string>('jwt.issuer');
        const audience = configService.get<string>('jwt.audience');

        return {
          secret,
          signOptions: {
            expiresIn: expiresIn, // ✅ FIX: Type assertion explícito
            issuer,
            audience,
          },
        };
      },
    }),

    // Shared modules
    CommonModule, // Proporciona SanitizerService y HandleErrorService
    UserModule, // Necesitamos UserService
    QueueModule, // Sistema de colas para envío de emails
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    JwtStrategy,
    LocalStrategy, // Opcional
  ],
  exports: [
    PassportModule,
    JwtModule,
    AuthService, // Exportar para usar en otros módulos si es necesario
    AuthRepository,
  ],
})
export class AuthModule {}
