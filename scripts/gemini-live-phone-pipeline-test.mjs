/**
 * Test del PIPELINE TELEFÓNICO del intérprete: ¿Gemini Live entiende audio
 * degradado a calidad-teléfono (μ-law 8kHz de Twilio)?
 *
 * Cadena: WAV ES 24kHz → (simula Twilio) downsample 8k + μ-law enc/dec →
 *         upsample 16k → Gemini Live (es→en) → PCM24k → (simula salida Twilio)
 *         downsample 8k + μ-law enc/dec → WAV para escuchar.
 *
 * Replica la matemática de voice-call-service/src/twilio/audio-codec.ts.
 * Uso: node scripts/gemini-live-phone-pipeline-test.mjs
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'out');
const IN = join(OUT, 'gemini-voz-es.wav');
const MODEL = 'models/gemini-3.5-live-translate-preview';

const key = process.env.GEMINI_API_KEY?.trim() ||
  execSync('gcloud secrets versions access latest --secret=GEMINI_API_KEY --project=going-5d1ae', { encoding: 'utf8' }).trim();

// ── μ-law (G.711) ──
const DEC = new Int16Array(256);
for (let i = 0; i < 256; i++) { const m = ~i & 0xFF, s = (m & 0x80) ? -1 : 1, e = (m >> 4) & 7, ma = m & 0x0F; DEC[i] = s * ((((ma << 3) + 0x84) << e) - 0x84); }
const mulawDec = (buf) => { const o = Buffer.alloc(buf.length * 2); for (let i = 0; i < buf.length; i++) o.writeInt16LE(DEC[buf[i]], i * 2); return o; };
function mulawEnc(pcm) { const B = 0x84, C = 32635, o = Buffer.alloc(pcm.length / 2); for (let i = 0; i < pcm.length / 2; i++) { let s = pcm.readInt16LE(i * 2); const sg = s < 0 ? 0x80 : 0; if (s < 0) s = -s; if (s > C) s = C; s += B; let e = 7; for (let mk = 0x4000; (s & mk) === 0 && e > 0; mk >>= 1) e--; const ma = (s >> (e + 3)) & 0x0F; o[i] = ~(sg | (e << 4) | ma) & 0xFF; } return o; }
// ── resamplers ──
function resample(pcm, rIn, rOut) { const n = pcm.length / 2, ratio = rIn / rOut, m = Math.floor(n / ratio), o = Buffer.alloc(m * 2); for (let i = 0; i < m; i++) { const x = i * ratio, i0 = Math.floor(x), f = x - i0; const a = i0 < n ? pcm.readInt16LE(i0 * 2) : 0, b = i0 + 1 < n ? pcm.readInt16LE((i0 + 1) * 2) : a; o.writeInt16LE((a + (b - a) * f) | 0, i * 2); } return o; }
function readWav(p) { const b = readFileSync(p); const rate = b.readUInt32LE(24); let off = 12; while (off + 8 <= b.length) { const id = b.toString('ascii', off, off + 4), sz = b.readUInt32LE(off + 4); if (id === 'data') return { pcm: b.subarray(off + 8, off + 8 + sz), rate }; off += 8 + sz; } throw new Error('no data'); }
function wav(pcm, rate) { const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]); }

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { pcm, rate } = readWav(IN);
  // Simula Twilio de ENTRADA: 24k → 8k → μ-law → (banda telefónica) → PCM8k → 16k
  const pcm8k = resample(pcm, rate, 8000);
  const telephony8k = mulawDec(mulawEnc(pcm8k));      // pierde calidad como el teléfono real
  const pcm16k = resample(telephony8k, 8000, 16000);  // lo que enviaríamos a Gemini
  console.log(`Entrada degradada a teléfono: ${(pcm.length / 2 / rate).toFixed(1)}s, μ-law 8kHz → 16kHz (${pcm16k.length} bytes)`);

  const ws = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${key}`);
  const t0 = Date.now(); let sentAt = 0, ttfb = null, saved = false; const outChunks = [];
  const save = () => { if (saved) return; saved = true; const out24 = Buffer.concat(outChunks); if (out24.length) { const tw = mulawDec(mulawEnc(resample(out24, 24000, 8000))); writeFileSync(join(OUT, 'gemini-live-phone-en.wav'), wav(tw, 8000)); console.log(`✅ salida (calidad teléfono) → scripts/out/gemini-live-phone-en.wav | TTFB ${ttfb}ms`); } else console.log('sin audio'); try { ws.close(); } catch {} };

  ws.onopen = () => ws.send(JSON.stringify({ setup: { model: MODEL, generationConfig: { responseModalities: ['AUDIO'] }, systemInstruction: { parts: [{ text: 'You are a real-time interpreter. The speaker talks in Spanish. Interpret faithfully into natural spoken English.' }] } } }));
  ws.onmessage = async (ev) => {
    let raw = ev.data;
    if (raw instanceof Blob) raw = Buffer.from(await raw.arrayBuffer());
    const txt = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
    let m; try { m = JSON.parse(txt); } catch { return; }
    if (m.setupComplete) { ws.send(JSON.stringify({ realtimeInput: { audio: { data: pcm16k.toString('base64'), mimeType: 'audio/pcm;rate=16000' } } })); ws.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } })); sentAt = Date.now(); return; }
    for (const p of (m.serverContent?.modelTurn?.parts || [])) if (p.inlineData?.data) { if (ttfb === null) { ttfb = Date.now() - sentAt; console.log(`⏱️ TTFB ${ttfb}ms`); } outChunks.push(Buffer.from(p.inlineData.data, 'base64')); }
    if (m.serverContent?.inputTranscription?.text) console.log('  escuchó:', m.serverContent.inputTranscription.text);
    if (m.serverContent?.outputTranscription?.text) console.log('  tradujo:', m.serverContent.outputTranscription.text);
    if (m.serverContent?.generationComplete || m.serverContent?.turnComplete) setTimeout(save, 600);
    if (m.error) { console.error('error:', JSON.stringify(m.error).slice(0, 160)); ws.close(); }
  };
  ws.onerror = (e) => console.error('WS error', e?.message || e);
  ws.onclose = () => { if (!saved) save(); };
  setTimeout(save, 25000);
}
main().catch((e) => { console.error(e); process.exit(1); });
