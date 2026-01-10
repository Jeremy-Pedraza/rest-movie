import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Verificar si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Manejar errores específicos de JWT
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Token expirado');
    }

    if (info?.name === 'JsonWebTokenError') {
      throw new UnauthorizedException('Token inválido');
    }

    if (err || !user) {
      throw new UnauthorizedException(
        info?.message || 'No autorizado - Token no proporcionado',
      );
    }

    return user;
  }
}
