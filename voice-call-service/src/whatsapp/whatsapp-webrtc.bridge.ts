import { Injectable, Logger } from '@nestjs/common';
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

  constructor(private readonly openai: OpenAIRealtimeAdapter) {}

  /**
   * Establece el peer contra el SDP offer de Meta y devuelve el SDP answer
   * (para graph.accept). Conecta el audio con Uyari. Devuelve null si falla.
   */
  async connect(callId: string, sdpOffer: string, instructions: string): Promise<string | null> {
    if (!this.openai.isConfigured()) {
      this.logger.error(`[wa-webrtc] OpenAI no configurado — callId=${callId.slice(0, 12)}`);
      return null;
    }

    const pc = new RTCPeerConnection({
      codecs: {
        audio: [new RTCRtpCodecParameters({ mimeType: 'audio/opus', clockRate: 48000, channels: 2, payloadType: this.OPUS_PT })],
      },
    });

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

    // Codec Opus (48kHz mono).
    const decoder = new OpusScript(48000, 1, OPUS_APP_VOIP);
    const encoder = new OpusScript(48000, 1, OPUS_APP_VOIP);
    const FRAME = 960; // 20ms @48k

    // ── Entrante: WhatsApp Opus → Uyari ──
    pc.onTrack.subscribe((track) => {
      track.onReceiveRtp.subscribe((rtp: RtpPacket) => {
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
    const ssrc = (Math.floor(Date.now() / 1000) >>> 0) || 1; // estable por llamada
    const FRAME24 = 480 * 2; // 480 samples 16-bit @24k = 20ms
    realtime.on('audio.delta', (chunk: Buffer) => {
      outBuf = Buffer.concat([outBuf, chunk]);
      while (outBuf.length >= FRAME24) {
        const frame24 = outBuf.subarray(0, FRAME24);
        outBuf = outBuf.subarray(FRAME24);
        try {
          const frame48 = upsample24kTo48k(frame24);             // 960 samples @48k
          const opus = encoder.encode(frame48, FRAME) as Buffer; // Opus frame
          const header = new RtpHeader({ payloadType: this.OPUS_PT, sequenceNumber: seq++ & 0xffff, timestamp: ts >>> 0, ssrc, marker: false });
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
      this.logger.log(`[wa-webrtc] answer listo callId=${callId.slice(0, 12)} (${finalSdp.length}B)`);
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
