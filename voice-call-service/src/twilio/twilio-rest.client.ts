import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// twilio v5 NO expone default export invocable como function — el
// `import twilio from 'twilio'` típico de v4 falla con "twilio_1.default
// is not a function" en runtime. Usar el named export Twilio + new.
import { Twilio } from 'twilio';

/**
 * TwilioRestClient — wrapper liviano del SDK oficial twilio para las
 * operaciones REST que el bridge necesita.
 *
 * Operaciones expuestas:
 *  - redirectCall(callSid, twimlUrl) — fuerza a Twilio a descargar TwiML
 *    nuevo y ejecutarlo sobre la call activa. Lo usa el bridge para hacer
 *    handoff PSTN: cierra el <Connect><Stream> y ejecuta <Dial> al operador.
 *
 * Cred: TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN. Si no están set, los métodos
 * retornan false con warn — el bridge degrada gracefully a modo callback
 * (notif Telegram al operador, pero sin transfer PSTN real).
 *
 * Por qué wrapper en vez de usar el SDK directo en el bridge:
 *  - Centralizar config + auth en un solo provider
 *  - Loggear timing de cada call (Twilio API ~200-400ms típico)
 *  - Permitir mock fácil en tests sin necesitar HTTP fixtures
 */
@Injectable()
export class TwilioRestClient {
  private readonly logger = new Logger(TwilioRestClient.name);
  private readonly client: Twilio | null;
  private readonly accountSid: string;

  constructor(private readonly config: ConfigService) {
    this.accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID') ?? '';
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN') ?? '';

    if (!this.accountSid || !authToken) {
      this.logger.warn(
        '[twilio-rest] TWILIO_ACCOUNT_SID/AUTH_TOKEN no configurados — operaciones REST DESACTIVADAS. ' +
        'Handoff PSTN no funcionará; modo callback queda como única opción.',
      );
      this.client = null;
    } else {
      this.client = new Twilio(this.accountSid, authToken);
      this.logger.log(`[twilio-rest] cliente inicializado (SID=${this.accountSid.slice(0, 10)}...)`);
    }
  }

  /** True si el SDK está listo para hacer requests reales. */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Redirige una call activa a un TwiML nuevo. Twilio cierra el verb
   * actual (<Connect><Stream> en nuestro caso) y descarga + ejecuta el
   * TwiML de `twimlUrl`. La PSTN queda activa durante el switch.
   *
   * Use case: handoff PSTN. El bridge llama esto cuando el AI termina
   * de decir "te paso con un agente" → Twilio cierra la WS al voice-call-
   * service y ejecuta <Dial>+operador del TwiML nuevo.
   *
   * Retorna true si Twilio aceptó el update (no garantiza success del
   * dial — solo del comando). false si client no configurado o error.
   */
  async redirectCall(callSid: string, twimlUrl: string): Promise<boolean> {
    if (!this.client) {
      this.logger.warn(`[twilio-rest] redirectCall callSid=${callSid.slice(0, 12)} skipped — client no configurado`);
      return false;
    }

    const t0 = Date.now();
    try {
      await this.client.calls(callSid).update({ url: twimlUrl, method: 'GET' });
      const dt = Date.now() - t0;
      this.logger.log(`[twilio-rest] redirectCall callSid=${callSid.slice(0, 12)} → ${twimlUrl} (${dt}ms)`);
      return true;
    } catch (err) {
      const dt = Date.now() - t0;
      this.logger.error(
        `[twilio-rest] redirectCall fallo callSid=${callSid.slice(0, 12)} after ${dt}ms: ${(err as Error).message}`,
      );
      return false;
    }
  }

  /**
   * Cuelga una call activa. Útil cuando algo sale mal y queremos cortar
   * limpiamente sin esperar al timeout natural. Twilio acepta status:
   *   'completed' = colgar normalmente (cliente escucha tono de fin)
   *   'canceled'  = cortar antes de que la PSTN sea conectada
   */
  async hangupCall(callSid: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.calls(callSid).update({ status: 'completed' });
      this.logger.log(`[twilio-rest] hangupCall callSid=${callSid.slice(0, 12)}`);
      return true;
    } catch (err) {
      this.logger.warn(`[twilio-rest] hangupCall fallo: ${(err as Error).message}`);
      return false;
    }
  }
}
