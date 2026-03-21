import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { OAuthLoginDto } from '@going-monorepo-clean/domains-user-core';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
