import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * dualVerifyToken — verifica un JWT aceptando HS256 (secreto compartido, actual)
 * O RS256 (clave PÚBLICA, futuro), eligiendo la llave según el `alg` del header
 * (auditoría #13). Para los puntos que verifican MANUALMENTE con JwtService (los
 * gateways WebSocket) — no pasan por BaseJwtStrategy, así que necesitan esta
 * misma lógica dual o rechazarían los tokens RS256 tras el flip.
 */
export function dualVerifyToken(
  jwtService: JwtService,
  config: ConfigService,
  token: string,
): any {
  const decoded: any = jwtService.decode(token, { complete: true } as any);
  const alg = decoded?.header?.alg;
  if (alg === 'RS256') {
    const pub = config.get<string>('RS256_PUBLIC_KEY');
    if (!pub) throw new Error('Token RS256 pero RS256_PUBLIC_KEY no configurada');
    return jwtService.verify(token, {
      publicKey: pub.replace(/\\n/g, '\n'),
      algorithms: ['RS256'],
    } as any);
  }
  return jwtService.verify(token, {
    secret: config.getOrThrow<string>('JWT_SECRET'),
    algorithms: ['HS256'],
  } as any);
}
