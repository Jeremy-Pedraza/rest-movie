// src/modules/auth/auth.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { HandleErrorService } from '@shared/common';
import { RESPONSE_MESSAGES } from '@constants/response-messages.constant';
import { UserService } from '@modules/user/user.service';
import { IUserResponse } from '@modules/user/interfaces';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import { ITokenPayload, IAuthTokens, ILoginResponse } from './interfaces';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly handleError: HandleErrorService,
  ) {}

  async register(dto: RegisterDto): Promise<ILoginResponse> {
    try {
      const existing = await this.userService.findByEmail(dto.email);
      if (existing) {
        this.handleError.conflict(`El correo '${dto.email}' ya esta registrado`, 'email');
      }

      const user = await this.userService.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: dto.password,
      });

      const userResponse = this.userService.toResponse(user);
      const tokens = this.generateTokens(
        user.id,
        user.email,
        userResponse.roles.map((r) => r.name),
      );

      return { user: userResponse, tokens };
    } catch (error) {
      throw this.handleError.handle(error, 'Error en registro');
    }
  }

  async login(dto: LoginDto): Promise<ILoginResponse> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      this.handleError.unauthorized(RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      this.handleError.unauthorized(RESPONSE_MESSAGES.AUTH.USER_INACTIVE);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      this.handleError.unauthorized(RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const userResponse = this.userService.toResponse(user);
    const tokens = this.generateTokens(
      user.id,
      user.email,
      userResponse.roles.map((r) => r.name),
    );

    return { user: userResponse, tokens };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<IAuthTokens> {
    try {
      const payload = this.jwtService.verify<ITokenPayload>(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        issuer: this.configService.get<string>('jwt.issuer'),
        audience: this.configService.get<string>('jwt.audience'),
      });

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        this.handleError.unauthorized(RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
      }

      if (!user.isActive) {
        this.handleError.unauthorized(RESPONSE_MESSAGES.AUTH.USER_INACTIVE);
      }

      const userResponse = this.userService.toResponse(user);
      return this.generateTokens(
        user.id,
        user.email,
        userResponse.roles.map((r) => r.name),
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        this.handleError.unauthorized(RESPONSE_MESSAGES.AUTH.TOKEN_EXPIRED);
      }
      if (error instanceof Error && error.name === 'JsonWebTokenError') {
        this.handleError.unauthorized(RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
      }
      throw this.handleError.handle(error, 'Error refrescando token');
    }
  }

  async getProfile(userId: string): Promise<IUserResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      this.handleError.notFound('Usuario', userId);
    }
    return this.userService.toResponse(user);
  }

  private generateTokens(userId: string, email: string, roles: string[]): IAuthTokens {
    const payload: ITokenPayload = {
      sub: userId,
      email,
      roles,
    };

    const accessToken = this.jwtService.sign(payload as unknown as Record<string, unknown>);

    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    const refreshToken = this.jwtService.sign(
      payload as unknown as Record<string, unknown>,
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: refreshExpiresIn,
        issuer: this.configService.get<string>('jwt.issuer'),
        audience: this.configService.get<string>('jwt.audience'),
      } as Record<string, unknown>,
    );

    return {
      accessToken,
      refreshToken,
      tokenType: RESPONSE_MESSAGES.AUTH.TOKEN_TYPE,
      expiresIn: this.configService.get<string>('jwt.expiresIn') || '15m',
    };
  }
}
