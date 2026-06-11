import { Injectable } from '@nestjs/common';
import { BaseJwtStrategy } from '@going-monorepo-clean/shared-infrastructure';
import { ConfigService } from '@nestjs/config';

/**
 * JwtStrategy de corporate-service — verifica FIRMA + expiración del JWT
 * (passport-jwt, secret JWT_SECRET) y puebla req.user con el payload validado.
 *
 * Reemplaza la decodificación base64 sin verificación que tenía el controller
 * (auditoría #2): antes se confiaba en `companyId`/`roles` del payload sin
 * chequear la firma, permitiendo forjar un admin con `alg:none`.
 */
@Injectable()
export class JwtStrategy extends BaseJwtStrategy {
  constructor(configService: ConfigService) {
    super(configService);
  }
}
