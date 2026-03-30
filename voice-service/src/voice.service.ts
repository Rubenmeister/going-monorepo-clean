/**
 * Voice Commands & Speech Processing Service
 * Google Cloud Speech-to-Text and Text-to-Speech
 * Uses Application Default Credentials (ADC) on Cloud Run
 */

import { Injectable, Logger } from '@nestjs/common';
import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

export interface VoiceCommand {
  id?: string;
  text: string;
  action: string;
  parameters?: Record<string, any>;
  userId: string;
  platform: 'GOOGLE_ASSISTANT' | 'ALEXA' | 'WEB_SPEECH' | 'SIRI';
  status: 'RECOGNIZED' | 'PROCESSING' | 'EXECUTED' | 'FAILED';
  confidence: number;
  executedAt?: Date;
  createdAt: Date;
}

export interface VoiceNotification {
  id?: string;
  userId: string;
  message: string;
  type: 'DELIVERY_NOTIFICATION' | 'ALERT' | 'REMINDER' | 'CONFIRMATION';
  audioUrl?: string;
  status: 'PENDING' | 'PLAYING' | 'COMPLETED';
  createdAt: Date;
  deliveredAt?: Date;
}

export interface ConversationContext {
  sessionId: string;
  userId: string;
  lastCommand?: string;
  context: Record<string, any>;
  conversationHistory: VoiceCommand[];
  startedAt: Date;
  endedAt?: Date;
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private speechClient: SpeechClient;
  private ttsClient: TextToSpeechClient;

  // In-memory storage
  private commands: Map<string, VoiceCommand> = new Map();
  private notifications: Map<string, VoiceNotification> = new Map();
  private conversations: Map<string, ConversationContext> = new Map();

  // Command mappings
  private commandMap: Record<string, { action: string; params: string[] }> = {
    'rastrea mi entrega': { action: 'TRACK_DELIVERY', params: ['orderId'] },
    'track my delivery': { action: 'TRACK_DELIVERY', params: ['orderId'] },
    'donde esta mi paquete': { action: 'GET_PACKAGE_LOCATION', params: ['orderId'] },
    'where is my package': { action: 'GET_PACKAGE_LOCATION', params: ['orderId'] },
    'llama a mi conductor': { action: 'CALL_DRIVER', params: ['orderId'] },
    'call my driver': { action: 'CALL_DRIVER', params: ['orderId'] },
    'historial de entregas': { action: 'SHOW_HISTORY', params: [] },
    'show delivery history': { action: 'SHOW_HISTORY', params: [] },
    'mi saldo': { action: 'CHECK_BALANCE', params: [] },
    'how much balance': { action: 'CHECK_BALANCE', params: [] },
    'agregar fondos': { action: 'ADD_FUNDS', params: ['amount'] },
    'add funds': { action: 'ADD_FUNDS', params: ['amount'] },
    'reservar viaje': { action: 'CREATE_RIDE', params: ['destination'] },
    'book ride': { action: 'CREATE_RIDE', params: ['destination'] },
    'ayuda': { action: 'SHOW_HELP', params: [] },
    help: { action: 'SHOW_HELP', params: [] },
  };

  constructor() {
    // Use ADC — on Cloud Run this is automatic via the service account
    // In development, set GOOGLE_APPLICATION_CREDENTIALS env var
    try {
      this.speechClient = new SpeechClient();
      this.ttsClient = new TextToSpeechClient();
      this.logger.log('🎤 Voice service initialized with ADC');
    } catch (error) {
      this.logger.warn(`Voice clients init failed (ADC not available): ${error}`);
    }
  }

  /**
   * Transcribe audio buffer to text
   */
  async transcribeAudio(audioBuffer: Buffer, languageCode = 'es-EC'): Promise<string> {
    if (!this.speechClient) {
      throw new Error('Speech client not initialized');
    }

    const [response] = await this.speechClient.recognize({
      config: {
        encoding: 'LINEAR16' as any,
        sampleRateHertz: 16000,
        languageCode,
        model: 'latest_long',
        alternativeLanguageCodes: ['en-US'],
      },
      audio: { content: audioBuffer.toString('base64') },
    });

    return response.results
      ?.map((r: any) => r.alternatives?.[0]?.transcript)
      .join('\n') || '';
  }

