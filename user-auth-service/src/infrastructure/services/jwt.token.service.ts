import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenService } from '@going-monorepo-clean/domains-user-core'; // Reemplaza con tu scope
import { UUID } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateAuthToken(userId: UUID, email: string, roles: string[]): string {
    const payload = {
      sub: userId,
      email: email,
      roles: roles,
    };
    return this.jwtService.sign(payload);
  }
}