import { Injectable, Logger } from '@nestjs/common';
import { AgentGender } from '../agent/conversation.service';
// Top-level static imports — antes hacíamos `await import(...)` por
// recognize() call lo que en cold container agregaba 100+ seg en cargar
// el módulo. Importarlos al top los cachea desde process start.
import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { Storage } from '@google-cloud/storage';
import { createClient as createDeepgramClient, DeepgramClient } from '@deepgram/sdk';

/**
 * Soporte multilingüe (Item 6 — Fase 8 voz) — 5 idiomas:
 *   es  — español (es-EC primary, fallback es-US / es-419)
 *   en  — inglés
 *   fr  — francés
 *   de  — alemán
 *   qu  — kichwa/quichua (best-effort: STT via qu-PE, TTS fallback a español)
 *
 * Resolución del idioma:
 *   - STT envía 4 alternativas a la API + idioma primary
 *   - Cloud STT v1 returns la languageCode del result que matcheó
 *   - El caller usa ese código para hacer el TTS en mismo idioma
 *
 * Voces TTS: Chirp 3 HD multilingual ("Aoede" femenina, "Charon" masculino).
 * Mismo persona-name en los 5 idiomas para que la "voz de Going" sea
 * consistente cross-language. Para kichwa caemos a español-US (no hay
 * voz kichwa nativa en Cloud TTS hoy).
 */

export type SupportedLang = 'es' | 'en' | 'fr' | 'de' | 'qu';

interface LangConfig {
  name:           string;       // human-readable
  sttPrimary:     string;       // BCP-47 para STT primary
  ttsLangCode:    string;       // BCP-47 para TTS voice
}

const LANG: Record<SupportedLang, LangConfig> = {
  // STT primary es-US (NO es-EC): el modelo 'latest_short' devuelve
  // INVALID_ARGUMENT "The requested model is currently not supported for
  // language: es-EC". es-US cubre Latin American Spanish con la misma
  // accuracy práctica para voz ecuatoriana (verificado en prod 2026-05-17).
  // El TTS sigue en es-US (voz natural).
  es: { name: 'español',  sttPrimary: 'es-US', ttsLangCode: 'es-US' },
  en: { name: 'english',  sttPrimary: 'en-US', ttsLangCode: 'en-US' },
  fr: { name: 'français', sttPrimary: 'fr-FR', ttsLangCode: 'fr-FR' },
  de: { name: 'deutsch',  sttPrimary: 'de-DE', ttsLangCode: 'de-DE' },
  qu: { name: 'kichwa',   sttPrimary: 'qu-PE', ttsLangCode: 'es-US' }, // TTS fallback
};

/**
 * Chirp 3 HD voice persona — cada voz es un nombre que mantiene la misma
 * identidad sonora en los 5 idiomas (multilingual nativa).
 *
 * Test A/B 2026-05-17 con 7 voces (Aoede, Leda, Kore, Despina, Sulafat,
 * Charon, Algenib) sobre frase típica Going. Las 4 seleccionadas (2 fem +
 * 2 masc) están disponibles para que el cliente elija en Settings; si no
 * elige, se usa la default del género asignado por conversation.service.
 */
export type VoiceName = 'Kore' | 'Despina' | 'Charon' | 'Algenib';

/** Voces disponibles agrupadas por género (para UI de selección). */
export const VOICES_BY_GENDER: Record<AgentGender, VoiceName[]> = {
  female: ['Kore', 'Despina'],  // Kore: neutral, amigable · Despina: más formal
  male:   ['Charon', 'Algenib'], // Charon: formal, autoritativa · Algenib: cálido
};

/** Voz por defecto cuando no hay preferencia explícita del usuario. */
const DEFAULT_VOICE: Record<AgentGender, VoiceName> = {
  female: 'Kore',
  male:   'Charon',
};

/**
 * Mapea BCP-47 STT response → SupportedLang del agent. La API devuelve cosas
 * como 'es-419' o 'en-us' inconsistente, normalizamos por prefijo.
 */