  /**
   * Parse voice command from text
   */
  parseCommand(transcript: string, userId: string, platform: VoiceCommand['platform'] = 'WEB_SPEECH'): VoiceCommand {
    const normalized = transcript.toLowerCase().trim();
    let bestMatch: { action: string; params: string[] } | null = null;
    let highestScore = 0;

    for (const [keyword, mapping] of Object.entries(this.commandMap)) {
      const score = this.calculateSimilarity(normalized, keyword);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = mapping;
      }
    }

    const command: VoiceCommand = {
      id: `cmd-${Date.now()}`,
      text: transcript,
      action: bestMatch?.action || 'UNKNOWN',
      parameters: this.extractParameters(transcript, bestMatch?.params),
      userId,
      platform,
      status: 'RECOGNIZED',
      confidence: highestScore,
      createdAt: new Date(),
    };

    this.commands.set(command.id!, command);
    this.logger.log(`🎤 Command: "${transcript}" → ${command.action} (${(command.confidence * 100).toFixed(0)}%)`);
    return command;
  }

  /**
   * Synthesize text to speech, returns base64 MP3
   */
  async synthesizeSpeech(text: string, languageCode = 'es-US'): Promise<string> {
    if (!this.ttsClient) {
      throw new Error('TTS client not initialized');
    }

    const [response] = await this.ttsClient.synthesizeSpeech({
      input: { text },
      voice: { languageCode, ssmlGender: 'FEMALE' as any },
      audioConfig: { audioEncoding: 'MP3' as any },
    });

    return (response.audioContent as Buffer).toString('base64');
  }

  /**
   * Full pipeline: audio → text → command
   */
  async processAudio(audioBuffer: Buffer, userId: string, platform: VoiceCommand['platform'] = 'WEB_SPEECH'): Promise<VoiceCommand> {
    const transcript = await this.transcribeAudio(audioBuffer);
    if (!transcript) throw new Error('Could not transcribe audio');
    return this.parseCommand(transcript, userId, platform);
  }

  /**
   * Get command history for a user
   */
  getCommandHistory(userId: string, limit = 50): VoiceCommand[] {
    return Array.from(this.commands.values())
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Create conversation session
   */
  createSession(userId: string): ConversationContext {
    const session: ConversationContext = {
      sessionId: `session-${Date.now()}`,
      userId,
      context: {},
      conversationHistory: [],
      startedAt: new Date(),
    };
    this.conversations.set(session.sessionId, session);
    return session;
  }

  getSession(sessionId: string): ConversationContext | undefined {
    return this.conversations.get(sessionId);
  }

  // ── Utilities ───────────────────────────────────────────────────────────

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1;
    const dist = this.levenshteinDistance(longer, shorter);
    return (longer.length - dist) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const track = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i++) track[0][i] = i;
    for (let j = 0; j <= str2.length; j++) track[j][0] = j;
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(track[j][i - 1] + 1, track[j - 1][i] + 1, track[j - 1][i - 1] + indicator);
      }
    }
    return track[str2.length][str1.length];
  }

  private extractParameters(transcript: string, paramNames?: string[]): Record<string, any> {
    const params: Record<string, any> = {};
    if (!paramNames) return params;

    if (paramNames.includes('orderId')) {
      const m = transcript.match(/(?:order|pedido|orden)\s*(\d+)/i);
      if (m) params.orderId = m[1];
    }
    if (paramNames.includes('amount')) {
      const m = transcript.match(/(\d+(?:\.\d+)?)\s*(?:dolares|dollars|usd|\$)/i);
      if (m) params.amount = parseFloat(m[1]);
    }
    if (paramNames.includes('destination')) {
      const m = transcript.match(/(?:to|hacia|a)\s+(.+?)(?:\s+por favor|please|$)/i);
      if (m) params.destination = m[1].trim();
    }
    return params;
  }
}
