import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Decorator para obtener el usuario actual del request
 * @param data - Campo específico del usuario (opcional)
 * @example
 * // Obtener usuario completo
 * @Get('profile')
 * getProfile(@CurrentUser() user: IRequestUser) {}
 *
 * // Obtener solo el ID
 * @Get('profile')
 * getProfile(@CurrentUser('id') userId: string) {}
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
