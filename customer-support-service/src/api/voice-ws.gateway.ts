import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import * as jwt from 'jsonwebtoken';
import WebSocket, { WebSocketServer } from 'ws';
import { VoiceGatewayService, StartVoiceCallOpts } from '../agent/voice-gateway.service';
import { SupportedLang } from '../knowledge-base/system-prompt';

/**
 * WebSocket endpoint para llamadas de voz in-app (mobile + web widget).
 *
 *   Endpoint: GET /voice/ws?token=<JWT>&userId=<id>&lang=es&channel=web
 *   Upgrade: WebSocket
 *
 * Protocolo (full-duplex binario + control JSON):
 *
 *   Client → Server:
 *     - Binary frame    = chunk PCM16 24kHz mono LE del micrófono
 *     - Text frame JSON = comando de control:
 *         {type:'commit'}        — forzar fin de speech (push-to-talk)
 *         {type:'cancel'}        — cortar respuesta del assistant (barge-in manual)
 *         {type:'text', text}    — inyectar mensaje de texto sin audio
 *         {type:'end'}           — cerrar la llamada limpiamente
 *
 *   Server → Client:
 *     - Binary frame    = chunk PCM16 24kHz mono LE del audio del assistant
 *     - Text frame JSON = evento de control:
 *         {type:'ready'}                              — sesión Realtime conectada
 *         {type:'speech_started'}                     — server_vad detectó voz del cliente
 *         {type:'speech_stopped'}                     — server_vad detectó silencio
 *         {type:'transcript', role:'user', text}      — Whisper completó input
 *         {type:'transcript', role:'assistant', text} — transcript del audio del assistant
 *         {type:'tool', name, args}                   — tool ejecutado (info, no requiere acción)
 *         {type:'response_done'}                      — fin del turno del assistant
 *         {type:'audio_done'}                         — fin del audio (puede haber más texto)
 *         {type:'error', code, message}               — error de Realtime
 *
 * Auth: JWT en query param. Por simplicidad — para WebSocket no hay headers
 * customizables desde browser. El JWT_SECRET es el mismo que usa user-auth.
 *
 * Auth opcional: si VOICE_WS_ALLOW_UNAUTH=true (solo dev), acepta sin JWT
 * y usa el userId del query param. NO USAR EN PROD.
 *
 * No corre dentro del adaptador de @nestjs/websockets (que asume socket.io)
 * — nos conectamos directo al HTTP server de NestJS y manejamos el upgrade
 * a mano. Esto nos da control total sobre frames binarios sin overhead.
 */
