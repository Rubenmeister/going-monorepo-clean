/**
 * MfaService — gestión de Multi-Factor Authentication (TOTP) para usuarios.
 *
 * Stack: speakeasy (TOTP RFC 6238) + qrcode (data URL para escanear con
 * Google Authenticator / Authy / 1Password).
 *
 * Flujo de activación:
 *   1. Usuario logueado llama POST /auth/mfa/setup
 *      → genera secret + retorna { qrDataUrl, manualEntryCode, recoveryCodes }
 *      → guarda secret en User pero mfaEnabled=false todavía
 *      → recoveryCodes se devuelven UNA VEZ en plano + se guardan HASHEADOS
 *   2. Usuario escanea QR con su Authenticator y obtiene un código de 6 dígitos
 *   3. POST /auth/mfa/enable con el código → valida → setea mfaEnabled=true
 *
 * Flujo de login con MFA:
 *   1. POST /auth/corporate/login con email+password
 *   2. Si user.mfaEnabled, response = { mfaRequired:true, mfaToken } (efímero)
 *   3. POST /auth/mfa/verify-login con { mfaToken, code }
 *   4. code puede ser TOTP (6 dígitos) o recovery code (8 chars alfanuméricos)
 *   5. Si recovery → invalidar inmediatamente (one-time)
 *   6. Emitir accessToken + refreshToken normales
 *
 * Almacenamiento:
 *   - mfaSecret: en User document, campo `select: false` → no se devuelve
 *     en queries default. Solo el service lo carga con `.select('+mfaSecret')`.
 *   - mfaRecoveryCodes: array de hashes bcrypt. Cuando se usa uno, se busca
 *     por bcrypt.compare en cada hash y se remueve.
 */
import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { UserDocument, UserModelSchema } from '../infrastructure/user.schema';

interface MfaSetupResponse {
  qrDataUrl: string;
  manualEntryCode: string;
  recoveryCodes: string[];
}

@Injectable()
export class MfaService {
  /** Issuer mostrado en Google Authenticator (debajo del nombre de cuenta). */
  private readonly issuer = 'Going Empresas';
  /** TOTP step (segundos). RFC 6238 default = 30. */
  private readonly stepSeconds = 30;
  /** Tolerancia ±N steps por drift de reloj. 1 = ±30s. */
  private readonly windowSteps = 1;

  constructor(
    @InjectModel(UserModelSchema.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /** GET /auth/mfa/status — para que el front sepa si está activado. */
  async getStatus(userId: string): Promise<{ enabled: boolean; activatedAt?: Date }> {
    const user = await this.userModel.findOne({ id: userId }).lean();
    if (!user) throw new NotFoundException('User not found');
    return {
      enabled: !!user.mfaEnabled,
      activatedAt: user.mfaActivatedAt,
    };
  }

  /**
   * POST /auth/mfa/setup
   * Genera un secret nuevo + recovery codes. NO activa MFA todavía;
   * activate requiere POST /auth/mfa/enable con un código válido.
   *
   * Si el user ya tiene MFA activo, devolvemos 400 — debe desactivar primero.
   * Si tiene un setup a medio camino (secret guardado pero mfaEnabled=false),
   * generamos uno nuevo (sobreescribe el anterior + nuevos recovery codes).
   */
  async setup(userId: string): Promise<MfaSetupResponse> {
    const user = await this.userModel.findOne({ id: userId }).select('+mfaSecret').lean();
    if (!user) throw new NotFoundException('User not found');
    if (user.mfaEnabled) {
      throw new BadRequestException(
        'MFA ya está activado. Desactívalo primero si quieres regenerar el secret.',
      );
    }

    const secret = speakeasy.generateSecret({
      name: `${this.issuer}:${user.email}`,
      issuer: this.issuer,
      length: 20,
    });

    // Recovery codes en plano (los devolvemos UNA VEZ al front).
    const recoveryCodesPlain = this.generateRecoveryCodes(8);
    // Hash cada uno para storage.
    const recoveryCodesHashed = await Promise.all(
      recoveryCodesPlain.map((c) => bcrypt.hash(c, 10)),
    );

    await this.userModel.updateOne(
      { id: userId },
      {
        $set: {
          mfaSecret: secret.base32,
          mfaRecoveryCodes: recoveryCodesHashed,
        },
      },
    );

    const otpauthUrl = secret.otpauth_url!;
    const qrDataUrl = await qrcode.toDataURL(otpauthUrl);

    return {
      qrDataUrl,
      manualEntryCode: secret.base32,
      recoveryCodes: recoveryCodesPlain,
    };
  }

  /**
   * POST /auth/mfa/enable — body { code }
   * Verifica el primer código TOTP para asegurar que el user lo escaneó OK.
   * Si verifica, marca mfaEnabled=true + mfaActivatedAt=now.
   */
  async enable(userId: string, code: string): Promise<{ enabled: true; activatedAt: Date }> {
    const user = await this.userModel.findOne({ id: userId }).select('+mfaSecret').lean();
    if (!user) throw new NotFoundException('User not found');
    if (user.mfaEnabled) {
      throw new BadRequestException('MFA ya está activado');
    }
    if (!user.mfaSecret) {
      throw new BadRequestException('Falta hacer setup antes de activar');
    }

    const valid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: this.windowSteps,
      step: this.stepSeconds,
    });
    if (!valid) {
      throw new UnauthorizedException('Código TOTP inválido');
    }

    const now = new Date();
    await this.userModel.updateOne(
      { id: userId },
      { $set: { mfaEnabled: true, mfaActivatedAt: now } },
    );
    return { enabled: true, activatedAt: now };
  }

