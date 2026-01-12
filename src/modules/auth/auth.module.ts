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
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

// Shared modules
import { CommonModule } from '@shared/common';
import { UserModule } from '@modules/user';

// Local imports
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
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
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'),
          issuer: configService.get<string>('jwt.issuer'),
          audience: configService.get<string>('jwt.audience'),
        },
      }),
    }),

    // Shared modules
    CommonModule, // Proporciona SanitizerService y HandleErrorService
    UserModule, // Necesitamos UserService
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
  ],
})
export class AuthModule {}