@Injectable()
export class VoiceWsGateway implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(VoiceWsGateway.name);
  private wsServer: WebSocketServer | null = null;
  private readonly jwtSecret: string;
  private readonly allowUnauth: boolean;
  /** clients indexados por userId — usado para cleanup en shutdown. */
  private readonly clientsByUserId = new Map<string, WebSocket>();

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly voiceGateway: VoiceGatewayService,
    private readonly config: ConfigService,
  ) {
    this.jwtSecret    = this.config.get<string>('JWT_SECRET') || '';
    this.allowUnauth  = this.config.get<string>('VOICE_WS_ALLOW_UNAUTH') === 'true';

    if (!this.jwtSecret && !this.allowUnauth) {
      this.logger.warn('JWT_SECRET no configurado y VOICE_WS_ALLOW_UNAUTH != true — endpoint /voice/ws rechazará todo');
    }
    if (this.allowUnauth) {
      this.logger.warn('[voice-ws] VOICE_WS_ALLOW_UNAUTH=true → modo dev, NO usar en producción');
    }
  }

  onApplicationBootstrap(): void {
    const httpServer = this.httpAdapterHost?.httpAdapter?.getHttpServer();
    if (!httpServer) {
      this.logger.error('[voice-ws] no se pudo obtener httpServer — gateway deshabilitado');
      return;
    }

    // noServer: true → no abre puerto propio, esperamos el upgrade event.
    this.wsServer = new WebSocketServer({ noServer: true });

    httpServer.on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      if (url.pathname !== '/voice/ws') {
        return; // otro upgrade (socket.io etc) — no es nuestro
      }
      this.handleUpgrade(req, socket, head, url);
    });

    this.logger.log('[voice-ws] endpoint /voice/ws listo');
  }

  async onApplicationShutdown(): Promise<void> {
    if (!this.wsServer) return;
    this.logger.log(`[voice-ws] cerrando ${this.clientsByUserId.size} cliente(s) por shutdown`);
    for (const [, ws] of this.clientsByUserId) {
      try { ws.close(1001, 'service shutdown'); } catch { /* ignore */ }
    }
    this.clientsByUserId.clear();
    await new Promise<void>((resolve) => this.wsServer!.close(() => resolve()));
  }

  // ─────────────────────────────────────────────────────────────────
  // Upgrade & auth
  // ─────────────────────────────────────────────────────────────────

  private handleUpgrade(req: IncomingMessage, socket: Socket, head: Buffer, url: URL): void {
    const token   = url.searchParams.get('token')   || '';
    const userId  = url.searchParams.get('userId')  || '';
    const langRaw = url.searchParams.get('lang')    || 'es';
    const channel = (url.searchParams.get('channel') || 'web') as StartVoiceCallOpts['channel'];

    // Validar userId del query param
    if (!userId) {
      this.rejectUpgrade(socket, 400, 'missing userId param');
      return;
    }

    // Validar JWT (a menos que estemos en modo dev)
    let authUserId = userId;
    if (this.allowUnauth) {
      this.logger.debug(`[voice-ws] upgrade sin JWT (dev mode) userId=${userId}`);
    } else {
      if (!token || !this.jwtSecret) {
        this.rejectUpgrade(socket, 401, 'missing token or JWT_SECRET');
        return;
      }
      try {
        const decoded = jwt.verify(token, this.jwtSecret) as { sub?: string; userId?: string };
        authUserId = decoded.userId || decoded.sub || '';
        if (!authUserId) {
          this.rejectUpgrade(socket, 401, 'JWT sin sub/userId');
          return;
        }
        // Refuerzo: el userId del query debe coincidir con el del JWT
        // (evita que un cliente authenticated impersone a otro).
        if (authUserId !== userId) {
          this.rejectUpgrade(socket, 403, `userId mismatch jwt.sub=${authUserId} query=${userId}`);
          return;
        }
      } catch (err) {
        this.rejectUpgrade(socket, 401, `JWT inválido: ${(err as Error).message}`);
        return;
      }
    }

    const lang = this.normalizeLang(langRaw);

    this.wsServer!.handleUpgrade(req, socket, head, (ws) => {
      this.handleConnection(ws, { userId: authUserId, channel, lang });
    });
  }

  private rejectUpgrade(socket: Socket, status: number, reason: string): void {
    const statusText = status === 400 ? 'Bad Request' : status === 401 ? 'Unauthorized' : 'Forbidden';
    this.logger.warn(`[voice-ws] reject ${status} ${reason}`);
    socket.write(`HTTP/1.1 ${status} ${statusText}\r\nContent-Length: 0\r\n\r\n`);
    socket.destroy();
  }

  private normalizeLang(raw: string): SupportedLang {
    const lower = raw.toLowerCase();
    if (lower === 'en' || lower === 'fr' || lower === 'de' || lower === 'qu') return lower;
    return 'es';
  }

  // ─────────────────────────────────────────────────────────────────
  // Connection lifecycle
  // ─────────────────────────────────────────────────────────────────

  private async handleConnection(
    ws: WebSocket,
    opts: { userId: string; channel: StartVoiceCallOpts['channel']; lang: SupportedLang },
  ): Promise<void> {
    const { userId, channel, lang } = opts;

    // Si ya había un cliente WS previo para este userId, ciérralo.
    const existing = this.clientsByUserId.get(userId);
    if (existing) {
      this.logger.warn(`[voice-ws] reemplazando WS previo para ${userId}`);
      try { existing.close(1000, 'replaced by new connection'); } catch { /* ignore */ }
    }
    this.clientsByUserId.set(userId, ws);

    let session;
    try {
      session = await this.voiceGateway.startCall({
        userId,
        channel,
        lang,
        inputTranscriptionLanguage: lang,
      });
    } catch (err) {
      this.logger.error(`[voice-ws] startCall fallo userId=${userId}: ${(err as Error).message}`);
      this.sendControl(ws, { type: 'error', code: 'start_call_failed', message: (err as Error).message });
      try { ws.close(1011, 'start call failed'); } catch { /* ignore */ }
      this.clientsByUserId.delete(userId);
      return;
    }

    // Notificar al cliente que la sesión está lista.
    this.sendControl(ws, { type: 'ready' });

    // ── Wire eventos session → WS frames ─────────────────────────────
    session.on('audio.delta', (chunk: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(chunk, { binary: true });
    });
    session.on('audio.done', () => {
      this.sendControl(ws, { type: 'audio_done' });
    });
    session.on('speech.started', () => this.sendControl(ws, { type: 'speech_started' }));
    session.on('speech.stopped', () => this.sendControl(ws, { type: 'speech_stopped' }));
    session.on('input.transcript.done', (text) =>
      this.sendControl(ws, { type: 'transcript', role: 'user', text }),
    );
    session.on('text.done', (text) =>
      this.sendControl(ws, { type: 'transcript', role: 'assistant', text }),
    );
    session.on('tool.call', ({ name }) =>
      this.sendControl(ws, { type: 'tool', name }),
    );
    session.on('response.done', () => this.sendControl(ws, { type: 'response_done' }));
    session.on('error', (err) =>
      this.sendControl(ws, { type: 'error', code: err.code, message: err.message }),
    );
    session.on('closed', (info) => {
      this.sendControl(ws, {
        type:   'session_closed',
        code:   info.code,
        reason: info.reason,
      });
      try { ws.close(1000, 'session closed'); } catch { /* ignore */ }
    });

    // ── Wire WS → session ────────────────────────────────────────────
    ws.on('message', (data: WebSocket.RawData, isBinary: boolean) => {
      if (isBinary) {
        // Frame binario = chunk PCM16 directo al modelo.
        try {
          const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
          session.sendAudio(buf);
        } catch (err) {
          this.logger.warn(`[voice-ws] error fwd audio: ${(err as Error).message}`);
        }
        return;
      }
      // Frame texto = comando de control JSON.
      this.handleClientControl(ws, session, data.toString());
    });

    ws.on('close', (code: number, reason: Buffer) => {
      this.logger.log(`[voice-ws] cliente cerró userId=${userId} code=${code} reason=${reason.toString()}`);
      this.clientsByUserId.delete(userId);
      // Cierra la sesión Realtime aunque OnModuleDestroy del gateway también
      // la mataría — esto libera la sesión inmediatamente sin esperar shutdown.
      this.voiceGateway.endCall(userId).catch(err =>
        this.logger.warn(`[voice-ws] error en endCall: ${(err as Error).message}`),
      );
    });

    ws.on('error', (err: Error) => {
      this.logger.warn(`[voice-ws] ws error userId=${userId}: ${err.message}`);
    });
  }

  private handleClientControl(ws: WebSocket, session: any, raw: string): void {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      this.sendControl(ws, { type: 'error', code: 'invalid_json', message: 'control frame debe ser JSON válido' });
      return;
    }

    switch (msg?.type) {
      case 'commit':
        // Push-to-talk manual: cierra el buffer y dispara respuesta.
        try {
          session.commitAudio();
          session.createResponse();
        } catch (err) {
          this.sendControl(ws, { type: 'error', code: 'commit_failed', message: (err as Error).message });
        }
        break;

      case 'cancel':
        // Barge-in manual: corta el audio del assistant en curso.
        try { session.cancelResponse(); } catch (err) {
          this.sendControl(ws, { type: 'error', code: 'cancel_failed', message: (err as Error).message });
        }
        break;

      case 'text':
        if (typeof msg.text === 'string' && msg.text.trim().length > 0) {
          try {
            session.sendTextMessage(msg.text);
            session.createResponse();
          } catch (err) {
            this.sendControl(ws, { type: 'error', code: 'text_failed', message: (err as Error).message });
          }
        }
        break;

      case 'end':
        try { ws.close(1000, 'client requested end'); } catch { /* ignore */ }
        break;

      default:
        this.sendControl(ws, { type: 'error', code: 'unknown_command', message: `tipo desconocido: ${msg?.type}` });
        break;
    }
  }

  private sendControl(ws: WebSocket, payload: object): void {
    if (ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify(payload));
    } catch (err) {
      this.logger.warn(`[voice-ws] sendControl error: ${(err as Error).message}`);
    }
  }
}
