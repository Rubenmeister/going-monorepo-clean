import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenService } from '@going-monorepo-clean/domains-user-core'; // Asegúrate de que el scope sea correcto

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(private readonly jwtService: JwtService) {}

  // 1. Implementación del método 'sign' (Requerido por ITokenService)
  sign(payload: any): string {
    return this.jwtService.sign(payload);
  }

  // 2. Implementación del método 'verify' (Requerido por ITokenService)
  verify(token: string): any {
    return this.jwtService.verify(token);
  }

  // (Opcional) Si tenías lógica extra en generateAuthToken, puedes adaptarla aquí,
  // pero el método 'sign' suele ser suficiente para payloads estándar.
}