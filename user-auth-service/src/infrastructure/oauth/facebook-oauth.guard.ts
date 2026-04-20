import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OauthStateService } from './oauth-state.service';

/**
 * Guard para Facebook OAuth que inyecta `state` firmado con el `returnTo`.
 * Ver documentación en `GoogleOauthGuard` — misma idea.
 */
@Injectable()
export class FacebookOauthGuard extends AuthGuard('facebook') {
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
