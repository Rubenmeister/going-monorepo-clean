import { User } from '@going-monorepo-clean/domains-user-core';

export const I_TOKEN_SERVICE = Symbol('ITokenService');

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface ITokenService {
  generateToken(user: User): Promise<string>;
  verifyToken(token: string): Promise<TokenPayload | null>;
}
