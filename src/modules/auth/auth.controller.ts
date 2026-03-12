// src/modules/auth/auth.controller.ts

import { Controller, Post, Get, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { Public } from '@decorators/public.decorator';
import { IApiResponse } from '@shared/common';
import { RESPONSE_MESSAGES } from '@constants/response-messages.constant';
import { IUserResponse } from '@modules/user/interfaces';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import { ILoginResponse, IAuthTokens, IRegisterResponse } from './interfaces';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos invalidos' })
  @ApiResponse({ status: 409, description: 'El correo ya existe' })
  async register(@Body() dto: RegisterDto): Promise<IApiResponse<IRegisterResponse>> {
    const data = await this.authService.register(dto);
    return {
      success: true,
      message: RESPONSE_MESSAGES.AUTH.REGISTER_PENDING,
      data,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesion' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales invalidas' })
  async login(@Body() dto: LoginDto): Promise<IApiResponse<ILoginResponse>> {
    const data = await this.authService.login(dto);
    return {
      success: true,
      message: RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS,
      data,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar token de acceso' })
  @ApiResponse({ status: 200, description: 'Token refrescado' })
  @ApiResponse({ status: 401, description: 'Token invalido o expirado' })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<IApiResponse<IAuthTokens>> {
    const data = await this.authService.refreshToken(dto);
    return {
      success: true,
      message: RESPONSE_MESSAGES.AUTH.TOKEN_REFRESHED,
      data,
    };
  }

  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil obtenido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProfile(
    @Req() req: { user: { sub: string; email: string; roles: string[] } },
  ): Promise<IApiResponse<IUserResponse>> {
    const data = await this.authService.getProfile(req.user.sub);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
  }
}
