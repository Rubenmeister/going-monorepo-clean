import { JwtService } from '@nestjs/jwt';
import { OauthStateService } from './oauth-state.service';

describe('OauthStateService', () => {
  let service: OauthStateService;
  let jwt: JwtService;
  const ORIGINAL_ENV = process.env.ALLOWED_RETURN_URLS;

  beforeEach(() => {
    jwt = new JwtService({ secret: 'test-secret' });
    service = new OauthStateService(jwt);
  });

  afterEach(() => {
    process.env.ALLOWED_RETURN_URLS = ORIGINAL_ENV;
  });

  describe('sign / verify', () => {
    it('firma y recupera el returnTo (roundtrip)', () => {
      const state = service.sign('https://app.goingec.com/callback');
      expect(service.verify(state)).toBe('https://app.goingec.com/callback');
    });

    it('devuelve null si no hay state', () => {
      expect(service.verify(undefined)).toBeNull();
    });

    it('devuelve null si el state está manipulado', () => {
      expect(service.verify('basura.no.valida')).toBeNull();
    });

    it('devuelve null si el state fue firmado con otra clave (no manipulable)', () => {
      const attacker = new JwtService({ secret: 'clave-del-atacante' });
      const forged = attacker.sign({ returnTo: 'https://evil.com' });
      expect(service.verify(forged)).toBeNull();
    });
  });

  describe('validateReturnTo (protección open-redirect)', () => {
    beforeEach(() => {
      process.env.ALLOWED_RETURN_URLS =
        'https://app.goingec.com,https://admin.goingec.com';
    });

    it('acepta un origin de la whitelist con cualquier path', () => {
      expect(
        service.validateReturnTo('https://app.goingec.com/dashboard/x')
      ).toBe('https://app.goingec.com/dashboard/x');
    });

    it('rechaza un origin fuera de la whitelist (open-redirect)', () => {
      expect(service.validateReturnTo('https://evil.com/phishing')).toBeNull();
    });

    it('rechaza una URL malformada', () => {
      expect(service.validateReturnTo('no-es-una-url')).toBeNull();
    });

    it('rechaza null/undefined', () => {
      expect(service.validateReturnTo(null)).toBeNull();
      expect(service.validateReturnTo(undefined)).toBeNull();
    });

    it('rechaza todo si la whitelist no está configurada', () => {
      process.env.ALLOWED_RETURN_URLS = '';
      expect(service.validateReturnTo('https://app.goingec.com')).toBeNull();
    });
  });
});
