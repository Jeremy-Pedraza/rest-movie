// src/modules/auth/auth.controller.ts

/**
 * @fileoverview Controller para autenticación
 * @module modules/auth
 *
 * ⚠️ REGLAS:
 * - NO usar try-catch (AllExceptionsFilter lo maneja)
 * - SIEMPRE usar decoradores Swagger
 * - SIEMPRE retornar IApiResponse<T> con message personalizado
 * - @Public() en rutas sin autenticación
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

// Decoradores
import { CurrentUser } from '@decorators/current-user.decorator';
import { Public } from '@decorators/public.decorator';
import { SkipTenant } from '@decorators/skip-tenant.decorator';

// Shared interfaces
import { IApiResponse } from '@shared/common';

// Local imports
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto';
import {
  IAuthResponse,
  IForgotPasswordResponse,
  ILogoutResponse,
  IPasswordChangeResponse,
  IRefreshTokenResponse,
  IResetPasswordResponse,
  ISessionInfo,
} from './interfaces';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ============================================
  // AUTENTICACIÓN (Públicas)
  // ============================================

  @Public()
  @SkipTenant() // Login no requiere tenant (el usuario puede no tener company aún)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuario' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 429, description: 'Rate limit excedido' })
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<IApiResponse<IAuthResponse>> {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    const data = await this.authService.login(dto, ipAddress, userAgent);

    return {
      success: true,
      message: 'Login exitoso',
      data,
    };
  }

  @Public()
  @SkipTenant() // Registro no requiere tenant (el usuario aún no existe)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registro de nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  @ApiResponse({ status: 429, description: 'Rate limit excedido' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
  ): Promise<IApiResponse<IAuthResponse>> {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    const data = await this.authService.register(dto, ipAddress, userAgent);

    return {
      success: true,
      message: 'Usuario registrado exitosamente',
      data,
    };
  }

  @Public()
  @SkipTenant() // Refresh token no requiere tenant
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token renovado exitosamente' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<IApiResponse<IRefreshTokenResponse>> {
    const data = await this.authService.refreshToken(dto);

    return {
      success: true,
      message: 'Token renovado exitosamente',
      data,
    };
  }

  // ============================================
  // LOGOUT (Autenticadas)
  // ============================================

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout - cerrar sesión actual' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async logout(
    @CurrentUser('id') userId: string,
    @Body() dto: RefreshTokenDto,
  ): Promise<IApiResponse<ILogoutResponse>> {
    const data = await this.authService.logout(userId, dto.refreshToken);

    return {
      success: true,
      message: 'Sesión cerrada exitosamente',
      data,
    };
  }

  @Post('logout/all')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout - cerrar todas las sesiones' })
  @ApiResponse({ status: 200, description: 'Todas las sesiones cerradas' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async logoutAll(@CurrentUser('id') userId: string): Promise<IApiResponse<ILogoutResponse>> {
    const data = await this.authService.logoutAll(userId);

    return {
      success: true,
      message: 'Todas las sesiones cerradas exitosamente',
      data,
    };
  }

  // ============================================
  // GESTIÓN DE CONTRASEÑA (Públicas/Privadas)
  // ============================================

  @Post('change-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar contraseña (usuario autenticado)' })
  @ApiResponse({ status: 200, description: 'Contraseña cambiada exitosamente' })
  @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<IApiResponse<IPasswordChangeResponse>> {
    const data = await this.authService.changePassword(userId, dto);

    return {
      success: true,
      message: 'Contraseña cambiada exitosamente',
      data,
    };
  }

  @Public()
  @SkipTenant() // Forgot password no requiere tenant
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar reset de contraseña' })
  @ApiResponse({ status: 200, description: 'Solicitud procesada' })
  @ApiResponse({ status: 429, description: 'Rate limit excedido' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<IApiResponse<IForgotPasswordResponse>> {
    const data = await this.authService.forgotPassword(dto);

    return {
      success: true,
      message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña',
      data,
    };
  }

  @Public()
  @SkipTenant() // Reset password no requiere tenant
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resetear contraseña con token' })
  @ApiResponse({ status: 200, description: 'Contraseña reseteada exitosamente' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<IApiResponse<IResetPasswordResponse>> {
    const data = await this.authService.resetPassword(dto);

    return {
      success: true,
      message: 'Contraseña reseteada exitosamente',
      data,
    };
  }

  // ============================================
  // GESTIÓN DE SESIONES (Autenticadas)
  // ============================================

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener sesiones activas del usuario' })
  @ApiResponse({ status: 200, description: 'Sesiones obtenidas' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getActiveSessions(
    @CurrentUser('id') userId: string,
  ): Promise<IApiResponse<ISessionInfo[]>> {
    const data = await this.authService.getActiveSessions(userId);

    return {
      success: true,
      message: 'Sesiones activas obtenidas',
      data,
    };
  }

  @Delete('sessions/:sessionId')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar sesión específica' })
  @ApiParam({ name: 'sessionId', description: 'ID de la sesión' })
  @ApiResponse({ status: 200, description: 'Sesión revocada' })
  @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<IApiResponse<{ revoked: boolean }>> {
    const revoked = await this.authService.revokeSession(userId, sessionId);

    return {
      success: true,
      message: 'Sesión revocada exitosamente',
      data: { revoked },
    };
  }

  @Delete('sessions/other/all')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar todas las sesiones excepto la actual' })
  @ApiResponse({ status: 200, description: 'Sesiones revocadas' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async revokeOtherSessions(
    @CurrentUser('id') userId: string,
    @Body('currentSessionId') currentSessionId: string,
  ): Promise<IApiResponse<{ revokedCount: number }>> {
    const revokedCount = await this.authService.revokeOtherSessions(userId, currentSessionId);

    return {
      success: true,
      message: `${revokedCount} sesiones revocadas exitosamente`,
      data: { revokedCount },
    };
  }

  // ============================================
  // ME - Usuario actual (Autenticado)
  // ============================================

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Usuario obtenido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getMe(@CurrentUser() user: any): IApiResponse<any> {
    return {
      success: true,
      message: 'Usuario autenticado',
      data: user,
    };
  }
}
