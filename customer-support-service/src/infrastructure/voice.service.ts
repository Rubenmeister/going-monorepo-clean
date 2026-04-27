import { Injectable, Logger } from '@nestjs/common';
import { AgentGender } from '../agent/conversation.service';

// 4 voces Neural2 de Google Cloud TTS — ES/EN × M/F.
// Compartido entre WhatsApp y Telegram para que la "voz" del bot sea
// consistente sin importar el canal.
const TTS_VOICES: Record<string, Record<AgentGender, { languageCode: string; name: string }>> = {
  es: {
    male:   { languageCode: 'es-US', name: 'es-US-Neural2-B' },
    female: { languageCode: 'es-US', name: 'es-US-Neural2-A' },
  },
  en: {
    male:   { languageCode: 'en-US', name: 'en-US-Neural2-D' },
    female: { languageCode: 'en-US', name: 'en-US-Neural2-F' },
  },
};

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  /**
   * Convierte un buffer OGG_OPUS a texto via Google Cloud Speech.
   * Multidialecto: prioriza es-EC, fallback en-US.
   */
  async transcribe(audioBuffer: Buffer): Promise<string> {
    try {
      const { SpeechClient } = await import('@google-cloud/speech');
      const speechClient = new SpeechClient();
      const [response] = await speechClient.recognize({
        config: {
          encoding: 'OGG_OPUS' as any,
          sampleRateHertz: 16000,
          languageCode: 'es-EC',
          alternativeLanguageCodes: ['en-US'],
          enableAutomaticPunctuation: true,
          model: 'default',
        },
        audio: { content: audioBuffer.toString('base64') },
      });

      return response.results
        ?.map((r: any) => r.alternatives?.[0]?.transcript)
        .filter(Boolean)
        .join(' ') || '';
    } catch (err) {
      this.logger.error('STT transcribe error', err);
      return '';
    }
  }

  /**
   * Sintetiza texto a OGG_OPUS via Google Cloud TTS Neural2.
   * Devuelve null si falla — el caller debe tener fallback a texto plano.
   */
  async synthesize(
    text: string,
    lang: string,
    gender: AgentGender,
  ): Promise<Buffer | null> {
    try {
      const { TextToSpeechClient } = await import('@google-cloud/text-to-speech');
      const ttsClient = new TextToSpeechClient();

      const voiceLang = lang === 'en' ? 'en' : 'es';
      const voice = TTS_VOICES[voiceLang]?.[gender] || TTS_VOICES['es']['female'];

      const [response] = await ttsClient.synthesizeSpeech({
        input: { text },
        voice: {
          languageCode: voice.languageCode,
          name: voice.name,
        },
        audioConfig: {
          audioEncoding: 'OGG_OPUS' as any,
          speakingRate: 1.0,
          pitch: 0,
        },
      });

      if (!response.audioContent) return null;
      return Buffer.from(response.audioContent as Uint8Array);
    } catch (err) {
      this.logger.error('TTS synthesize error', err);
      return null;
    }
  }
}
