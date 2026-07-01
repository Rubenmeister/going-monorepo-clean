/**
 * Codec μ-law (G.711) ↔ PCM16 + sample rate conversion.
 *
 * Twilio Media Streams entrega audio en μ-law 8kHz mono base64. OpenAI
 * Realtime espera PCM16 24kHz mono LE (little-endian). Necesitamos
 * conversión bidireccional in-process — sin ffmpeg/sox dep externa.
 *
 * Por qué puro JS:
 *  - Voice notes son cortas (<60s típicas) y la conversión es liviana
 *    (~50ms por segundo de audio en Node).
 *  - Cloud Run sin ffmpeg en la base image evita complicación de Docker.
 *  - Testeable como función pura — facilita unit tests sin mocks.
 *
 * Algoritmos:
 *  - μ-law ↔ linear: ITU-T G.711 standard (lookup tables).
 *  - Upsample 8k→24k: insertar 2 samples interpolados linealmente entre
 *    cada par. Calidad aceptable para voz (no high-fidelity, pero ese
 *    es el límite de Twilio igual).
 *  - Downsample 24k→8k: low-pass filter simple (promedio de 3 samples)
 *    + decimación 3:1. Evita aliasing audible.
 *
 * NO usa Buffer.allocUnsafe — los buffers se pasan al stream WS y queremos
 * predictabilidad (sin reads de memoria no inicializada).
 */

// ─── μ-law decode table (256 entries, índice = byte μ-law, valor = PCM16) ─
// Standard G.711 μ-law: bias=0x84, máx |x|=8159.
const MULAW_DECODE_TABLE: Int16Array = (() => {
  const table = new Int16Array(256);
  for (let i = 0; i < 256; i++) {
    const muLaw = ~i & 0xFF;
    const sign = (muLaw & 0x80) ? -1 : 1;
    const exponent = (muLaw >> 4) & 0x07;
    const mantissa = muLaw & 0x0F;
    const magnitude = ((mantissa << 3) + 0x84) << exponent;
    table[i] = sign * (magnitude - 0x84);
  }
  return table;
})();

/**
 * Decodifica buffer μ-law 8-bit a PCM16 little-endian.
 * Length out = length in × 2 (bytes).
 */
export function mulawToPcm16(mulawBuf: Buffer): Buffer {
  const pcm = Buffer.alloc(mulawBuf.length * 2);
  for (let i = 0; i < mulawBuf.length; i++) {
    pcm.writeInt16LE(MULAW_DECODE_TABLE[mulawBuf[i]], i * 2);
  }
  return pcm;
}

/**
 * Codifica PCM16 LE a μ-law 8-bit.
 * Implementación directa (sin lookup table) — más compacta y suficientemente
 * rápida para los volúmenes de Voice (8000 muestras/seg/canal).
 */
export function pcm16ToMulaw(pcmBuf: Buffer): Buffer {
  const BIAS = 0x84;
  const CLIP = 32635;
  const out = Buffer.alloc(pcmBuf.length / 2);
  for (let i = 0; i < pcmBuf.length / 2; i++) {
    let sample = pcmBuf.readInt16LE(i * 2);
    const sign = sample < 0 ? 0x80 : 0;
    if (sample < 0) sample = -sample;
    if (sample > CLIP) sample = CLIP;
    sample += BIAS;
    let exponent = 7;
    for (let mask = 0x4000; (sample & mask) === 0 && exponent > 0; mask >>= 1) {
      exponent--;
    }
    const mantissa = (sample >> (exponent + 3)) & 0x0F;
    out[i] = ~(sign | (exponent << 4) | mantissa) & 0xFF;
  }
  return out;
}

/**
 * Upsample PCM16 de 8kHz a 24kHz con interpolación lineal 1:3.
 * Por cada sample input, escribe 3 samples output (el original + 2
 * interpolados con el siguiente). Calidad: voz inteligible, no high-fi.
 *
 * Nota: la última muestra se duplica 3 veces (no hay "siguiente" para
 * interpolar). Edge effect inaudible en streams continuos.
 */
export function upsample8kTo24k(pcm8k: Buffer): Buffer {
  const samplesIn = pcm8k.length / 2;
  const samplesOut = samplesIn * 3;
  const out = Buffer.alloc(samplesOut * 2);
  for (let i = 0; i < samplesIn; i++) {
    const cur = pcm8k.readInt16LE(i * 2);
    const next = i + 1 < samplesIn ? pcm8k.readInt16LE((i + 1) * 2) : cur;
    out.writeInt16LE(cur, (i * 3) * 2);
    out.writeInt16LE(Math.round(cur + (next - cur) / 3), (i * 3 + 1) * 2);
    out.writeInt16LE(Math.round(cur + 2 * (next - cur) / 3), (i * 3 + 2) * 2);
  }
  return out;
}

