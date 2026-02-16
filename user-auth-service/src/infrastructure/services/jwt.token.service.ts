import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ITokenService } from '@going-monorepo-clean/domains-user-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAuthToken(userId: UUID, email: string, roles: string[]): string {
    const payload = {
      sub: userId,
      email: email,
      roles: roles,
    };
    return this.jwtService.sign(payload);
  }

  generateRefreshToken(userId: UUID): string {
    return this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET', this.configService.get('JWT_SECRET')),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );
  }

  verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET', this.configService.get('JWT_SECRET')),
      });
      if (payload.type !== 'refresh') return null;
      return { userId: payload.sub };
    } catch {
      return null;
    }
  }
}