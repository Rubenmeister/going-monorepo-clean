import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * WhatsAppGraphClient — llamadas a la Graph API para la WhatsApp Business
 * Calling API (aceptar/terminar llamadas, encender Calling).
 *
 * Flujo de una llamada entrante:
 *   1. Meta → webhook (customer-support) → reenvía a voice-call-service el
 *      evento 'connect' con call_id + SDP offer.
 *   2. Generamos el SDP answer (werift, Fase 2) y llamamos accept(callId, sdp).
 *   3. Media WebRTC (Opus/SRTP) fluye entre Meta y nuestro peer.
 *   4. terminate(callId) al cerrar.
 *
 * Requiere env: META_WA_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID.
 */
@Injectable()
export class WhatsAppGraphClient {
  private readonly logger = new Logger(WhatsAppGraphClient.name);
  private readonly token: string;
  private readonly phoneId: string;
  private readonly version = 'v23.0';

  constructor(config: ConfigService) {
    this.token = config.get<string>('META_WA_ACCESS_TOKEN') || '';
    this.phoneId = config.get<string>('WHATSAPP_PHONE_NUMBER_ID') || '';
    if (!this.token || !this.phoneId) {
      this.logger.warn('[wa-graph] META_WA_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID faltan — Calling deshabilitado');
    }
  }

  isConfigured(): boolean {
    return !!(this.token && this.phoneId);
  }

  private async post(body: Record<string, unknown>): Promise<{ ok: boolean; data: any }> {
    const url = `https://graph.facebook.com/${this.version}/${this.phoneId}/calls`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) this.logger.warn(`[wa-graph] ${JSON.stringify(body).slice(0, 60)} → HTTP ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
      return { ok: res.ok, data };
    } catch (e) {
      this.logger.error(`[wa-graph] request falló: ${(e as Error).message}`);
      return { ok: false, data: null };
    }
  }

  /** Pre-acepta (ringing) para empezar a negociar media antes de "contestar". */
  preAccept(callId: string, sdpAnswer: string): Promise<{ ok: boolean; data: any }> {
    return this.post({ call_id: callId, action: 'pre_accept', session: { sdp_type: 'answer', sdp: sdpAnswer } });
  }

  /** Acepta la llamada con el SDP answer → abre el canal de media. */
  accept(callId: string, sdpAnswer: string): Promise<{ ok: boolean; data: any }> {
    return this.post({ call_id: callId, action: 'accept', session: { sdp_type: 'answer', sdp: sdpAnswer } });
  }

  /** Termina una llamada activa. */
  terminate(callId: string): Promise<{ ok: boolean; data: any }> {
    return this.post({ call_id: callId, action: 'terminate' });
  }

  /** Enciende Calling en el número (status ENABLED). Usar cuando el puente esté listo. */
  async enableCalling(): Promise<{ ok: boolean; data: any }> {
    const url = `https://graph.facebook.com/${this.version}/${this.phoneId}/settings`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ calling: { status: 'ENABLED' } }),
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data };
    } catch (e) {
      return { ok: false, data: (e as Error).message };
    }
  }
}
