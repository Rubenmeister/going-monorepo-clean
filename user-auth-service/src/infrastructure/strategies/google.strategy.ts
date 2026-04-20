import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { OAuthLoginDto } from '@going-monorepo-clean/domains-user-core';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private static readonly logger = new Logger(GoogleStrategy.name);

  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientID || !clientSecret) {
      // Evitamos que Passport tire excepción en el constructor y tumbe el
      // arranque del servicio en Cloud Run. Si faltan las credenciales, la
      // estrategia queda registrada pero fallará cuando alguien intente usarla.
      GoogleStrategy.logger.warn(
        'GOOGLE_CLIENT_ID/SECRET no configuradas — login con Google deshabilitado.'
      );
    }
    super({
      clientID: clientID ?? 'oauth-disabled',
      clientSecret: clientSecret ?? 'oauth-disabled',
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? '/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): void {
    const { name, emails, photos } = profile;
    const dto: OAuthLoginDto = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      oauthProvider: 'google',
      oauthId: profile.id,
      profilePicture: photos?.[0]?.value,
    };
    done(null, dto);
  }
}
