import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from './jwt.token.service';

const makeConfig = (overrides: Record<string, unknown> = {}) =>
  ({
    get: jest.fn((key: string) => overrides[key]),
  }) as never;

describe('JwtTokenService', () => {
  let jwt: JwtService;
  let service: JwtTokenService;

  beforeEach(() => {
    jwt = new JwtService({ secret: 'test-secret' });
    service = new JwtTokenService(jwt, makeConfig());
  });

  describe('access token', () => {
    it('genera y verifica un access token con identidad y roles', () => {
      const token = service.generateAccessToken(
        'user-1' as never,
        'a@b.com',
        ['admin', 'user']
      );
      const decoded = service.verifyAccessToken(token);
      expect(decoded.sub).toBe('user-1');
      expect(decoded.email).toBe('a@b.com');
      expect(decoded.roles).toEqual(['admin', 'user']);
    });

    it('incluye un jti único por token (para revocación)', () => {
      const t1 = service.generateAccessToken('u' as never, 'a@b.com', []);
      const t2 = service.generateAccessToken('u' as never, 'a@b.com', []);
      expect(service.extractJti(t1)).toBeTruthy();
      expect(service.extractJti(t1)).not.toBe(service.extractJti(t2));
    });

    it('incluye companyId sólo cuando se proporciona', () => {
      const conCompany = service.generateAccessToken(
        'u' as never,
        'a@b.com',
        [],
        'company-9'
      );
      const sinCompany = service.generateAccessToken('u' as never, 'a@b.com', []);
      expect((jwt.decode(conCompany) as Record<string, unknown>).companyId).toBe(
        'company-9'
      );
      expect(
        (jwt.decode(sinCompany) as Record<string, unknown>).companyId
      ).toBeUndefined();
    });

    it('rechaza un token cuyo tipo no es access', () => {
      const refreshLike = jwt.sign({
        sub: 'u',
        email: 'a@b.com',
        type: 'refresh',
      });
      expect(() => service.verifyAccessToken(refreshLike)).toThrow(
        'Invalid token type'
      );
    });

    it('rechaza un token con firma inválida', () => {
      expect(() => service.verifyAccessToken('xx.yy.zz')).toThrow();
    });
  });

  describe('refresh token', () => {
    it('genera un token opaco con prefijo rt_ y único', () => {
      const a = service.generateRefreshToken();
      const b = service.generateRefreshToken();
      expect(a).toMatch(/^rt_/);
      expect(a).not.toBe(b);
    });
  });

  describe('extractJti', () => {
    it('devuelve null para un token basura', () => {
      expect(service.extractJti('no-es-jwt')).toBeNull();
    });
  });

  describe('getAccessTokenExpirationSeconds', () => {
    it('parsea "15m" → 900', () => {
      const s = new JwtTokenService(
        jwt,
        makeConfig({ JWT_ACCESS_TOKEN_EXPIRES_IN: '15m' })
      );
      expect(s.getAccessTokenExpirationSeconds()).toBe(900);
    });

    it('parsea "7d" → 604800', () => {
      const s = new JwtTokenService(
        jwt,
        makeConfig({ JWT_ACCESS_TOKEN_EXPIRES_IN: '7d' })
      );
      expect(s.getAccessTokenExpirationSeconds()).toBe(604800);
    });

    it('un número crudo se interpreta como segundos', () => {
      const s = new JwtTokenService(
        jwt,
        makeConfig({ JWT_ACCESS_TOKEN_EXPIRES_IN: '3600' })
      );
      expect(s.getAccessTokenExpirationSeconds()).toBe(3600);
    });

    it('usa 15m (900s) por defecto si no hay config', () => {
      expect(service.getAccessTokenExpirationSeconds()).toBe(900);
    });
  });
});
