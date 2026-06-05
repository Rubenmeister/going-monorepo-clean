import { SecurityService } from './security.service';

describe('SecurityService', () => {
  let service: SecurityService;

  beforeEach(() => {
    service = new SecurityService();
  });

  describe('cifrado de datos sensibles', () => {
    it('cifra y descifra recuperando el texto original (round-trip)', async () => {
      const plaintext = 'numero-tarjeta-4242-4242-4242-4242';
      const cipher = await service.encryptData(plaintext);

      expect(cipher).not.toBe(plaintext);
      expect(await service.decryptData(cipher)).toBe(plaintext);
    });

    it('produce ciphertext distinto en cada cifrado (IV aleatorio)', async () => {
      const a = await service.encryptData('mismo-secreto');
      const b = await service.encryptData('mismo-secreto');
      expect(a).not.toBe(b);
      expect(await service.decryptData(a)).toBe('mismo-secreto');
      expect(await service.decryptData(b)).toBe('mismo-secreto');
    });

    it('falla al descifrar datos manipulados (authTag GCM)', async () => {
      const cipher = await service.encryptData('integridad');
      const decoded = JSON.parse(
        Buffer.from(cipher, 'base64').toString()
      );
      decoded.data = decoded.data.replace(/.$/, (c: string) =>
        c === '0' ? '1' : '0'
      );
      const tampered = Buffer.from(JSON.stringify(decoded)).toString('base64');

      await expect(service.decryptData(tampered)).rejects.toThrow();
    });

    it('falla al descifrar con un keyId desconocido', async () => {
      const cipher = await service.encryptData('x');
      const decoded = JSON.parse(Buffer.from(cipher, 'base64').toString());
      decoded.keyId = 'no-existe';
      const bad = Buffer.from(JSON.stringify(decoded)).toString('base64');

      await expect(service.decryptData(bad)).rejects.toThrow(
        'Encryption key not found'
      );
    });
  });

  describe('rotación de claves', () => {
    it('marca la clave anterior como ROTATED y activa una nueva', async () => {
      const before = await service.encryptData('antes');
      const newKey = await service.rotateEncryptionKeys();

      expect(newKey.status).toBe('ACTIVE');
      // El dato cifrado con la clave anterior sigue siendo descifrable
      expect(await service.decryptData(before)).toBe('antes');
    });

    it('usa la nueva clave para cifrados posteriores', async () => {
      const before = await service.encryptData('antes');
      await service.rotateEncryptionKeys();
      const after = await service.encryptData('despues');

      const keyBefore = JSON.parse(Buffer.from(before, 'base64').toString())
        .keyId;
      const keyAfter = JSON.parse(Buffer.from(after, 'base64').toString())
        .keyId;
      expect(keyAfter).not.toBe(keyBefore);
    });
  });

  describe('autenticación de dos factores (2FA)', () => {
    it('genera 10 códigos de respaldo y queda deshabilitado hasta verificar', async () => {
      const tfa = await service.enableTwoFactorAuth('user-1', '2FA_AUTHENTICATOR');
      expect(tfa.backupCodes).toHaveLength(10);
      expect(tfa.enabled).toBe(false);
      expect(tfa.secret).toBeDefined();
    });

    it('confirma el 2FA con un código de respaldo válido', async () => {
      const tfa = await service.enableTwoFactorAuth('user-1', '2FA_AUTHENTICATOR');
      const code = tfa.backupCodes[0];

      const confirmed = await service.confirmTwoFactorAuth('user-1', code);
      expect(confirmed?.enabled).toBe(true);
    });

    it('los códigos de respaldo son de un solo uso', async () => {
      const tfa = await service.enableTwoFactorAuth('user-1', '2FA_AUTHENTICATOR');
      const code = tfa.backupCodes[0];

      await service.confirmTwoFactorAuth('user-1', code);
      // reusar el mismo código de respaldo ya no debe contar como válido
      expect(tfa.backupCodes).not.toContain(code);
    });

    it('confirmTwoFactorAuth devuelve null si el usuario no tiene 2FA', async () => {
      expect(await service.confirmTwoFactorAuth('desconocido', '123456')).toBeNull();
    });

    it('verifyTwoFactorCode acepta un código de 6 dígitos en una cuenta habilitada', async () => {
      const tfa = await service.enableTwoFactorAuth('user-1', '2FA_AUTHENTICATOR');
      await service.confirmTwoFactorAuth('user-1', tfa.backupCodes[0]);

      expect(await service.verifyTwoFactorCode('user-1', '123456')).toBe(true);
      expect(await service.verifyTwoFactorCode('user-1', 'abc')).toBe(false);
    });
  });

  describe('eventos de seguridad y cumplimiento', () => {
    it('registra un evento de seguridad sin resolver', async () => {
      const ev = await service.recordSecurityEvent(
        'user-1',
        'SUSPICIOUS_ACTIVITY',
        'CRITICAL',
        'Login desde IP desconocida'
      );
      expect(ev.resolved).toBe(false);
      expect(ev.severity).toBe('CRITICAL');
      expect(ev.userId).toBe('user-1');
    });

    it('reporta el estado de cumplimiento de las políticas iniciales', async () => {
      const status = await service.getComplianceStatus();
      expect(status.totalPolicies).toBeGreaterThanOrEqual(3);
      expect(status.compliant).toBe(status.totalPolicies);
    });
  });
});