  /**
   * POST /auth/mfa/disable — body { password, code? }
   * Requiere password actual + (opcionalmente) un código TOTP válido si el
   * user todavía tiene acceso al app. Si lo perdió, puede usar un recovery
   * code en lugar del TOTP code.
   * Limpia mfaSecret, mfaRecoveryCodes, marca mfaEnabled=false.
   */
  async disable(
    userId: string,
    password: string,
    code: string,
  ): Promise<{ enabled: false }> {
    const user = await this.userModel
      .findOne({ id: userId })
      .select('+mfaSecret +mfaRecoveryCodes +passwordHash')
      .lean();
    if (!user) throw new NotFoundException('User not found');
    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA no está activado');
    }

    // 1. Password debe coincidir
    if (!user.passwordHash) {
      throw new UnauthorizedException('Esta cuenta no tiene password (OAuth)');
    }
    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Password incorrecto');
    }

    // 2. Code debe ser TOTP válido o un recovery code
    const codeOk = await this.verifyAnyCode(user, code);
    if (!codeOk.valid) {
      throw new UnauthorizedException('Código inválido');
    }

    await this.userModel.updateOne(
      { id: userId },
      {
        $set: { mfaEnabled: false },
        $unset: { mfaSecret: '', mfaRecoveryCodes: '', mfaActivatedAt: '' },
      },
    );
    return { enabled: false };
  }

  /**
   * POST /auth/mfa/regenerate-codes
   * Reemplaza los 8 recovery codes por 8 nuevos. Útil si el usuario
   * los perdió o usó la mayoría. Requiere TOTP code válido.
   */
  async regenerateRecoveryCodes(userId: string, code: string): Promise<string[]> {
    const user = await this.userModel.findOne({ id: userId }).select('+mfaSecret').lean();
    if (!user) throw new NotFoundException('User not found');
    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA no está activado');
    }
    if (!user.mfaSecret) {
      throw new BadRequestException('Falta el secret MFA');
    }
    const valid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: this.windowSteps,
      step: this.stepSeconds,
    });
    if (!valid) {
      throw new UnauthorizedException('Código TOTP inválido');
    }

    const newCodesPlain = this.generateRecoveryCodes(8);
    const newCodesHashed = await Promise.all(
      newCodesPlain.map((c) => bcrypt.hash(c, 10)),
    );
    await this.userModel.updateOne(
      { id: userId },
      { $set: { mfaRecoveryCodes: newCodesHashed } },
    );
    return newCodesPlain;
  }

  /**
   * Verifica un código durante login MFA. Lo usa el endpoint de login con
   * MFA challenge — NO requiere autenticación previa (el caller ya validó
   * el mfaToken efímero antes de llamar).
   *
   * Acepta tanto TOTP (6 dígitos) como recovery code (8 chars alfanum).
   * Si es recovery code, lo invalida (remove from array).
   */
  async verifyChallenge(userId: string, code: string): Promise<{ valid: boolean }> {
    const user = await this.userModel
      .findOne({ id: userId })
      .select('+mfaSecret +mfaRecoveryCodes')
      .lean();
    if (!user || !user.mfaEnabled) {
      return { valid: false };
    }
    const result = await this.verifyAnyCode(user, code);
    if (result.valid && result.usedRecoveryCodeIndex !== undefined) {
      // Remueve el recovery code usado del array.
      const newCodes = [...user.mfaRecoveryCodes];
      newCodes.splice(result.usedRecoveryCodeIndex, 1);
      await this.userModel.updateOne(
        { id: userId },
        { $set: { mfaRecoveryCodes: newCodes } },
      );
    }
    return { valid: result.valid };
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  /**
   * Genera N recovery codes de 8 caracteres alfanuméricos (mayúsculas + dígitos).
   * Formato XXXX-XXXX para legibilidad.
   */
  private generateRecoveryCodes(n: number): string[] {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin I/O/0/1 ambiguos
    const codes: string[] = [];
    for (let i = 0; i < n; i++) {
      const buf = randomBytes(8);
      let s = '';
      for (let j = 0; j < 8; j++) {
        s += chars[buf[j] % chars.length];
      }
      codes.push(`${s.slice(0, 4)}-${s.slice(4)}`);
    }
    return codes;
  }

  /**
   * Intenta verificar un código contra TOTP primero, después contra los
   * recovery codes. Retorna { valid, usedRecoveryCodeIndex } — si es
   * recovery, el caller debe invalidarlo.
   */
  private async verifyAnyCode(
    user: { mfaSecret?: string; mfaRecoveryCodes?: string[] },
    code: string,
  ): Promise<{ valid: boolean; usedRecoveryCodeIndex?: number }> {
    const normalized = code.replace(/\s+/g, '').toUpperCase();

    // TOTP: dígitos puros (acepta 6-8).
    if (user.mfaSecret && /^\d{6,8}$/.test(normalized)) {
      const ok = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: normalized,
        window: this.windowSteps,
        step: this.stepSeconds,
      });
      if (ok) return { valid: true };
    }

    // Recovery code: 8 chars + guion (XXXX-XXXX) o sin guión.
    if (user.mfaRecoveryCodes && user.mfaRecoveryCodes.length > 0) {
      const formattedCode =
        normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4)}` : normalized;
      for (let i = 0; i < user.mfaRecoveryCodes.length; i++) {
        if (await bcrypt.compare(formattedCode, user.mfaRecoveryCodes[i])) {
          return { valid: true, usedRecoveryCodeIndex: i };
        }
      }
    }

    return { valid: false };
  }
}
