import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppGraphClient } from './whatsapp-graph.client';
import { WhatsAppWebrtcBridge } from './whatsapp-webrtc.bridge';

/** Prompt del agente multilingüe para llamadas de WhatsApp (Uyari). */
const WA_AGENT_INSTRUCTIONS = [
  'SALUDA TÚ PRIMERO, con calidez y sin esperar a que la persona hable. Abre la llamada diciendo EXACTAMENTE algo muy cercano a esto: "¡Hola! Te damos la bienvenida a Going App, la primera y más grande aplicación de viajes compartidos del Ecuador. Soy Uyari, tu asistente. ¿En qué te puedo ayudar hoy?"',
  'Eres Uyari, el asistente de voz de Going App Ecuador (movilidad: viajes en ciudad, compartidos/privados entre ciudades, y envíos puerta a puerta).',
  '',
  'ACENTO Y ENTONACIÓN EN ESPAÑOL — CRÍTICO (regla de máxima prioridad):',
  '- Habla SIEMPRE en español ECUATORIANO de la Sierra (Quito, Ambato, Cuenca). Entonación pareja y calmada, SIN alargar vocales ni cantar al final.',
  '- PROHIBIDO el acento rioplatense (Argentina/Uruguay): NO uses "vos", "che", "dale", ni la entonación cantada con énfasis al final. En Ecuador eso NO existe.',
  '- Usa SIEMPRE "tú" (nunca "vos"). Conjuga en "tú": tienes, puedes, quieres, sabes, dices (NUNCA tenés, podés, querés, sabés, decís).',
  '- Imperativos estándar de "tú": dime, cuéntame, envía, revisa, espera, mira, carga (NUNCA decime, contame, enviá, revisá, esperá, mirá, cargá).',
  '- Tras preposición di "para ti" (no "para vos"). Vocabulario neutro andino: "carro" (no "coche" ni "auto").',
  '- Lenguaje inclusivo: "conductora o conductor", "viajeras y viajeros".',
  '',
  'IDIOMA: detecta el idioma de quien llama y responde SIEMPRE en ESE idioma (español, inglés, francés, alemán o kichwa). Si cambia de idioma a mitad, cámbiate tú también. Las reglas de acento español aplican solo cuando la persona habla español.',
  'PRECIOS: cuando la persona pregunte cuánto cuesta una ruta, usa SIEMPRE la herramienta get_quote_phone con origen, destino y modalidad (compartido/privado). Di el precio que devuelve la herramienta; NUNCA inventes un precio. Si la ruta no está cubierta, dilo con honestidad.',
  'RENTA POR TIEMPO: si piden alquilar/rentar un vehículo por horas o días, un tour o "todo el día", usa get_rental_quote (modo local por horas, o por_dias a otra ciudad). Di el total; incluye chofer. No inventes.',
  'ENVÍOS: si preguntan cuánto cuesta enviar/mandar un paquete o encomienda, usa get_shipping_quote (tamaño o peso). Precio plano por tamaño, igual para cualquier ruta. No inventes.',
  'CONOCIMIENTO: para turismo/historia/geografía de una ciudad, cómo inscribirse o descargar la app, políticas (cancelación/reembolsos) o preguntas frecuentes, usa la herramienta consultar_conocimiento. Como es una llamada, resume en 1-3 frases lo esencial. No inventes.',
  'Sé cálido, breve (1-3 frases) y resolutivo. No menciones URLs (es una llamada de voz).',
  'TONO DE VOZ: habla con calidez y naturalidad, con ritmo pausado y humano (no robótico ni apurado). Suena como una persona ecuatoriana real y amable que de verdad quiere ayudar.',
].join('\n');

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