/**
 * Downsample PCM16 de 24kHz a 8kHz con promedio de 3 samples + decimación.
 * El promedio funciona como low-pass filter trivial (cutoff ~4kHz, suficiente
 * para evitar aliasing audible en voz humana — la banda telefónica es 300-3400Hz).
 *
 * length samples in / 3 = length samples out. Si in no es múltiplo de 3,
 * los samples sobrantes (1-2) se descartan.
 */
export function downsample24kTo8k(pcm24k: Buffer): Buffer {
  const samplesIn = pcm24k.length / 2;
  const samplesOut = Math.floor(samplesIn / 3);
  const out = Buffer.alloc(samplesOut * 2);
  for (let i = 0; i < samplesOut; i++) {
    const s1 = pcm24k.readInt16LE((i * 3) * 2);
    const s2 = pcm24k.readInt16LE((i * 3 + 1) * 2);
    const s3 = pcm24k.readInt16LE((i * 3 + 2) * 2);
    out.writeInt16LE(Math.round((s1 + s2 + s3) / 3), i * 2);
  }
  return out;
}

/**
 * Upsample PCM16 de 8kHz a 16kHz con interpolación lineal 1:2.
 * Gemini Live API espera audio de ENTRADA en PCM16 16kHz mono. Por cada sample
 * input escribe 2 output (el original + 1 interpolado con el siguiente).
 */
export function upsample8kTo16k(pcm8k: Buffer): Buffer {
  const samplesIn = pcm8k.length / 2;
  const out = Buffer.alloc(samplesIn * 2 * 2);
  for (let i = 0; i < samplesIn; i++) {
    const cur = pcm8k.readInt16LE(i * 2);
    const next = i + 1 < samplesIn ? pcm8k.readInt16LE((i + 1) * 2) : cur;
    out.writeInt16LE(cur, (i * 2) * 2);
    out.writeInt16LE(Math.round((cur + next) / 2), (i * 2 + 1) * 2);
  }
  return out;
}

/**
 * Downsample PCM16 48kHz → 24kHz (promedio 2:1). WhatsApp/Opus entrega 48kHz;
 * OpenAI Realtime espera 24kHz.
 */
export function downsample48kTo24k(pcm48k: Buffer): Buffer {
  const n = Math.floor(pcm48k.length / 2 / 2);
  const out = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const a = pcm48k.readInt16LE(i * 4);
    const b = pcm48k.readInt16LE(i * 4 + 2);
    out.writeInt16LE(Math.round((a + b) / 2), i * 2);
  }
  return out;
}

/** Upsample PCM16 24kHz → 48kHz (interpolación lineal 1:2). */
export function upsample24kTo48k(pcm24k: Buffer): Buffer {
  const n = pcm24k.length / 2;
  const out = Buffer.alloc(n * 2 * 2);
  for (let i = 0; i < n; i++) {
    const cur = pcm24k.readInt16LE(i * 2);
    const next = i + 1 < n ? pcm24k.readInt16LE((i + 1) * 2) : cur;
    out.writeInt16LE(cur, (i * 2) * 2);
    out.writeInt16LE(Math.round((cur + next) / 2), (i * 2 + 1) * 2);
  }
  return out;
}

// ─── Conversión completa (Twilio ↔ OpenAI) ─────────────────────

/**
 * Twilio frame (base64 μ-law 8kHz) → PCM16 24kHz buffer listo para OpenAI Realtime.
 */
export function twilioFrameToOpenAi(base64Payload: string): Buffer {
  const mulawBuf = Buffer.from(base64Payload, 'base64');
  const pcm8k = mulawToPcm16(mulawBuf);
  return upsample8kTo24k(pcm8k);
}

/**
 * PCM16 24kHz buffer de OpenAI → base64 μ-law 8kHz listo para Twilio frame.
 */
export function openAiPcmToTwilioFrame(pcm24k: Buffer): string {
  const pcm8k = downsample24kTo8k(pcm24k);
  const mulaw = pcm16ToMulaw(pcm8k);
  return mulaw.toString('base64');
}

// ─── Conversión completa (Twilio ↔ Gemini Live) ────────────────
// Gemini Live: ENTRADA PCM16 16kHz, SALIDA PCM16 24kHz.

/**
 * Twilio frame (base64 μ-law 8kHz) → PCM16 16kHz buffer para Gemini Live (input).
 */
export function twilioFrameToGemini(base64Payload: string): Buffer {
  const pcm8k = mulawToPcm16(Buffer.from(base64Payload, 'base64'));
  return upsample8kTo16k(pcm8k);
}

/**
 * PCM16 24kHz de Gemini Live → base64 μ-law 8kHz para Twilio frame (output).
 * (La salida de Gemini es 24kHz, igual que OpenAI → reutiliza el mismo camino.)
 */
export function geminiPcmToTwilioFrame(pcm24k: Buffer): string {
  return openAiPcmToTwilioFrame(pcm24k);
}
