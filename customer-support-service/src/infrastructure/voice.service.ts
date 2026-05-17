import { Injectable, Logger } from '@nestjs/common';
import { AgentGender } from '../agent/conversation.service';

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
  es: { name: 'español',  sttPrimary: 'es-EC', ttsLangCode: 'es-US' },
  en: { name: 'english',  sttPrimary: 'en-US', ttsLangCode: 'en-US' },
  fr: { name: 'français', sttPrimary: 'fr-FR', ttsLangCode: 'fr-FR' },
  de: { name: 'deutsch',  sttPrimary: 'de-DE', ttsLangCode: 'de-DE' },
  qu: { name: 'kichwa',   sttPrimary: 'qu-PE', ttsLangCode: 'es-US' }, // TTS fallback
};

/**
 * Chirp 3 HD voice persona — UN SOLO nombre cross-language para consistencia
 * de marca. Sample alternatives:
 *   'Aoede'   — femenina, cálida (recomendada para Going)
 *   'Charon'  — masculino, formal
 *   'Phoebe'  — femenina, joven
 *   'Algenib' — masculino, neutral
 */
const CHIRP3_PERSONA: Record<AgentGender, string> = {
  female: 'Aoede',
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

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

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
    try {
      const { SpeechClient } = await import('@google-cloud/speech');
      const speechClient = new SpeechClient();
      // Sample rate: WhatsApp Cloud API entrega OGG_OPUS a 48000 Hz (default
      // del spec Opus). Cloud STT v1 NO auto-detecta del header — hay que
      // pasarlo explícito. Antes estaba 16000 lo cual fallaba silencioso con
      // INVALID_ARGUMENT en algunos clientes (Whats nativo usa 48k).
      //
      // Model: 'latest_short' está optimizado para utterances < 60s (voice
      // notes de WhatsApp son típicamente 2-15s) y soporta multi-language
      // bien. Antes era 'default' que tardaba 2+ min y devolvía 0 results
      // (verificado en prod 2026-05-17 13:28-13:31).
      // useEnhanced: true activa el modelo enhanced de Google (mejor accuracy
      // a costo marginal de latencia, pero MUCHO mejor que 'default' para audio
      // comprimido/ruidoso típico de mobile).
      const [response] = await speechClient.recognize({
        config: {
          encoding: 'OGG_OPUS' as any,
          sampleRateHertz: 48000,
          audioChannelCount: 1, // WhatsApp voice = mono
          languageCode: LANG.es.sttPrimary,
          // Cloud STT v1 acepta hasta 4 alternativas adicionales.
          alternativeLanguageCodes: [
            LANG.en.sttPrimary,
            LANG.fr.sttPrimary,
            LANG.de.sttPrimary,
            LANG.qu.sttPrimary,
          ],
          enableAutomaticPunctuation: true,
          model: 'latest_short',
          useEnhanced: true,
        },
        audio: { content: audioBuffer.toString('base64') },
      });

      this.logger.log(`[stt] response: ${JSON.stringify({ resultsCount: response.results?.length ?? 0 })}`);

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
      return { transcript, lang };
    } catch (err) {
      this.logger.error(`[stt] transcribe error: ${(err as Error).message}`, (err as Error).stack);
      return { transcript: '', lang: 'es' };
    }
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
  ): Promise<Buffer | null> {
    const langKey = normalizeLang(lang);
    const langCfg = LANG[langKey];
    const personaName = CHIRP3_PERSONA[gender];

    try {
      const { TextToSpeechClient } = await import('@google-cloud/text-to-speech');
      const ttsClient = new TextToSpeechClient();

      // Intentar Chirp 3 HD primero (calidad superior, voz consistente cross-lang)
      const chirpVoiceName = `${langCfg.ttsLangCode}-Chirp3-HD-${personaName}`;
      try {
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
        if (response.audioContent) {
          this.logger.log(`[tts] chirp3 ${chirpVoiceName} ok (${text.length} chars → audio)`);
          return Buffer.from(response.audioContent as Uint8Array);
        }
      } catch (chirpErr) {
        this.logger.warn(
          `[tts] chirp3 ${chirpVoiceName} no disponible (${(chirpErr as Error).message.slice(0, 100)}) — fallback Neural2`,
        );
      }

      // Fallback: Neural2 (compatible legacy, todas las regiones)
      const fallbackVoice = this.neural2Fallback(langKey, gender);
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
      if (!response.audioContent) return null;
      this.logger.log(`[tts] neural2 ${fallbackVoice.name} ok`);
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
