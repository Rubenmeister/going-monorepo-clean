import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';
import WebSocket, { WebSocketServer } from 'ws';
import { VoiceCallService } from '../voice/voice-call.service';
import { mulawToPcm16, pcm16ToMulaw } from './audio-codec';

/**
 * TwilioMediaStreamGateway — WebSocket endpoint que Twilio conecta tras el
 * TwiML <Connect><Stream url="wss://.../twilio/media-stream"/>.
 *
 * Twilio Media Streams protocol (JSON sobre WebSocket):
 *
 *   Server (nosotros) recibe del client (Twilio):
 *     { event: 'connected',  protocol, version }
 *     { event: 'start',      start: { streamSid, callSid, customParameters } }
 *     { event: 'media',      media: { track, chunk, timestamp, payload(base64 μ-law) } }
 *     { event: 'mark',       mark: { name } }                    (cuando devolvemos un mark)
 *     { event: 'stop',       stop: { accountSid, callSid } }
 *
 *   Server envía al client (Twilio):
 *     { event: 'media',  streamSid, media: { payload(base64 μ-law) } }
 *     { event: 'mark',   streamSid, mark: { name } }            (checkpoint, vuelve cuando suena)
 *     { event: 'clear',  streamSid }                             (cortar audio pendiente — barge-in)
 *
 *   Audio formato: μ-law (G.711) 8kHz mono, base64-encoded en cada media event.
 *   Frames: típico ~160 bytes (20ms de audio) cada uno.
 *
 * Doc: https://www.twilio.com/docs/voice/twiml/stream
 *
 * Este gateway implementa el ciclo de vida del stream + lifecycle persistence
 * via VoiceCallService. El bridge audio bidi a OpenAI Realtime queda como
 * TODO del task #51 — por ahora, modo loopback opcional (responder con eco)
 * para validar el wiring end-to-end con Twilio antes de meter el LLM.
 */
