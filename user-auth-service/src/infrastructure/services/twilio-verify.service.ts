import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * TwilioVerifyService — Verificación de número telefónico via OTP
 *
 * Flujo de registro:
 * 1. Usuario ingresa su número → sendCode('+593XXXXXXXXX')
 * 2. Twilio Verify envía SMS: "Your GOING SUPERAPP verification code is: XXXXXX"
 * 3. Usuario ingresa el código → verifyCode('+593XXXXXXXXX', '693321')
 * 4. Si valid=true → marcar teléfono como verificado en la BD
 *
 * Cuenta probada ✓:
 *   Account SID: AC7a19c161b448e8f717ed0a11318b546c
 *   Verify SID:  VAd203364312e71ca170af9ef4cb99f0f8
 *   Mensaje:    "Your GOING SUPERAPP verification code is: XXXXXX"
 *
 * Variables de entorno requeridas (.env):
 *   TWILIO_ACCOUNT_SID=AC7a19c161b448e8f717ed0a11318b546c
 *   TWILIO_AUTH_TOKEN=tu_auth_token_aqui
 *   TWILIO_VERIFY_SERVICE_SID=VAd203364312e71ca170af9ef4cb99f0f8
 */
@Injectable()
export class TwilioVerifyService {
  private readonly logger = new Logger(TwilioVerifyService.name);
  private client: any = null;
  private readonly verifySid: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const accountSid = config.get<string>('TWILIO_ACCOUNT_SID', '');
    const authToken  = config.get<string>('TWILIO_AUTH_TOKEN', '');
    this.verifySid   = config.get<string>('TWILIO_VERIFY_SERVICE_SID', '');
    this.enabled     = !!(accountSid && authToken && this.verifySid);

    if (this.enabled) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const twilio = require('twilio');
        this.client = twilio(accountSid, authToken);
        this.logger.log('Twilio Verify habilitado ✓ (VAd203...)');
      } catch {
        this.logger.warn('Paquete twilio no instalado → ejecutar: npm install twilio');
      }
    } else {
      this.logger.warn('Twilio Verify deshabilitado — variables de entorno no configuradas');
    }
  }

  /**
   * Envía el código OTP por SMS al número dado.
   * @param phoneE164 Número en formato E.164 — ej: +593992781751
   */
  async sendCode(phoneE164: string): Promise<{ sent: boolean; channel: string }> {
    if (!this.client) {
      // Modo mock para desarrollo sin credenciales reales
      this.logger.warn(`[MOCK] OTP enviado a ${phoneE164} → código: 000000`);
      return { sent: true, channel: 'sms' };
    }

    const phone = this.normalizePhone(phoneE164);

    const verification = await this.client.verify.v2
      .services(this.verifySid)
      .verifications.create({ to: phone, channel: 'sms' });

    this.logger.log(`OTP enviado a ${phone} — status: ${verification.status}`);
    return { sent: verification.status === 'pending', channel: verification.channel };
  }

  /**
   * Verifica el código OTP ingresado por el usuario.
   * @param phoneE164  Número usado al enviar el código
   * @param code       Código de 6 dígitos ingresado por el usuario
   * @returns true si el código es válido y no ha expirado
   */
  async verifyCode(phoneE164: string, code: string): Promise<boolean> {
    if (!this.client) {
      // Modo mock: código 000000 siempre válido en desarrollo
      this.logger.warn(`[MOCK] Verificando ${phoneE164} con código ${code}`);
      return code === '000000';
    }

    const phone = this.normalizePhone(phoneE164);

    const check = await this.client.verify.v2
      .services(this.verifySid)
      .verificationChecks.create({ to: phone, code });

    this.logger.log(`Verificación ${phone}: ${check.status} (valid: ${check.valid})`);

    if (!check.valid) {
      throw new BadRequestException('Código incorrecto o expirado. Solicita uno nuevo.');
    }

    return true;
  }

  /**
   * Normaliza el número al formato E.164.
   * Agrega +593 si el número empieza por 0 (Ecuador).
   */
  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/\s|-|\(|\)/g, '');
    if (cleaned.startsWith('0') && !cleaned.startsWith('+')) {
      return `+593${cleaned.slice(1)}`; // 0992781751 → +593992781751
    }
    if (!cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }
    return cleaned;
  }
}
