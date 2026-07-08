import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * InternalServiceGuard — protege endpoints servicio-a-servicio (S2S). Exige el
 * header `x-internal-token` igual a INTERNAL_SERVICE_TOKEN. Reemplaza al JWT de
 * usuario en endpoints internos (ej. attach-parcel): antes cualquier usuario con
 * un JWT válido podía llamarlos y mutar inventario (auditoría #20).
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
