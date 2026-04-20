import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { OAuthLoginDto } from '@going-monorepo-clean/domains-user-core';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  private static readonly logger = new Logger(FacebookStrategy.name);

  constructor() {
    const clientID = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    if (!clientID || !clientSecret) {
      FacebookStrategy.logger.warn(
        'FACEBOOK_APP_ID/SECRET no configuradas — login con Facebook deshabilitado.'
      );
    }
    super({
      clientID: clientID ?? 'oauth-disabled',
      clientSecret: clientSecret ?? 'oauth-disabled',
      callbackURL: process.env.FACEBOOK_CALLBACK_URL ?? '/auth/facebook/callback',
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      scope: ['email'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void
  ): void {
    const dto: OAuthLoginDto = {
      email: profile.emails?.[0]?.value ?? `${profile.id}@facebook.com`,
      firstName: profile.name?.givenName ?? profile.displayName,
      lastName: profile.name?.familyName ?? '',
      oauthProvider: 'facebook',
      oauthId: profile.id,
      profilePicture: (profile.photos?.[0] as any)?.value,
    };
    done(null, dto);
  }
}
