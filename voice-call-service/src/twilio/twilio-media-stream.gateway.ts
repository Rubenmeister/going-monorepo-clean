import { Injectable, Logger } from '@nestjs/common';

/**
 * TwilioMediaStreamGateway — STUB del WebSocket que recibe el audio bidi.
 *
 * Cuando Twilio responde con <Connect><Stream url="..."/></Connect>, abre un
 * WebSocket a esa URL y empieza a enviar mensajes JSON con base64 payloads
 * de audio (μ-law 8kHz mono típicamente). Twilio Media Streams protocol:
 *
 *   { event: "connected", protocol, version }
 *   { event: "start",     start: { streamSid, callSid, customParameters } }
 *   { event: "media",     media: { payload: base64 } }      ← audio entrante
 *   { event: "stop",      stop: { ... } }
 *
 * Y nosotros respondemos con:
 *   { event: "media", streamSid, media: { payload: base64 } }  ← audio out
 *
 * IMPLEMENTACIÓN PENDIENTE (próxima fase tras este scaffold):
 *
 *  1. Wiring del WS endpoint en main.ts (igual que api-gateway hace para
 *     /voice/ws — usar httpServer.on('upgrade') manual, NestJS @WebSocket
 *     Gateway no maneja bien upgrades raw de Twilio).
 *
 *  2. Bridge bidi a OpenAI Realtime — reusar OpenAIRealtimeAdapter del
 *     customer-support-service (ya implementado en task #37). Diferencias:
 *      - Audio in: μ-law 8kHz de Twilio → convertir a 16kHz PCM
 *        para OpenAI Realtime (gstreamer / ffmpeg WASM / sox).
 *      - Audio out: 24kHz PCM de OpenAI → μ-law 8kHz para Twilio.
 *      - Latencia agregada: ~50-100ms por la conversión (aceptable).
 *
 *  3. Function calling: usar VOICE_TOOLS del customer-support pero adaptado
 *     al contexto telefónico (no hay screen share, todo verbal). Por ejemplo,
 *     get_quote_voice() devuelve el precio EN PALABRAS (no formato $X.YY)
 *     porque el TTS lo lee mejor: "veintidós dólares con cincuenta".
 *
 *  4. Handoff a humano: si el cliente pide "hablar con persona" o el AI
 *     no resuelve, usar <Dial> de TwiML para transferir a un número de
 *     operador on-call. STUB: por ahora solo cerramos con outcome=escalated.
 *
 *  5. Persist transcript al cierre — el OpenAIRealtimeAdapter expone los
 *     transcripts user/assistant; los guardamos en VoiceCallEntity.transcript.
 *
 * Por qué este archivo existe como STUB:
 *  - Documentar la arquitectura del wiring para la próxima fase.
 *  - Asegurar que el módulo compile (otros archivos referencian este).
 */
@Injectable()
export class TwilioMediaStreamGateway {
  private readonly logger = new Logger(TwilioMediaStreamGateway.name);

  /**
   * STUB: el wiring real será un listener WS en main.ts (mismo patrón que
   * el WS proxy del api-gateway en /voice/ws). Aquí solo loggeamos para
   * que el resto del scaffold tenga el dependency intacto.
   */
  attachToHttpServer(httpServer: unknown): void {
    this.logger.warn(
      '[twilio-media-stream] gateway STUB — el wiring WS real está pendiente. ' +
      'Twilio <Connect><Stream> NO recibirá respuesta hasta que se implemente.',
    );
  }
}
