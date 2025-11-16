import { UUID } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope

export const ITokenService = Symbol('ITokenService');

export interface ITokenService {
  generateAuthToken(userId: UUID, email: string, roles: string[]): string;
}