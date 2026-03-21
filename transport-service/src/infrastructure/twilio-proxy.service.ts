import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * TwilioProxyService — Number Masking para llamadas conductor ↔ pasajero
 *
 * Flujo:
 * 1. Al asignar conductor a un viaje, se crea una sesión Proxy con dos participantes
 * 2. Cada participante recibe un número proxy temporal (del pool de Going)
 * 3. Llamadas a ese número se enrutan automáticamente al número real del otro
 * 4. Al completar/cancelar el viaje, la sesión se cierra
 *
 * Instalación: npm install twilio  (en transport-service)
 * Variables de entorno requeridas:
 *   TWILIO_ACCOUNT_SID   — AC...
 *   TWILIO_AUTH_TOKEN    — tu auth token
 *   TWILIO_PROXY_SERVICE_SID — KS... (crear en Twilio Console → Proxy)
 */

interface ProxySession {
  sessionSid: string;
  userProxyNumber: string;    // número que ve el pasajero
  driverProxyNumber: string;  // número que ve el conductor
  expiresAt: Date;
}

@Injectable()
export class TwilioProxyService {
  private readonly logger = new Logger(TwilioProxyService.name);
  private client: any = null;
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly proxyServiceSid: string;
  private readonly enabled: boolean;

  // Cache en memoria: rideId → sesión proxy activa
  private sessions = new Map<string, ProxySession>();
  // In-flight promises: evita que dos peticiones concurrentes creen dos sesiones Twilio
  private pending  = new Map<string, Promise<ProxySession | null>>();

  constructor(private readonly config: ConfigService) {
    this.accountSid   = config.get('TWILIO_ACCOUNT_SID', '');
    this.authToken    = config.get('TWILIO_AUTH_TOKEN', '');
    this.proxyServiceSid = config.get('TWILIO_PROXY_SERVICE_SID', '');
    this.enabled = !!(this.accountSid && this.authToken && this.proxyServiceSid);

    if (this.enabled) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const twilio = require('twilio');
        this.client = twilio(this.accountSid, this.authToken);
        this.logger.log('Twilio Proxy habilitado ✓');
      } catch {
        this.logger.warn('twilio no instalado — ejecuta: npm install twilio');
      }
    } else {
      this.logger.warn('Twilio Proxy deshabilitado (variables de entorno no configuradas)');
    }
  }

  /**
   * Crea una sesión proxy entre pasajero y conductor para un viaje.
   * TTL automático: 4 horas (suficiente para cualquier viaje intercity).
   */
  async createSession(params: {
    rideId: string;
    userPhone: string;    // ej: +593987654321
    driverPhone: string;  // ej: +593912345678
  }): Promise<ProxySession | null> {
    // Si ya existe sesión válida, retornarla de inmediato
    const existing = this.sessions.get(params.rideId);
    if (existing && existing.expiresAt > new Date()) return existing;

    // Si ya hay una petición en vuelo para este ride, reutilizarla (evita race condition)
    const inFlight = this.pending.get(params.rideId);
    if (inFlight) return inFlight;

    if (!this.enabled || !this.client) {
      this.logger.warn(`[ride:${params.rideId}] Twilio no disponible — usando números reales como fallback`);
      return null;
    }

    const promise = this._doCreateSession(params);
    this.pending.set(params.rideId, promise);
    try {
      return await promise;
    } finally {
      this.pending.delete(params.rideId);
    }
  }

  private async _doCreateSession(params: {
    rideId: string;
    userPhone: string;
    driverPhone: string;
  }): Promise<ProxySession | null> {
    try {
      const ttl = 4 * 60 * 60; // 4 horas en segundos
      const session = await this.client
        .proxy.v1.services(this.proxyServiceSid)
        .sessions.create({
          uniqueName: `ride-${params.rideId}`,
          ttl,
        });

      // Agregar participantes
      const [userPart, driverPart] = await Promise.all([
        this.client.proxy.v1.services(this.proxyServiceSid)
          .sessions(session.sid)
          .participants.create({ identifier: params.userPhone }),
        this.client.proxy.v1.services(this.proxyServiceSid)
          .sessions(session.sid)
          .participants.create({ identifier: params.driverPhone }),
      ]);

      const result: ProxySession = {
        sessionSid:        session.sid,
        userProxyNumber:   userPart.proxyIdentifier,
        driverProxyNumber: driverPart.proxyIdentifier,
        expiresAt:         new Date(Date.now() + ttl * 1000),
      };

      this.sessions.set(params.rideId, result);
      this.logger.log(`Proxy session creada: ${session.sid} para ride ${params.rideId}`);
      return result;
    } catch (err: any) {
      this.logger.error(`Error creando proxy session: ${err.message}`);
      return null;
    }
  }

  /**
   * Obtiene los números proxy de una sesión existente.
   * Si no existe o expiró, retorna null.
   */
  getSession(rideId: string): ProxySession | null {
    const s = this.sessions.get(rideId);
    if (!s || s.expiresAt <= new Date()) {
      this.sessions.delete(rideId);
      return null;
    }
    return s;
  }

  /**
   * Cierra la sesión proxy cuando el viaje termina o se cancela.
   */
  async closeSession(rideId: string): Promise<void> {
    const session = this.sessions.get(rideId);
    if (!session) return;

    if (this.client) {
      try {
        await this.client.proxy.v1
          .services(this.proxyServiceSid)
          .sessions(session.sessionSid)
          .remove();
        this.logger.log(`Proxy session cerrada: ${session.sessionSid}`);
      } catch (err: any) {
        this.logger.warn(`Error cerrando proxy session: ${err.message}`);
      }
    }
    this.sessions.delete(rideId);
  }
}
