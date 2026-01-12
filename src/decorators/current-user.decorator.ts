// src/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Tipo del usuario en el request
 */
interface RequestUser {
  id: string;
  email: string;
  roles?: string[];
  [key: string]: unknown;
}

/**
 * Decorator para obtener el usuario actual del request
 * @param data - Campo específico del usuario (opcional)
 * @example
 * // Obtener usuario completo
 * @Get('profile')
 * getProfile(@CurrentUser() user: RequestUser) {}
 *
 * // Obtener solo el ID
 * @Get('profile')
 * getProfile(@CurrentUser('id') userId: string) {}
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as RequestUser | undefined;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
