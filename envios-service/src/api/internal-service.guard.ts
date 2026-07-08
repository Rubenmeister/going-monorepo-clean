import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * InternalServiceGuard — protege endpoints servicio-a-servicio (S2S) con el
 * header `x-internal-token` = INTERNAL_SERVICE_TOKEN. Se combina con @Public
 * (que salta el JWT global) para que el webhook de pagos exija el token de
 * servicio en vez de quedar abierto a internet (auditoría #7).
 */
@Injectable()
export class InternalServiceGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const provided = req.headers?.['x-internal-token'];
    const expected = this.config.get<string>('INTERNAL_SERVICE_TOKEN');
    if (!expected || !provided || provided !== expected) {
      throw new ForbiddenException('Endpoint interno: token de servicio inválido');
    }
    return true;
  }
}
