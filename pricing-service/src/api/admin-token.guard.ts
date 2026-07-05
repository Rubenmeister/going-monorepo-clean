import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

/**
 * Guard simple para los endpoints /admin/* del motor de tarifas.
 *
 * Compara el header `x-admin-token` contra `PRICING_ADMIN_TOKEN` (secret en
 * Cloud Run). Fail-closed: si el secret NO está configurado, los endpoints de
 * administración quedan DESHABILITADOS (nadie puede cambiar precios por accidente).
 * `/price` (lectura) NO usa este guard — es público para que todos coticen.
 *
 * F3 reemplazará esto por el JWT de admin del panel; para F1 un token compartido
 * protege la mutación de precios.
 */
@Injectable()
export class AdminTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.PRICING_ADMIN_TOKEN;
    if (!expected) {
      throw new UnauthorizedException('Admin deshabilitado (PRICING_ADMIN_TOKEN no configurado)');
    }
    const req = context.switchToHttp().getRequest();
    const provided = req.headers['x-admin-token'];
    if (provided !== expected) {
      throw new UnauthorizedException('x-admin-token inválido');
    }
    return true;
  }
}
