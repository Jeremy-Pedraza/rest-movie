// src/modules/auth/auth.module.ts

import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ROLES } from '@constants/roles.constant';
import { UserModule } from '@modules/user/user.module';
import { RoleModule } from '@modules/role/role.module';
import { UserService } from '@modules/user/user.service';
import { RoleService } from '@modules/role/role.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '15m',
          issuer: configService.get<string>('jwt.issuer'),
          audience: configService.get<string>('jwt.audience'),
        } as Record<string, unknown>,
      }),
    }),
    UserModule,
    RoleModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule implements OnModuleInit {
  private readonly logger = new Logger(AuthModule.name);

  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedAdminUser();
  }

  private async seedAdminUser(): Promise<void> {
    const adminEmail = 'admin@admin.com';
    const existing = await this.userService.findByEmail(adminEmail);

    if (!existing) {
      const adminRole = await this.roleService.findByName(ROLES.ADMINISTRADOR);
      if (!adminRole) {
        this.logger.warn('Rol administrador no encontrado, no se puede crear admin');
        return;
      }

      await this.userService.create({
        firstName: 'Admin',
        lastName: 'System',
        email: adminEmail,
        password: 'Admin@123',
        roleIds: [adminRole.id],
      });

      this.logger.log('Usuario admin creado: admin@admin.com');
    }
  }
}
