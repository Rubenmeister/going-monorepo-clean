import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RTCPeerConnection,
  RTCRtpCodecParameters,
  MediaStreamTrack,
  RtpPacket,
  RtpHeader,
} from 'werift';
import OpusScript = require('opusscript'); // CJS interop: `import from` daba undefined en runtime
import { OpenAIRealtimeAdapter, RealtimeSession } from '../realtime/openai-realtime.adapter';

// opusscript Application: VOIP=2048 (evita depender de OpusScript.Application).
const OPUS_APP_VOIP = 2048;
import { downsample48kTo24k, upsample24kTo48k } from '../twilio/audio-codec';

/**
 * WhatsAppWebrtcBridge — plano de MEDIA del puente WhatsApp Calling (v1).
 *
 * Une una llamada de voz de WhatsApp (WebRTC vía werift, Opus 48kHz) con
 * Uyari (OpenAI Realtime, PCM16 24kHz, agente multilingüe): quien llama al
 * WhatsApp de Going pregunta en su idioma y Uyari responde.
 *
 * Audio:
 *   entrante  WhatsApp Opus48k → decode → PCM48k → downsample 24k → Realtime
 *   saliente  Realtime PCM24k → upsample 48k → encode Opus → RTP → WhatsApp
 *
 * ⚠️ v1 — la afinación fina (pacing RTP, jitter, eco, params SDP exactos de
 * Meta) se hace iterando contra una llamada REAL (Fase 3). Estructura y API
 * validadas por typecheck; el runtime se prueba con una llamada de verdad.
 *
 * In-process (werift, sin media server) → respeta Cloud-Run-only.
 */
@Injectable()
export class WhatsAppWebrtcBridge {
  private readonly logger = new Logger(WhatsAppWebrtcBridge.name);
  private readonly OPUS_PT = 111;
  private readonly sessions = new Map<string, { pc: RTCPeerConnection; realtime: RealtimeSession }>();

  constructor(
    private readonly openai: OpenAIRealtimeAdapter,
    private readonly config: ConfigService,
  ) {}

