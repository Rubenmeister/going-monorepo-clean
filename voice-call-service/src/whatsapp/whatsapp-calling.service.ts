import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppGraphClient } from './whatsapp-graph.client';

/**
 * WhatsAppCallingService — orquesta las llamadas de voz de WhatsApp (Calling API).
 *
 * FASE 1 (control plane, actual): recibe los eventos reenviados por
 * customer-support (connect/terminate), extrae call_id + SDP offer, y deja el
 * hook listo para el plano de media.
 *
 * FASE 2 (media plane, siguiente): en onConnect se crea un peer WebRTC con
 * `werift` (ICE/DTLS/SRTP, Opus), se genera el SDP answer, se llama a
 * graph.accept(callId, answer), y se puentea el audio (Opus↔PCM) al motor:
 *   - Agente multilingüe → Uyari (OpenAI Realtime), o
 *   - Intérprete → Gemini Live.
 *
 * Mientras Calling esté NOT_SET en el número, no entran llamadas reales — este
 * servicio queda inerte y es seguro desplegarlo.
 */
@Injectable()
export class WhatsAppCallingService {
  private readonly logger = new Logger(WhatsAppCallingService.name);
  /** Llamadas activas por call_id (Fase 2 guardará aquí el peer + sesión). */
  private readonly active = new Map<string, { from?: string; startedAt: number }>();

  constructor(private readonly graph: WhatsAppGraphClient) {}

  /** Procesa el `value` del webhook de WhatsApp (con calls[]). */
  async handleEvent(value: any): Promise<void> {
    const calls: any[] = value?.calls ?? [];
    for (const call of calls) {
      const callId = call?.id ?? call?.call_id;
      const kind = call?.event ?? call?.status; // 'connect' | 'terminate' | ...
      if (!callId) continue;

      if (kind === 'connect' || call?.session?.sdp) {
        await this.onConnect(callId, call?.session?.sdp, call?.from);
      } else if (kind === 'terminate' || kind === 'terminated' || kind === 'COMPLETED') {
        this.onTerminate(callId);
      } else {
        this.logger.debug(`[wa-call] evento no manejado kind=${kind} callId=${String(callId).slice(0, 12)}`);
      }
    }
  }

  private async onConnect(callId: string, sdpOffer: string | undefined, from?: string): Promise<void> {
    this.logger.log(`[wa-call] CONNECT callId=${String(callId).slice(0, 12)} from=${from ?? '?'} sdpOffer=${sdpOffer ? sdpOffer.length + 'B' : 'none'}`);
    this.active.set(callId, { from, startedAt: Date.now() });

    if (!this.graph.isConfigured()) {
      this.logger.warn('[wa-call] Graph no configurado — no puedo aceptar la llamada');
      return;
    }

    // ── FASE 2 (media plane) — pendiente ──
    // const peer = createWeriftPeer();
    // const answer = await peer.setRemoteOffer(sdpOffer) & createAnswer();
    // await this.graph.accept(callId, answer);
    // bridge peer.audioTrack (Opus) ↔ motor (Uyari/Gemini) vía codec.
    this.logger.warn(`[wa-call] plano de media (werift) pendiente (Fase 2) — callId=${String(callId).slice(0, 12)} no aceptado aún`);
  }

  private onTerminate(callId: string): void {
    const ctx = this.active.get(callId);
    if (ctx) {
      this.active.delete(callId);
      this.logger.log(`[wa-call] TERMINATE callId=${String(callId).slice(0, 12)} dur=${Math.round((Date.now() - ctx.startedAt) / 1000)}s`);
    }
    // Fase 2: cerrar el peer werift + la sesión del motor.
  }
}