@Injectable()
export class TwilioMediaStreamGateway
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(TwilioMediaStreamGateway.name);
  private wsServer: WebSocketServer | null = null;
  private readonly loopbackEnabled: boolean;
  /** Map streamSid → WebSocket activa. Útil para `commands` que necesiten
   *  inyectar audio o cortar la llamada desde fuera. */
  private readonly streamsBySid = new Map<string, WebSocket>();

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly config: ConfigService,
    private readonly voice: VoiceCallService,
  ) {
    // Modo loopback para tests de wiring sin OpenAI. Si está activo,
    // cada chunk de audio del usuario se devuelve tal cual (eco) — verifica
    // que el bridge bidi funciona end-to-end con Twilio.
    this.loopbackEnabled =
      this.config.get<string>('TWILIO_LOOPBACK_ENABLED') === 'true';
    if (this.loopbackEnabled) {
      this.logger.warn(
        '[twilio-stream] TWILIO_LOOPBACK_ENABLED=true → modo eco (sin AI). Solo para dev.',
      );
    }
  }

  onApplicationBootstrap(): void {
    const httpServer = this.httpAdapterHost?.httpAdapter?.getHttpServer();
    if (!httpServer) {
      this.logger.error('[twilio-stream] no se pudo obtener httpServer — gateway deshabilitado');
      return;
    }

    // noServer:true → no abre puerto propio, hookeamos el upgrade event de
    // Nest. Mismo patrón que VoiceWsGateway del customer-support y el WS
    // proxy del api-gateway para /voice/ws.
    this.wsServer = new WebSocketServer({ noServer: true });

    httpServer.on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      // Solo interceptamos /twilio/media-stream. Cualquier otro upgrade lo
      // dejamos pasar al siguiente handler (si Nest registra alguno).
      if (url.pathname !== '/twilio/media-stream') return;

      this.wsServer!.handleUpgrade(req, socket, head, (ws) => {
        this.handleConnection(ws, req);
      });
    });

    this.logger.log('[twilio-stream] endpoint /twilio/media-stream listo');
  }

  onApplicationShutdown(): void {
    if (this.wsServer) {
      this.logger.log(`[twilio-stream] cerrando ${this.streamsBySid.size} stream(s) activas`);
      for (const ws of this.streamsBySid.values()) {
        try { ws.close(1001, 'server-shutdown'); } catch { /* ignore */ }
      }
      this.streamsBySid.clear();
      this.wsServer.close();
    }
  }

  /**
   * Maneja una conexión WebSocket Twilio. Cada conexión = 1 call. Twilio
   * envía secuencia: connected → start → media* → stop.
   *
   * Estructura simple sin retries / reconnect — si la conexión se cae,
   * Twilio del lado del cliente lo trata como hangup. El status-callback
   * de Twilio cierra la call en nuestro lado vía status-callback handler.
   */
  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    // State por-conexión. NO usamos this.* para evitar leaks entre calls.
    let streamSid:  string | null = null;
    let callSid:    string | null = null;
    let runId:      string | null = null;
    let mediaCount = 0;
    const startTime = Date.now();

    this.logger.log(`[twilio-stream] WS opened from ${req.socket.remoteAddress}`);

    ws.on('message', async (raw: WebSocket.RawData) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString('utf8'));
      } catch {
        this.logger.warn('[twilio-stream] non-JSON frame ignored');
        return;
      }

      switch (msg.event) {
        case 'connected':
          this.logger.debug(
            `[twilio-stream] connected — protocol=${msg.protocol} version=${msg.version}`,
          );
          break;

        case 'start': {
          streamSid = msg.start?.streamSid ?? null;
          callSid   = msg.start?.callSid   ?? null;
          // customParameters vienen del TwiML <Parameter> en twiml-builder.
          // Los usamos para correlación con nuestra VoiceCallEntity.
          runId = msg.start?.customParameters?.runId ?? null;
          if (streamSid) this.streamsBySid.set(streamSid, ws);

          this.logger.log(
            `[twilio-stream] start streamSid=${streamSid?.slice(0, 12)} callSid=${callSid?.slice(0, 12)} runId=${runId?.slice(0, 8) ?? 'none'}`,
          );

          // Marcar la call como "answered" — primer audio out se emitirá
          // pronto (ya sea por loopback o por el adapter OpenAI cuando esté).
          if (callSid) {
            await this.voice.onCallAnswered(callSid).catch((err) =>
              this.logger.warn(`[twilio-stream] onCallAnswered fallo: ${(err as Error).message}`),
            );
          }
          break;
        }

        case 'media': {
          mediaCount++;
          const payloadB64 = msg.media?.payload as string | undefined;
          if (!payloadB64 || !streamSid) return;

          // ── MODO LOOPBACK (dev only) ──
          // Echo: devolver el mismo audio al usuario. Útil para verificar que
          // el round-trip Twilio↔gateway funciona ANTES de meter OpenAI.
          // Verifica: encoding correcto, frame size, latencia bidi.
          if (this.loopbackEnabled) {
            const echoFrame = {
              event:     'media',
              streamSid,
              media: { payload: payloadB64 },
            };
            try { ws.send(JSON.stringify(echoFrame)); } catch { /* socket closed */ }
            return;
          }

          // ── MODO REAL (TODO task #51) ──
          // Aquí debe ir el bridge a OpenAI Realtime:
          //   1. const pcm16 = mulawToPcm16(Buffer.from(payloadB64, 'base64'));
          //      (o, si configuramos OpenAI con inputAudioFormat='g711_ulaw',
          //       pasamos directo el buffer μ-law sin decodificar)
          //   2. realtimeSession.sendAudio(buffer)
          //   3. session.on('audio.delta', chunk => { send media event de vuelta })
          //
          // Por ahora silencio: el AI no responde sin el adapter wireado.
          // Los logs van a mostrar "received N media frames" pero el cliente
          // escucha silencio. Esto es OK para validar el wiring por etapas.

          // Log cada 50 frames (1 seg de audio) para no inundar.
          if (mediaCount % 50 === 0) {
            this.logger.debug(
              `[twilio-stream] streamSid=${streamSid?.slice(0, 12)} ${mediaCount} media frames received`,
            );
          }
          break;
        }

        case 'mark':
          // Twilio confirma que el mark anteriormente enviado YA SUENA en
          // el handset del usuario. Útil para sincronizar barge-in.
          this.logger.debug(`[twilio-stream] mark received: ${msg.mark?.name}`);
          break;

        case 'stop':
          this.logger.log(
            `[twilio-stream] stop streamSid=${streamSid?.slice(0, 12)} duration=${Date.now() - startTime}ms frames=${mediaCount}`,
          );
          // Cleanup; el cierre del call vía VoiceCallService lo dispara
          // también el status-callback de Twilio (camino más confiable que
          // este event que puede no llegar si la conexión se cae mal).
          if (streamSid) this.streamsBySid.delete(streamSid);
          try { ws.close(1000, 'twilio-stop'); } catch { /* ignore */ }
          break;

        default:
          this.logger.debug(`[twilio-stream] unhandled event: ${msg.event}`);
      }
    });

    ws.on('close', (code, reason) => {
      this.logger.log(
        `[twilio-stream] WS closed code=${code} reason=${reason.toString() || '-'} streamSid=${streamSid?.slice(0, 12) ?? 'none'} frames=${mediaCount}`,
      );
      if (streamSid) this.streamsBySid.delete(streamSid);
    });

    ws.on('error', (err) => {
      this.logger.error(`[twilio-stream] WS error: ${err.message}`);
    });
  }

  /**
   * Inyecta audio en una llamada activa. Lo usa el OpenAI bridge (task #51)
   * para enviar las respuestas del AI de vuelta a Twilio.
   *
   * @param streamSid stream que Twilio asignó (lo recibimos en el evento 'start')
   * @param mulawPayloadB64 base64 de μ-law 8kHz mono (formato Twilio nativo)
   */
  sendAudioToStream(streamSid: string, mulawPayloadB64: string): boolean {
    const ws = this.streamsBySid.get(streamSid);
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify({
        event:     'media',
        streamSid,
        media: { payload: mulawPayloadB64 },
      }));
      return true;
    } catch (err) {
      this.logger.warn(`[twilio-stream] sendAudio fallido: ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * Limpia el audio que Twilio tiene en buffer (barge-in). Útil cuando el
   * usuario interrumpe al AI — paramos lo que estamos diciendo.
   */
  clearStream(streamSid: string): void {
    const ws = this.streamsBySid.get(streamSid);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify({ event: 'clear', streamSid }));
    } catch { /* ignore */ }
  }
}
