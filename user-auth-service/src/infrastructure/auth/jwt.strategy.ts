import { Injectable } from '@nestjs/common';
import { BaseJwtStrategy } from '@going-monorepo-clean/shared-infrastructure';
import { ConfigService } from '@nestjs/config';

/**
 * JwtStrategy — estrategia Passport local de user-auth-service.
 *
 * Reusa `BaseJwtStrategy` compartido (extrae token de Authorization
 * Bearer o cookie 'accessToken', valida firma con JWT_SECRET, normaliza
 * el payload en { userId, id, email, roles, role }).
 *
 * Registrada como provider en InfrastructureModule para que
 * `@UseGuards(AuthGuard('jwt'))` la encuentre al validar /auth/me y
 * /auth/me/points/*.
 */
@Injectable()
export class JwtStrategy extends BaseJwtStrategy {
  constructor(configService: ConfigService) {
    super(configService);
  }
}
