/**
 * Prototipo Gemini LIVE TRANSLATE — voz↔voz en tiempo real (Live API, WebSocket).
 *
 * Es un INTÉRPRETE: recibe AUDIO en un idioma y devuelve AUDIO en otro.
 * Este script le envía una muestra de voz en español (scripts/out/gemini-voz-es.wav,
 * resampleada a 16 kHz) y guarda la traducción hablada en inglés, midiendo el
 * tiempo hasta el primer audio (TTFB).
 *
 * Uso:
 *   node scripts/gemini-live-translate-proto.mjs [archivo-wav-entrada]
 *   (la key se lee de gcloud: secret GEMINI_API_KEY)
 */
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, 'out');
const MODEL = process.env.LIVE_MODEL || 'models/gemini-3.5-live-translate-preview';
const TARGET = 'English';
const INPUT_WAV = process.argv[2] || join(OUT_DIR, 'gemini-voz-es.wav');

function apiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  return execSync('gcloud secrets versions access latest --secret=GEMINI_API_KEY --project=going-5d1ae', { encoding: 'utf8' }).trim();
}

/** Lee un WAV PCM16 mono → { pcm: Int16Array, rate }. Busca el chunk 'data'. */
function readWav(path) {
  const buf = readFileSync(path);
  const rate = buf.readUInt32LE(24);
  let off = 12;
  while (off + 8 <= buf.length) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'data') {
      const pcm = new Int16Array(size / 2);
      for (let i = 0; i < pcm.length; i++) pcm[i] = buf.readInt16LE(off + 8 + i * 2);
      return { pcm, rate };
    }
    off += 8 + size;
  }
  throw new Error('WAV sin chunk data');
}

/** Resample lineal Int16 a otra frecuencia. */
function resample(pcm, srIn, srOut) {
  if (srIn === srOut) return pcm;
  const ratio = srIn / srOut;
  const out = new Int16Array(Math.floor(pcm.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const x = i * ratio;
    const i0 = Math.floor(x), frac = x - i0;
    const a = pcm[i0] || 0, b = pcm[i0 + 1] || a;
    out[i] = (a + (b - a) * frac) | 0;
  }
  return out;
}

function int16ToB64(int16) {
  return Buffer.from(int16.buffer, int16.byteOffset, int16.byteLength).toString('base64');
}

function pcmToWav(pcm, sampleRate) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sampleRate, 24); h.writeUInt32LE(sampleRate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  if (!existsSync(INPUT_WAV)) { console.error(`No existe el WAV de entrada: ${INPUT_WAV}\nGenera primero con: node scripts/gemini-voice-proto.mjs`); process.exit(1); }

  const { pcm, rate } = readWav(INPUT_WAV);
  const pcm16k = resample(pcm, rate, 16000);
  console.log(`Entrada: ${INPUT_WAV} (${rate}Hz, ${(pcm.length / rate).toFixed(1)}s) → 16kHz`);

  const ws = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey()}`);
  const t0 = Date.now();
  let sentAt = 0, firstAudioMs = null, outRate = 24000, saved = false;
  const chunks = [];

  const saveAndClose = () => {
    if (saved) return;
    saved = true;
    const out = Buffer.concat(chunks);
    if (out.length) {
      const file = join(OUT_DIR, 'gemini-live-translate-en.wav');
      writeFileSync(file, pcmToWav(out, outRate));
      console.log(`✅ audio traducido ${out.length} bytes @${outRate}Hz → ${file} (TTFB ${firstAudioMs}ms)`);
    } else console.log('Sin audio recibido.');
    try { ws.close(); } catch { /* noop */ }
  };

  ws.onopen = () => ws.send(JSON.stringify({
    setup: {
      model: MODEL,
      generationConfig: { responseModalities: ['AUDIO'] },
      systemInstruction: { parts: [{ text: `You are a real-time interpreter. The user speaks Spanish. Interpret everything into spoken ${TARGET}.` }] },
    },
  }));

  ws.onmessage = async (ev) => {
    let raw = ev.data;
    if (raw instanceof Blob) raw = Buffer.from(await raw.arrayBuffer());
    let msg; try { msg = JSON.parse(Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw)); } catch { return; }

    if (msg.setupComplete) {
      console.log(`setupComplete ${Date.now() - t0}ms → enviando audio ES...`);
      ws.send(JSON.stringify({ realtimeInput: { audio: { data: int16ToB64(pcm16k), mimeType: 'audio/pcm;rate=16000' } } }));
      ws.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
      sentAt = Date.now();
      return;
    }
    for (const p of (msg.serverContent?.modelTurn?.parts || [])) {
      if (p.inlineData?.data) {
        if (firstAudioMs === null) { firstAudioMs = Date.now() - sentAt; console.log(`⏱️  TTFB primer audio traducido: ${firstAudioMs}ms`); }
        const m = /rate=(\d+)/.exec(p.inlineData.mimeType || ''); if (m) outRate = +m[1];
        chunks.push(Buffer.from(p.inlineData.data, 'base64'));
      }
    }
    const it = msg.serverContent?.inputTranscription?.text;
    const ot = msg.serverContent?.outputTranscription?.text;
    if (it) console.log('  (escuchó):', it);
    if (ot) console.log('  (tradujo):', ot);
    if (msg.serverContent?.generationComplete || msg.serverContent?.turnComplete) {
      // pequeño respiro por si quedan chunks de audio en vuelo
      setTimeout(saveAndClose, 600);
    }
    if (msg.error) { console.error('Error servidor:', JSON.stringify(msg.error).slice(0, 200)); ws.close(); }
  };
  ws.onerror = (e) => console.error('WS error:', e?.message || e);
  ws.onclose = (e) => { console.log(`WS cerrado (code ${e?.code ?? '?'}).`); if (!saved) saveAndClose(); };
  // Respaldo: si nada cierra en 25s, guarda lo recibido.
  setTimeout(saveAndClose, 25_000);
}

main().catch((e) => { console.error(e); process.exit(1); });