  /**
   * ICE servers (STUN + TURN) desde Twilio Network Traversal Service. TURN es
   * imprescindible en Cloud Run: no hay UDP entrante para SRTP, así que el
   * media se relaya vía TURN (Cloud Run solo hace UDP saliente hacia el relay).
   */
  private async getIceServers(): Promise<{ urls: string; username?: string; credential?: string }[]> {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID') || '';
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN') || '';
    const fallback = [{ urls: 'stun:stun.l.google.com:19302' }];
    if (!sid || !token) return fallback;
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Tokens.json`, {
        method: 'POST',
        headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}` },
      });
      const data: any = await res.json();
      const all = (data?.ice_servers ?? []).map((s: any) => ({ urls: (s.url || s.urls) as string, username: s.username, credential: s.credential }));
      // A3: quedarse SOLO con TURN por UDP (los relays TCP/TLS son lentos y
      // agravan el retraso del DTLS). STUN no sirve con iceTransportPolicy=relay.
      const servers = all.filter((s: { urls: string }) => /^turn:/i.test(s.urls) && /transport=udp/i.test(s.urls));
      this.logger.log(`[wa-webrtc] TURN Twilio NTS: ${all.length} totales → ${servers.length} UDP`);
      return servers.length ? servers : all.length ? all : fallback;
    } catch (e) {
      this.logger.warn(`[wa-webrtc] NTS falló, uso STUN: ${(e as Error).message}`);
      return fallback;
    }
  }

  /**
   * Establece el peer contra el SDP offer de Meta y devuelve el SDP answer
   * (para graph.accept). Conecta el audio con Uyari. Devuelve null si falla.
   */
  async connect(callId: string, sdpOffer: string, instructions: string): Promise<string | null> {
    if (!this.openai.isConfigured()) {
      this.logger.error(`[wa-webrtc] OpenAI no configurado — callId=${callId.slice(0, 12)}`);
      return null;
    }

    const iceServers = await this.getIceServers();
    const pc = new RTCPeerConnection({
      codecs: {
        audio: [new RTCRtpCodecParameters({ mimeType: 'audio/opus', clockRate: 48000, channels: 2, payloadType: this.OPUS_PT })],
      },
      iceServers,
      // A2: solo relay (TURN) — Cloud Run no tiene UDP entrante, así que host/
      // srflx no sirven y solo demoran el par ICE→DTLS. A1: iniciamos el DTLS
      // nosotros (client) de inmediato, sin esperar a Meta.
      iceTransportPolicy: 'relay',
      dtlsRole: 'client',
    });

    // Diagnóstico de conectividad (clave para el media en Cloud Run).
    pc.iceConnectionStateChange.subscribe((s) => this.logger.log(`[wa-webrtc] iceConnectionState=${s} callId=${callId.slice(0, 12)}`));
    pc.connectionStateChange.subscribe((s) => this.logger.log(`[wa-webrtc] connectionState=${s} callId=${callId.slice(0, 12)}`));

    // Track de salida (Uyari → WhatsApp).
    const outTrack = new MediaStreamTrack({ kind: 'audio' });
    const transceiver = pc.addTransceiver(outTrack, { direction: 'sendrecv' });

    // Sesión Realtime (Uyari) en PCM16 24kHz, con VAD del servidor.
    const realtime = this.openai.createSession({
      voice: 'shimmer',
      instructions,
      inputAudioFormat: 'pcm16',
      outputAudioFormat: 'pcm16',
      turnDetection: { type: 'server_vad', threshold: 0.6, prefixPaddingMs: 400, silenceDurationMs: 900 },
      modalities: ['audio', 'text'],
      temperature: 0.7,
    });

    // Uyari saluda SOLO cuando el media (DTLS/SRTP) ya está conectado — si lo
    // hace antes, el audio se pierde (el canal aún no transmite). Causa raíz
    // del "no se escucha nada": el saludo salía durante 'connecting'.
    let greeted = false;
    pc.connectionStateChange.subscribe((s) => {
      if (s === 'connected' && !greeted) {
        greeted = true;
        try { realtime.createResponse(); this.logger.log(`[wa-webrtc] saludo (media listo) callId=${callId.slice(0, 12)}`); } catch { /* noop */ }
      }
    });

    // Codec Opus (48kHz mono).
    const decoder = new OpusScript(48000, 1, OPUS_APP_VOIP);
    const encoder = new OpusScript(48000, 1, OPUS_APP_VOIP);
    const FRAME = 960; // 20ms @48k

    // ── Entrante: WhatsApp Opus → Uyari ──
    let rtpIn = 0;
    pc.onTrack.subscribe((track) => {
      this.logger.log(`[wa-webrtc] track entrante recibido callId=${callId.slice(0, 12)} kind=${track.kind}`);
      track.onReceiveRtp.subscribe((rtp: RtpPacket) => {
        if (rtpIn === 0) this.logger.log(`[wa-webrtc] primer RTP entrante callId=${callId.slice(0, 12)}`);
        if (++rtpIn % 250 === 0) this.logger.log(`[wa-webrtc] RTP entrante x${rtpIn}`);
        try {
          const pcm48 = decoder.decode(rtp.payload) as Buffer;      // PCM16 48k mono
          const pcm24 = downsample48kTo24k(pcm48);
          realtime.sendAudio(pcm24);
        } catch (e) {
          this.logger.debug(`[wa-webrtc] decode entrante falló: ${(e as Error).message}`);
        }
      });
    });

    // ── Saliente: Uyari → WhatsApp. Acumula PCM24k y emite frames de 20ms. ──
    let outBuf = Buffer.alloc(0);
    let seq = 0;
    let ts = 0;
    // PT y SSRC de salida: se fijan tras negociar (leídos del SDP answer). El
    // teléfono descarta RTP con PT distinto al negociado, por eso NO se fija fijo.
    let outPt = this.OPUS_PT;
    let outSsrc = (Math.floor(Date.now() / 1000) >>> 0) || 1;
    const FRAME24 = 480 * 2; // 480 samples 16-bit @24k = 20ms
    let deltas = 0;
    realtime.on('audio.delta', (chunk: Buffer) => {
      if (deltas === 0) this.logger.log(`[wa-webrtc] primer audio.delta de Uyari callId=${callId.slice(0, 12)}`);
      deltas++;
      outBuf = Buffer.concat([outBuf, chunk]);
      while (outBuf.length >= FRAME24) {
        const frame24 = outBuf.subarray(0, FRAME24);
        outBuf = outBuf.subarray(FRAME24);
        try {
          const frame48 = upsample24kTo48k(frame24);             // 960 samples @48k
          const opus = encoder.encode(frame48, FRAME) as Buffer; // Opus frame
          const header = new RtpHeader({ payloadType: outPt, sequenceNumber: seq++ & 0xffff, timestamp: ts >>> 0, ssrc: outSsrc, marker: false });
          ts += FRAME;
          outTrack.writeRtp(new RtpPacket(header, opus));
        } catch (e) {
          this.logger.debug(`[wa-webrtc] encode saliente falló: ${(e as Error).message}`);
        }
      }
    });

    try {
      await pc.setRemoteDescription({ type: 'offer', sdp: sdpOffer });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      // Esperar a que ICE termine de reunir candidatos para un SDP completo.
      await this.waitIceComplete(pc);
      await realtime.connect();
      this.sessions.set(callId, { pc, realtime });
      // Cerrar al terminar el peer.
      pc.connectionStateChange.subscribe((st) => {
        if (st === 'closed' || st === 'failed' || st === 'disconnected') this.close(callId);
      });
      const finalSdp = pc.localDescription?.sdp ?? answer.sdp;
      // Fijar PT y SSRC de salida desde el SDP negociado (el teléfono espera esos).
      const ptM = /a=rtpmap:(\d+)\s+opus/i.exec(finalSdp);
      if (ptM) outPt = parseInt(ptM[1], 10);
      const ssM = /a=ssrc:(\d+)/.exec(finalSdp);
      if (ssM) outSsrc = parseInt(ssM[1], 10) >>> 0;
      this.logger.log(`[wa-webrtc] answer listo callId=${callId.slice(0, 12)} (${finalSdp.length}B) outPt=${outPt} outSsrc=${outSsrc}`);
      return finalSdp;
    } catch (e) {
      this.logger.error(`[wa-webrtc] connect falló callId=${callId.slice(0, 12)}: ${(e as Error).message}`);
      try { await pc.close(); } catch { /* noop */ }
      try { realtime.close(); } catch { /* noop */ }
      return null;
    }
  }

  private waitIceComplete(pc: RTCPeerConnection): Promise<void> {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') return resolve();
      const t = setTimeout(resolve, 2500); // no bloquear más de 2.5s (trickle-less)
      pc.iceGatheringStateChange.subscribe((s) => {
        if (s === 'complete') { clearTimeout(t); resolve(); }
      });
    });
  }

  async close(callId: string): Promise<void> {
    const ctx = this.sessions.get(callId);
    if (!ctx) return;
    this.sessions.delete(callId);
    try { ctx.realtime.close(); } catch { /* noop */ }
    try { await ctx.pc.close(); } catch { /* noop */ }
    this.logger.log(`[wa-webrtc] cerrado callId=${callId.slice(0, 12)}`);
  }
}
