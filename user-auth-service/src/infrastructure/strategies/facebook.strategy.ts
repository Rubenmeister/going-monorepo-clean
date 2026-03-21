import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { OAuthLoginDto } from '@going-monorepo-clean/domains-user-core';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
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
