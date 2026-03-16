import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * AgoraTokenService — genera tokens RTC para llamadas in-app conductor↔pasajero
 *
 * Instalación: npm install agora-token  (en transport-service)
 *
 * Variables de entorno requeridas:
 *   AGORA_APP_ID          — desde Agora Console → Project Management
 *   AGORA_APP_CERTIFICATE — desde Agora Console → Project Management
 *
 * Cada viaje usa su rideId como nombre de canal — garantiza privacidad total.
 * Los tokens expiran en 2 horas (suficiente para cualquier viaje intercity).
 */

// Roles Agora RTC
const RtcRole = { PUBLISHER: 1, SUBSCRIBER: 2 };

@Injectable()
export class AgoraTokenService {
  private readonly logger = new Logger(AgoraTokenService.name);
  private readonly appId: string;
  private readonly appCertificate: string;
  private readonly enabled: boolean;
  private RtcTokenBuilder: any = null;

  constructor(private readonly config: ConfigService) {
    this.appId          = config.get('AGORA_APP_ID', '');
    this.appCertificate = config.get('AGORA_APP_CERTIFICATE', '');
    this.enabled = !!(this.appId && this.appCertificate);

    if (this.enabled) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { RtcTokenBuilder: Builder } = require('agora-token');
        this.RtcTokenBuilder = Builder;
        this.logger.log('Agora Token Service habilitado ✓');
      } catch {
        this.logger.warn('agora-token no instalado — ejecuta: npm install agora-token');
      }
    } else {
      this.logger.warn('Agora deshabilitado (AGORA_APP_ID / AGORA_APP_CERTIFICATE no configurados)');
    }
  }

  /**
   * Genera un token RTC para que el usuario se una al canal del viaje.
   * @param rideId  — usado como nombre de canal (único por viaje)
   * @param uid     — 0 = Agora asigna UID automáticamente
   * @param role    — 'publisher' para quien inicia la llamada
   */
  generateToken(rideId: string, uid = 0, role: 'publisher' | 'subscriber' = 'publisher'): {
    token: string;
    appId: string;
    channel: string;
    uid: number;
    enabled: boolean;
  } {
    const channel = `going-ride-${rideId}`;

    if (!this.enabled || !this.RtcTokenBuilder) {
      return { token: '', appId: this.appId || '', channel, uid, enabled: false };
    }

    const expirationInSeconds = 7200; // 2 horas
    const currentTimestamp    = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs  = currentTimestamp + expirationInSeconds;
    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = this.RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channel,
      uid,
      rtcRole,
      privilegeExpiredTs,
    );

    this.logger.log(`Token Agora generado para canal ${channel}`);
    return { token, appId: this.appId, channel, uid, enabled: true };
  }
}
