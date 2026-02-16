import { UUID } from '@going-monorepo-clean/shared-domain';

export const ITokenService = Symbol('ITokenService');

export interface ITokenService {
  generateAuthToken(userId: UUID, email: string, roles: string[]): string;
  generateRefreshToken(userId: UUID): string;
  verifyRefreshToken(token: string): { userId: string } | null;
}