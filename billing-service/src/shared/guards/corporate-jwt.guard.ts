import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de autenticación para facturación CORPORATIVA.
 *
 * Blindaje (auditoría Bloque 2 #1, CRÍTICO): antes era un `AuthGuard('jwt')`
 * pelado → aceptaba CUALQUIER JWT válido de la plataforma Going (pasajero,
 * conductor, cualquier usuario B2C). Esos tokens NO traen `companyId`, así que
 * `req.user.companyId` quedaba `undefined`. El repositorio lo pasaba a Mongoose,
 * que DESCARTA los valores `undefined` al castear la query → el filtro de tenant
 * desaparecía y `GET /invoices` devolvía las facturas de TODAS las empresas
 * (nombres de cliente, RUC, cuentas bancarias, montos). Cross-tenant total.
 *
 * FIX: aquí exigimos que el token traiga un `companyId` string no-vacío. Un JWT
 * B2C sin empresa se rechaza con 403 ANTES de tocar el repositorio. Es el punto
 * único que cubre los 11 endpoints del InvoiceController. La defensa en
 * profundidad (repo que también rechaza scope vacío) queda como segunda barrera.
 */
@Injectable()
export class CorporateJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: any): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or missing token');
    }
    if (typeof user.companyId !== 'string' || user.companyId.trim() === '') {
      // El token es válido pero es B2C (sin empresa): no puede tocar
      // facturación corporativa. Nunca dejar que un scope vacío llegue a Mongo.
      throw new ForbiddenException('Corporate membership required');
    }
    return user as TUser;
  }
}
