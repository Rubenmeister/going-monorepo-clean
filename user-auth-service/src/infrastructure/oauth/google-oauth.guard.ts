import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OauthStateService } from './oauth-state.service';

/**
 * Guard para Google OAuth que inyecta `state` firmado con el `returnTo`.
 *
 * Cuando el usuario entra a `/auth/google?returnTo=https://admin.goingec.com/auth/callback`,
 * este guard firma el returnTo como JWT y lo manda a Google como parámetro `state`.
 * Google lo devuelve intacto en el callback → ahí lo verificamos y redirigimos.
 */
@Injectable()
export class GoogleOauthGuard extends AuthGuard('google') {
  constructor(private readonly stateService: OauthStateService) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext): Record<string, any> {
    const req = context.switchToHttp().getRequest();
    const returnTo =
      typeof req?.query?.returnTo === 'string' ? req.query.returnTo : '';
    const state = returnTo ? this.stateService.sign(returnTo) : undefined;
    return state ? { state, session: false } : { session: false };
  }
}
