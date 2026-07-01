import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppGraphClient } from './whatsapp-graph.client';
import { WhatsAppWebrtcBridge } from './whatsapp-webrtc.bridge';

/** Prompt del agente multilingüe para llamadas de WhatsApp (Uyari). */
const WA_AGENT_INSTRUCTIONS = [
  'Eres Uyari, el asistente de voz de Going App Ecuador (movilidad: viajes en ciudad,',
  'compartidos/privados entre ciudades, y envíos puerta a puerta).',
  'IDIOMA: detecta el idioma de quien llama y responde SIEMPRE en ESE idioma',
  '(español, inglés, francés, alemán o kichwa). Si habla español, usa acento',
  'ecuatoriano neutro (nunca rioplatense).',
  'Sé cálido, breve (1-3 frases) y resolutivo. Para precios NUNCA inventes; si no',
  'tienes el dato, dilo con honestidad. No menciones URLs (es una llamada de voz).',
].join(' ');

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

  constructor(
    private readonly graph: WhatsAppGraphClient,
    private readonly bridge: WhatsAppWebrtcBridge,
  ) {}

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
    if (!sdpOffer) {
      this.logger.warn(`[wa-call] connect sin SDP offer — callId=${String(callId).slice(0, 12)}`);
      return;
    }

    // ── FASE 2 (media plane): peer werift ↔ Uyari → SDP answer → accept ──
    const answer = await this.bridge.connect(callId, sdpOffer, WA_AGENT_INSTRUCTIONS);
    if (!answer) {
      this.logger.error(`[wa-call] no se pudo armar el peer — terminando callId=${String(callId).slice(0, 12)}`);
      await this.graph.terminate(callId).catch(() => {/* best-effort */});
      this.active.delete(callId);
      return;
    }
    const res = await this.graph.accept(callId, answer);
    if (!res.ok) {
      this.logger.error(`[wa-call] graph.accept falló callId=${String(callId).slice(0, 12)}`);
      await this.bridge.close(callId);
      this.active.delete(callId);
    } else {
      this.logger.log(`[wa-call] llamada ACEPTADA callId=${String(callId).slice(0, 12)} — media activo`);
    }
  }

  private onTerminate(callId: string): void {
    const ctx = this.active.get(callId);
    if (ctx) {
      this.active.delete(callId);
      this.logger.log(`[wa-call] TERMINATE callId=${String(callId).slice(0, 12)} dur=${Math.round((Date.now() - ctx.startedAt) / 1000)}s`);
    }
    this.bridge.close(callId).catch(() => {/* best-effort */});
  }
}
