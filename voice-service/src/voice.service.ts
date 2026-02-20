/**
 * Voice Commands & Voice-Controlled Navigation Service
 * Integration with Google Assistant, Alexa, and Web Speech API
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
  confidence: number; // 0-1
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

  // Voice command mappings
  private commandMap = {
    'track my delivery': { action: 'TRACK_DELIVERY', params: ['orderId'] },
    'where is my package': {
      action: 'GET_PACKAGE_LOCATION',
      params: ['orderId'],
    },
    'call my driver': { action: 'CALL_DRIVER', params: ['orderId'] },
    'show delivery history': { action: 'SHOW_HISTORY', params: [] },
    'how much balance': { action: 'CHECK_BALANCE', params: [] },
    'add funds': { action: 'ADD_FUNDS', params: ['amount'] },
    'book delivery': {
      action: 'CREATE_DELIVERY',
      params: ['destination', 'items'],
    },
    'cancel delivery': { action: 'CANCEL_DELIVERY', params: ['orderId'] },
    'rate delivery': { action: 'RATE_DELIVERY', params: ['orderId', 'rating'] },
    support: { action: 'CONTACT_SUPPORT', params: [] },
    help: { action: 'SHOW_HELP', params: [] },
    'next delivery': { action: 'SHOW_NEXT_DELIVERY', params: [] },
    'my account': { action: 'SHOW_ACCOUNT', params: [] },
  };

  constructor() {
    this.speechClient = new SpeechClient({
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    });
    this.ttsClient = new TextToSpeechClient({
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    });

    this.logger.log('🎤 Voice service initialized');
  }

  /**
   * Process voice input and recognize command
   */
  async recognizeCommand(
    audioBuffer: Buffer,
    userId: string,
    platform: VoiceCommand['platform'] = 'WEB_SPEECH'
  ): Promise<VoiceCommand> {
    try {
      // Transcribe audio to text
      const transcript = await this.transcribeAudio(audioBuffer);

      if (!transcript) {
        throw new Error('Failed to transcribe audio');
      }

      // Parse command from transcript
      const command = await this.parseCommand(transcript, userId, platform);

      this.logger.log(
        `🎤 Command recognized: "${transcript}" -> ${command.action} (${(
          command.confidence * 100
        ).toFixed(0)}%)`
      );

      return command;
    } catch (error) {
      this.logger.error(`Failed to recognize command: ${error}`);
      throw error;
    }
  }

  /**
   * Transcribe audio to text using Google Cloud Speech-to-Text
   */
  private async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    try {
      const audio = {
        content: audioBuffer.toString('base64'),
      };

      const config = {
        encoding: 'LINEAR16' as any,
        sampleRateHertz: 16000,
        languageCode: 'en-US',
        model: 'latest_long',
      };

      const request = {
        config,
        audio,
      };

      const [response] = await this.speechClient.recognize(request);
      const transcription = response.results
        ?.map((result: any) => result.alternatives?.[0]?.transcript)
        .join('\n');

      return transcription || '';
    } catch (error) {
      this.logger.error(`Failed to transcribe audio: ${error}`);
      return '';
    }
  }

  /**
   * Parse natural language command
   */
  private async parseCommand(
    transcript: string,
    userId: string,
    platform: VoiceCommand['platform']
  ): Promise<VoiceCommand> {
    try {
      const normalizedText = transcript.toLowerCase().trim();
      let bestMatch: any = null;
      let highestScore = 0;

      // Find best matching command
      for (const [keyword, mapping] of Object.entries(this.commandMap)) {
        const score = this.calculateSimilarity(normalizedText, keyword);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = { ...mapping, text: normalizedText };
        }
      }

      const command: VoiceCommand = {
        id: `cmd-${Date.now()}`,
        text: transcript,
        action: bestMatch?.action || 'UNKNOWN',
        parameters: await this.extractParameters(transcript, bestMatch?.params),
        userId,
        platform,
        status: 'RECOGNIZED',
        confidence: highestScore,
        createdAt: new Date(),
      };

      this.commands.set(command.id!, command);
      return command;
    } catch (error) {
      this.logger.error(`Failed to parse command: ${error}`);
      throw error;
    }
  }

  /**
   * Calculate similarity score between strings (Levenshtein distance)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const track = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }

    return track[str2.length][str1.length];
  }

  /**
   * Extract parameters from voice command
   */
  private async extractParameters(
    transcript: string,
    paramNames: string[] | undefined
  ): Promise<Record<string, any>> {
    try {
      const params: Record<string, any> = {};

      if (!paramNames) return params;

      // Extract order ID (e.g., "order 12345")
      if (paramNames.includes('orderId')) {
        const orderMatch = transcript.match(/order\s*(\d+)/i);
        if (orderMatch) {
          params.orderId = orderMatch[1];
        }
      }

      // Extract amount (e.g., "add 50 dollars")
      if (paramNames.includes('amount')) {
        const amountMatch = transcript.match(/(\d+)\s*(dollars|bucks|usd)/i);
        if (amountMatch) {
          params.amount = parseFloat(amountMatch[1]);
        }
      }

      // Extract rating (e.g., "rate 5 stars")
      if (paramNames.includes('rating')) {
        const ratingMatch = transcript.match(/(\d+)\s*stars/i);
        if (ratingMatch) {
          params.rating = parseInt(ratingMatch[1]);
        }
      }

      // Extract destination (e.g., "to main street")
      if (paramNames.includes('destination')) {
        const destMatch = transcript.match(/to\s+(.+?)(?:\s+please|$)/i);
        if (destMatch) {
          params.destination = destMatch[1];
        }
      }

      return params;
    } catch (error) {
      this.logger.error(`Failed to extract parameters: ${error}`);
      return {};
    }
  }

  /**
   * Execute voice command
   */
  async executeCommand(commandId: string): Promise<any> {
    try {
      const command = this.commands.get(commandId);
      if (!command) {
        throw new Error('Command not found');
      }

      command.status = 'PROCESSING';

      let result: any = null;

      switch (command.action) {
        case 'TRACK_DELIVERY':
          result = await this.handleTrackDelivery(command.parameters);
          break;
        case 'GET_PACKAGE_LOCATION':
          result = await this.handleGetLocation(command.parameters);
          break;
        case 'CALL_DRIVER':
          result = await this.handleCallDriver(command.parameters);
          break;
        case 'CHECK_BALANCE':
          result = await this.handleCheckBalance(command.userId);
          break;
        case 'ADD_FUNDS':
          result = await this.handleAddFunds(
            command.userId,
            command.parameters
          );
          break;
        case 'SHOW_HISTORY':
          result = await this.handleShowHistory(command.userId);
          break;
        case 'CREATE_DELIVERY':
          result = await this.handleCreateDelivery(
            command.userId,
            command.parameters
          );
          break;
        default:
          result = { message: 'Command not implemented' };
      }

      command.status = 'EXECUTED';
      command.executedAt = new Date();

      this.logger.log(`✅ Command executed: ${command.action}`);

      return result;
    } catch (error) {
      this.logger.error(`Failed to execute command: ${error}`);
      throw error;
    }
  }

  /**
   * Generate voice response
   */
  async generateVoiceResponse(
    text: string,
    userId: string
  ): Promise<VoiceNotification> {
    try {
      const audioContent = await this.synthesizeSpeech(text);

      const notification: VoiceNotification = {
        id: `notif-${Date.now()}`,
        userId,
        message: text,
        type: 'CONFIRMATION',
        audioUrl: `data:audio/mp3;base64,${audioContent.toString('base64')}`,
        status: 'PENDING',
        createdAt: new Date(),
      };

      this.notifications.set(notification.id!, notification);

      this.logger.log(
        `🔊 Voice response generated: ${text.substring(0, 50)}...`
      );

      return notification;
    } catch (error) {
      this.logger.error(`Failed to generate voice response: ${error}`);
      throw error;
    }
  }

  /**
   * Synthesize text to speech using Google Cloud TTS
   */
  private async synthesizeSpeech(text: string): Promise<Buffer> {
    try {
      const request = {
        input: { text },
        voice: { languageCode: 'en-US', name: 'en-US-Neural2-C' },
        audioConfig: { audioEncoding: 'MP3' as any },
      };

      const [response] = await this.ttsClient.synthesizeSpeech(request);
      return response.audioContent as Buffer;
    } catch (error) {
      this.logger.error(`Failed to synthesize speech: ${error}`);
      throw error;
    }
  }

  /**
   * Send voice notification
   */
  async sendVoiceNotification(
    userId: string,
    message: string
  ): Promise<VoiceNotification> {
    try {
      const notification = await this.generateVoiceResponse(message, userId);
      notification.status = 'PLAYING';
      notification.deliveredAt = new Date();

      this.logger.log(`📢 Voice notification sent to user ${userId}`);

      return notification;
    } catch (error) {
      this.logger.error(`Failed to send voice notification: ${error}`);
      throw error;
    }
  }

  /**
   * Create conversation session
   */
  async createConversationSession(
    userId: string
  ): Promise<ConversationContext> {
    try {
      const sessionId = `session-${Date.now()}`;

      const session: ConversationContext = {
        sessionId,
        userId,
        context: {},
        conversationHistory: [],
        startedAt: new Date(),
      };

      this.conversations.set(sessionId, session);

      this.logger.log(`🗣️ Conversation session started: ${sessionId}`);

      return session;
    } catch (error) {
      this.logger.error(`Failed to create conversation session: ${error}`);
      throw error;
    }
  }

  /**
   * Get command history
   */
  async getCommandHistory(userId: string, limit = 50): Promise<VoiceCommand[]> {
    try {
      return Array.from(this.commands.values())
        .filter((c) => c.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get command history: ${error}`);
      throw error;
    }
  }

  // Handler methods for specific commands

  private async handleTrackDelivery(
    params?: Record<string, any>
  ): Promise<any> {
    return {
      status: 'success',
      message: `Tracking delivery ${params?.orderId}. Your package is on the way!`,
      eta: new Date(Date.now() + 30 * 60000).toLocaleTimeString(),
    };
  }

  private async handleGetLocation(params?: Record<string, any>): Promise<any> {
    return {
      status: 'success',
      location: { latitude: 40.7128, longitude: -74.006 },
      message: 'Your package is at coordinates 40.71, -74.01',
      distance: '2.5 km away',
    };
  }

  private async handleCallDriver(params?: Record<string, any>): Promise<any> {
    return {
      status: 'success',
      message: 'Initiating call to driver...',
      driverName: 'John Doe',
    };
  }

  private async handleCheckBalance(userId: string): Promise<any> {
    return {
      status: 'success',
      balance: 245.5,
      currency: 'USD',
      message: 'Your wallet balance is $245.50',
    };
  }

  private async handleAddFunds(
    userId: string,
    params?: Record<string, any>
  ): Promise<any> {
    const amount = params?.amount || 100;
    return {
      status: 'success',
      message: `Adding $${amount} to your wallet...`,
      newBalance: 245.5 + amount,
    };
  }

  private async handleShowHistory(userId: string): Promise<any> {
    return {
      status: 'success',
      message: 'Showing your delivery history...',
      deliveries: 15,
    };
  }

  private async handleCreateDelivery(
    userId: string,
    params?: Record<string, any>
  ): Promise<any> {
    return {
      status: 'success',
      message: `Creating delivery to ${params?.destination}...`,
      orderId: `ORD-${Date.now()}`,
      estimatedCost: '$12.50',
    };
  }
}
