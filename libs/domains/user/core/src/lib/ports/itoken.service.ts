import { UUID } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope

export const ITokenService = Symbol('ITokenService');

export interface ITokenService {
  sign(payload: any): string;
  verify(token: string): any;
}