function normalizeLang(bcp47: string | null | undefined): SupportedLang {
  if (!bcp47) return 'es';
  const prefix = bcp47.toLowerCase().split('-')[0];
  if (prefix === 'en' || prefix === 'fr' || prefix === 'de' || prefix === 'qu') return prefix;
  return 'es'; // default fallback
}

/**
 * Extrae sample rate REAL del header OpusHead de un OGG_OPUS buffer.
 *
 * Sin esto, Google STT recibe el audio + un sampleRateHertz hardcoded y si
 * no coinciden, devuelve resultsCount:0 silencioso o results con transcript
 * vacío. WhatsApp móvil suele enviar a 16 kHz (ahorra datos) mientras que
 * web envía a 48 kHz. Sin detectar dinámico, mitad de las notas fallan.
 *
 * Estructura del Ogg page + OpusHead (bytes desde inicio del buffer):
 *   0-3:   "OggS" magic (4f 67 67 53)
 *   ...    (header de página variable)
 *   ?:     "OpusHead" magic (8 bytes ASCII)
 *   +8:    version (1 byte)
 *   +9:    channel count (1 byte)
 *   +10-11: pre-skip (uint16 LE)
 *   +12-15: sample rate (uint32 LE) ← QUEREMOS ESTO
 *
 * Devuelve null si no encuentra el header — caller debe fallback a 48000.
 */
function extractOpusSampleRate(audioBuffer: Buffer): number | null {
  const marker = Buffer.from('OpusHead');
  const idx = audioBuffer.indexOf(marker);
  if (idx < 0 || idx + 16 > audioBuffer.length) return null;
  // Sample rate está 12 bytes después del marker "OpusHead", uint32 little-endian
  return audioBuffer.readUInt32LE(idx + 12);
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private speechClient: SpeechClient | null = null;
  private ttsClient: TextToSpeechClient | null = null;
  private storage: Storage | null = null;
  private deepgram: DeepgramClient | null = null;

  /**
   * Convierte un buffer OGG_OPUS a texto via Google Cloud Speech-to-Text v1.
   * Devuelve además el idioma detectado para que el caller use el mismo en TTS.
   *
   * Estrategia multi-idioma:
   *  - Primary: es-EC (volumen alto en Ecuador)
   *  - Alternativas: en-US, fr-FR, de-DE, qu-PE (max 4 alts en v1 API)
   *  - Si la API detecta una alt, el resultado incluye `languageCode`
   *  - Fallback a 'es' si no podemos determinarlo
   */
  async transcribe(audioBuffer: Buffer): Promise<{ transcript: string; lang: SupportedLang }> {
    // Log primeros 32 bytes (header) en hex para diagnóstico. OGG empieza
    // con "OggS" (0x4F 0x67 0x67 0x53). Si vemos otro magic number significa
    // que WhatsApp cambió el formato o estamos recibiendo algo distinto.
    const headerHex = audioBuffer.slice(0, 32).toString('hex');
    this.logger.log(`[stt] start: audioBuffer ${audioBuffer.length} bytes, header=${headerHex}`);
    if (audioBuffer.length < 100) {
      this.logger.warn(`[stt] buffer too small (${audioBuffer.length} bytes), aborting`);
      return { transcript: '', lang: 'es' };
    }

    // ── PRIMARY: Deepgram Nova-3 ──────────────────────────────────────────
    // 5-15x más rápido que Google STT v1 para voice notes de WhatsApp.
    // Soporta OGG_OPUS nativamente (sin parsear sample rate). Auto-detect
    // de 36+ idiomas. Si falla cualquier cosa (red, key inválida, rate
    // limit) → fallback automático a Google STT v1 (código abajo en catch).
    const deepgramKey = process.env.DEEPGRAM_API_KEY;
    if (deepgramKey) {
      try {
        if (!this.deepgram) this.deepgram = createDeepgramClient(deepgramKey);
        const t0 = Date.now();
        const { result, error } = await this.deepgram.listen.prerecorded.transcribeFile(
          audioBuffer,
          {
            model: 'nova-3',
            detect_language: true,
            smart_format: true,
            punctuate: true,
            mimetype: 'audio/ogg',
          },
        );
        const dt = Date.now() - t0;
        if (error) throw new Error(`Deepgram error: ${error.message || JSON.stringify(error)}`);
        const channel = result?.results?.channels?.[0];
        const alt = channel?.alternatives?.[0];
        const transcript = alt?.transcript ?? '';
        const detectedLang = (channel as any)?.detected_language as string | undefined;
        const lang = normalizeLang(detectedLang);
        this.logger.log(`[stt-deepgram] transcript "${transcript.slice(0, 80)}" (${transcript.length} chars, lang=${lang}, detected=${detectedLang}, ${dt}ms)`);
        if (transcript) return { transcript, lang };
        // Si Deepgram devuelve vacío sin error, caer a Google como segundo intento
        this.logger.warn(`[stt-deepgram] transcript vacío, intentando con Google STT como fallback`);
      } catch (err) {
        this.logger.warn(`[stt-deepgram] fallo, fallback a Google: ${(err as Error).message}`);
      }
    } else {
      this.logger.warn(`[stt] DEEPGRAM_API_KEY no configurada, usando Google STT directo`);
    }

    // ── FALLBACK: Google Cloud Speech-to-Text v1 ─────────────────────────
    try {
      // SpeechClient cacheado a nivel de instancia para no reinicializar
      // en cada recognize() — el SDK abre conexiones gRPC que cuestan
      // ~100ms en establecerse.
      if (!this.speechClient) this.speechClient = new SpeechClient();
      const speechClient = this.speechClient;
      // Sample rate: WhatsApp Cloud API entrega OGG_OPUS a 48000 Hz (default
      // del spec Opus). Cloud STT v1 NO auto-detecta del header — hay que
      // pasarlo explícito. Antes estaba 16000 lo cual fallaba silencioso con
      // INVALID_ARGUMENT en algunos clientes (Whats nativo usa 48k).
      //
      // Model selection — ver iteraciones previas:
      //
      //   2026-05-17 13:28 — `default` sin useEnhanced: tardaba 2+ min y
      //                       devolvía 0 results en audio claro.
      //   2026-05-17 13:48 — `latest_short` + useEnhanced + es-EC: API rechazó
      //                       (modelo no soporta es-EC).
      //   2026-05-17 15:30 — `latest_short` + useEnhanced + es-US: API acepta
      //                       pero devuelve resultsCount=0. CAUSA REAL: sample
      //                       rate del audio era 16kHz, le decíamos 48kHz.
      //   2026-05-17 16:50 — `default` + useEnhanced + es-US: funcionó pero
      //                       LENTO (~36 seg para audio de 3 seg). Causa de
      //                       latencia inaceptable >2 min total.
      //   2026-05-17 21:00 — `latest_short` + sample rate detection + es-US:
      //                       VOLVEMOS al modelo rápido (~3-5 seg típico).
      //                       Ahora que el sample rate es correcto desde el
      //                       OpusHead, latest_short funciona bien.
      // Detectar sample rate REAL del OpusHead del audio. WhatsApp móvil
      // suele entregar 16 kHz (ahorro de datos), web 48 kHz. Pasarle a
      // Google STT un sampleRateHertz que NO coincida con el audio resulta
      // en transcripts vacíos o resultsCount:0 silente. Causa raíz del bug
      // de "no entiende voz" en producción (2026-05-17).
      const detectedRate = extractOpusSampleRate(audioBuffer);
      const sampleRate = detectedRate ?? 48000;
      this.logger.log(`[stt] sample rate detectado=${detectedRate}, usando=${sampleRate}`);

      const [response] = await speechClient.recognize({
        config: {
          encoding: 'OGG_OPUS' as any,
          sampleRateHertz: sampleRate,
          audioChannelCount: 1, // WhatsApp voice = mono
          languageCode: LANG.es.sttPrimary,
          // SIN alternativeLanguageCodes: la verificación 2026-05-17 mostró
          // que con ['en-US'] como alt, el detector clasificó audio español
          // como en-US y devolvió result vacío con confidence 0. Para 95%+
          // del tráfico que es español, forzar solo es-US es más confiable.
          enableAutomaticPunctuation: true,
          // Volviendo a 'default' después de probar latest_short: hoy
          // 2026-05-17 23:37 latest_short tardó 229s (debería ser <10s).
          // Google API parece tener inconsistencias con ese modelo en es-US.
          // 'default' es lento pero predecible (~30-50s para 24KB).
          model: 'default',
          useEnhanced: true,
        },
        audio: { content: audioBuffer.toString('base64') },
      });

      // Log estructura COMPLETA del response cuando devuelve algún result.
      // Útil para entender por qué resultsCount=1 pero transcript=''.
      // Mostramos confidence + alternatives + languageCode de cada result.
      const respDebug = {
        resultsCount: response.results?.length ?? 0,
        results: response.results?.map((r: any) => ({
          languageCode: r.languageCode,
          alternativesCount: r.alternatives?.length ?? 0,
          alts: r.alternatives?.slice(0, 3).map((a: any) => ({
            transcript: a.transcript || '(empty)',
            confidence: a.confidence,
          })),
        })),
      };
      this.logger.log(`[stt] response: ${JSON.stringify(respDebug)}`);

      const transcript = response.results
        ?.map((r: any) => r.alternatives?.[0]?.transcript)
        .filter(Boolean)
        .join(' ') || '';

      // El campo languageCode del primer result indica el idioma detectado.
      // Si vienen varios results (silencios separando frases), tomamos el del más largo.
      const langOfBest = response.results
        ?.reduce<{ lang?: string; len: number }>((acc, r: any) => {
          const t = r.alternatives?.[0]?.transcript || '';
          if (t.length > acc.len) return { lang: r.languageCode, len: t.length };
          return acc;
        }, { len: 0 })
        ?.lang;

      const lang = normalizeLang(langOfBest);
      this.logger.log(`[stt] transcript "${transcript.slice(0, 80)}" (${transcript.length} chars, lang=${lang}, detected=${langOfBest})`);

      // Si transcript vacío → subir el audio a GCS para diagnóstico.
      // Habilitado mientras VOICE_DEBUG_UPLOAD=true en env. Apagar cuando se
      // identifique el problema (no queremos guardar audio de usuarios real
      // sin justificación). Bucket: going-5d1ae.firebasestorage.app
      if (!transcript && process.env.VOICE_DEBUG_UPLOAD === 'true') {
        await this.uploadAudioForDebug(audioBuffer).catch((e) =>
          this.logger.warn(`[stt-debug] upload fallido: ${(e as Error).message}`),
        );
      }
      return { transcript, lang };
    } catch (err) {
      this.logger.error(`[stt] transcribe error: ${(err as Error).message}`, (err as Error).stack);
      return { transcript: '', lang: 'es' };
    }
  }

  /**
   * Sube el buffer de audio a GCS para diagnóstico. Solo se invoca cuando
   * VOICE_DEBUG_UPLOAD=true y el transcript salió vacío.
   *
   * Path: gs://going-5d1ae.firebasestorage.app/voice-debug/<YYYY-MM-DD>/<ts>.ogg
   *
   * Para escuchar:
   *   gcloud storage cp gs://going-5d1ae.firebasestorage.app/voice-debug/... ./
   */
  private async uploadAudioForDebug(audioBuffer: Buffer): Promise<void> {
    if (!this.storage) this.storage = new Storage();
    const storage = this.storage;
    const bucketName = 'going-5d1ae.firebasestorage.app';
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const ts = now.toISOString().replace(/[:.]/g, '-');
    const path = `voice-debug/${day}/${ts}.ogg`;
    await storage.bucket(bucketName).file(path).save(audioBuffer, {
      contentType: 'audio/ogg',
      metadata: { metadata: { source: 'stt-empty-transcript-debug' } },
    });
    this.logger.log(`[stt-debug] audio subido: gs://${bucketName}/${path}`);
  }

  /**
   * Sintetiza texto a OGG_OPUS via Google Cloud TTS Chirp 3 HD.
   * Devuelve null si falla — el caller debe tener fallback a texto plano.
   *
   * Voces Chirp 3 HD están en preview/GA. Si la región no las tiene
   * disponibles, hace fallback transparente a Neural2 (mismo idioma).
   */
  async synthesize(
    text: string,
    lang: SupportedLang | string,
    gender: AgentGender,
    voiceOverride?: VoiceName,
  ): Promise<Buffer | null> {
    const langKey = normalizeLang(lang);
    const langCfg = LANG[langKey];
    // Si el usuario eligió una voz específica, gana sobre la default-por-género.
    const personaName = voiceOverride ?? DEFAULT_VOICE[gender];

    try {
      if (!this.ttsClient) this.ttsClient = new TextToSpeechClient();
      const ttsClient = this.ttsClient;

      // Intentar Chirp 3 HD primero (calidad superior, voz consistente cross-lang)
      const chirpVoiceName = `${langCfg.ttsLangCode}-Chirp3-HD-${personaName}`;
      try {
        const t0 = Date.now();
        const [response] = await ttsClient.synthesizeSpeech({
          input: { text },
          voice: {
            languageCode: langCfg.ttsLangCode,
            name:         chirpVoiceName,
          },
          audioConfig: {
            audioEncoding: 'OGG_OPUS' as any,
            speakingRate: 1.0,
            pitch: 0,
          },
        });
        const dt = Date.now() - t0;
        if (response.audioContent) {
          const audioBytes = (response.audioContent as Uint8Array).length;
          this.logger.log(`[tts-chirp3] ${chirpVoiceName} ok (${text.length} chars → ${audioBytes}B audio, ${dt}ms)`);
          return Buffer.from(response.audioContent as Uint8Array);
        }
      } catch (chirpErr) {
        this.logger.warn(
          `[tts-chirp3] ${chirpVoiceName} no disponible (${(chirpErr as Error).message.slice(0, 100)}) — fallback Neural2`,
        );
      }

      // Fallback: Neural2 (compatible legacy, todas las regiones)
      const fallbackVoice = this.neural2Fallback(langKey, gender);
      const t0 = Date.now();
      const [response] = await ttsClient.synthesizeSpeech({
        input: { text },
        voice: {
          languageCode: fallbackVoice.languageCode,
          name:         fallbackVoice.name,
        },
        audioConfig: {
          audioEncoding: 'OGG_OPUS' as any,
          speakingRate: 1.0,
          pitch: 0,
        },
      });
      const dt = Date.now() - t0;
      if (!response.audioContent) return null;
      const audioBytes = (response.audioContent as Uint8Array).length;
      this.logger.log(`[tts-neural2] ${fallbackVoice.name} ok (${text.length} chars → ${audioBytes}B audio, ${dt}ms)`);
      return Buffer.from(response.audioContent as Uint8Array);
    } catch (err) {
      this.logger.error('TTS synthesize error', err);
      return null;
    }
  }

  /**
   * Mapeo de fallback a Neural2 cuando Chirp 3 HD no disponible.
   * Cubre solo es+en (los originales de pre-Item-6); fr/de/qu caen a
   * Standard voices.
   */
  private neural2Fallback(
    lang: SupportedLang,
    gender: AgentGender,
  ): { languageCode: string; name: string } {
    const fallbacks: Record<SupportedLang, Record<AgentGender, { languageCode: string; name: string }>> = {
      es: {
        male:   { languageCode: 'es-US', name: 'es-US-Neural2-B' },
        female: { languageCode: 'es-US', name: 'es-US-Neural2-A' },
      },
      en: {
        male:   { languageCode: 'en-US', name: 'en-US-Neural2-D' },
        female: { languageCode: 'en-US', name: 'en-US-Neural2-F' },
      },
      fr: {
        male:   { languageCode: 'fr-FR', name: 'fr-FR-Neural2-B' },
        female: { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A' },
      },
      de: {
        male:   { languageCode: 'de-DE', name: 'de-DE-Neural2-B' },
        female: { languageCode: 'de-DE', name: 'de-DE-Neural2-A' },
      },
      qu: {
        // No hay Neural2 para Kichwa — caemos a español
        male:   { languageCode: 'es-US', name: 'es-US-Neural2-B' },
        female: { languageCode: 'es-US', name: 'es-US-Neural2-A' },
      },
    };
    return fallbacks[lang][gender];
  }
}
