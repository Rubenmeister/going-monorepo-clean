import { Injectable, Logger, Optional } from '@nestjs/common';
import { MongoConversationRepository } from '../infrastructure/persistence/mongo-conversation.repository';
import { HandoffNotifierService } from '../infrastructure/handoff-notifier.service';
import { CerebroPublisherService } from '../infrastructure/cerebro-publisher.service';
import { VoiceName } from '../infrastructure/voice.service';

export type ConversationState = 'AI_ACTIVE' | 'HANDOFF_REQUESTED' | 'HUMAN_ACTIVE';
export type Priority = 'RED' | 'ORANGE' | 'NORMAL';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type AgentGender = 'male' | 'female';

export interface Conversation {
  id: string;
  channel: 'whatsapp' | 'telegram' | 'web';
  userId: string;       // phone number, telegram chat ID, or web user ID
  state: ConversationState;
  priority: Priority;
  messages: Message[];
  agentGender: AgentGender;
  /**
   * Voz preferida del usuario (override por encima del default-por-género).
   * Si no está set, voice.service.synthesize usa la default del agentGender.
   */
  voicePreference?: VoiceName;
  handoffReason?: string;
  operatorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Trigger phrases for human handoff (ES + EN)
const HANDOFF_TRIGGERS_ES = [
  'quiero hablar con una persona', 'hablar con un agente', 'operador',
  'humano', 'persona real', 'no me ayudas', 'quiero ayuda real',
  'escalar', 'supervisor', 'gerente',
];
const HANDOFF_TRIGGERS_EN = [
  'speak to a human', 'real person', 'agent', 'operator',
  'human', 'talk to someone', 'escalate', 'supervisor', 'manager',
];

// Emergency keywords
const EMERGENCY_KEYWORDS = [
  'emergencia', 'emergency', 'accidente', 'accident', 'robo', 'theft',
  'perdido', 'lost', 'herido', 'injured', 'peligro', 'danger', 'urgente', 'urgent',
];

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  // In-memory cache for active conversations
  private conversations = new Map<string, Conversation>();
  // Single-flight: creaciones en curso por userId, para que peticiones
  // concurrentes de un userId NUEVO compartan la misma promesa en lugar de
  // crear dos conversaciones (race condition que perdía mensajes).
  private pending = new Map<string, Promise<Conversation>>();
  private conversationCount = 0; // used to alternate gender

  constructor(
    @Optional() private mongoRepository?: MongoConversationRepository,
    @Optional() private handoffNotifier?: HandoffNotifierService,
    @Optional() private cerebroPublisher?: CerebroPublisherService,
  ) {}

  async getOrCreate(userId: string, channel: 'whatsapp' | 'telegram' | 'web' = 'whatsapp'): Promise<Conversation> {
    // Check cache first (rápido, síncrono).
    const cached = this.conversations.get(userId);
    if (cached) return cached;

    // Single-flight: si ya hay una creación/carga en curso para este userId,
    // reusar la MISMA promesa evita dos lecturas a Mongo y dos objetos nuevos.
    const inFlight = this.pending.get(userId);
    if (inFlight) return inFlight;

    const promise = this.loadOrCreate(userId, channel)
      .finally(() => this.pending.delete(userId));
    this.pending.set(userId, promise);
    return promise;
  }

  private async loadOrCreate(userId: string, channel: 'whatsapp' | 'telegram' | 'web'): Promise<Conversation> {
    // Re-check por si otra promesa pobló la cache mientras esperábamos.
    const cached = this.conversations.get(userId);
    if (cached) return cached;

    // Check MongoDB
    let mongoConv = null;
    if (this.mongoRepository) {
      mongoConv = await this.mongoRepository.findOne(userId);
    }

    if (mongoConv) {
      // Reconstruct as Conversation object
      const conv: Conversation = {
        id: `${channel}-${userId}-${mongoConv.createdAt.getTime()}`,
        channel: (mongoConv as any).channel || channel,
        userId,
        state: this.mapMongoStatusToState(mongoConv.status as any),
        priority: (mongoConv.priority as Priority) || 'NORMAL',
        messages: mongoConv.messages as Message[],
        agentGender: (mongoConv as any).agentGender || (this.conversationCount % 2 === 0 ? 'male' : 'female'),
        voicePreference: (mongoConv as any).voicePreference,
        handoffReason: (mongoConv as any).handoffReason,
        operatorId: (mongoConv as any).operatorId,
        createdAt: mongoConv.createdAt,
        updatedAt: mongoConv.updatedAt,
      };
      this.conversations.set(userId, conv);
      return conv;
    }

    // Create new conversation
    const agentGender: AgentGender = this.conversationCount % 2 === 0 ? 'male' : 'female';
    this.conversationCount++;

    const conv: Conversation = {
      id: `${channel}-${userId}-${Date.now()}`,
      channel,
      userId,
      state: 'AI_ACTIVE',
      priority: 'NORMAL',
      messages: [],
      agentGender,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversations.set(userId, conv);

    // Save to MongoDB
    if (this.mongoRepository) {
      await this.mongoRepository.save(userId, {
        userId,
        messages: [],
        status: 'active',
        priority: 'NORMAL',
        channel,
        agentGender,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      });
    }

    return conv;
  }

  async addMessage(userId: string, role: 'user' | 'assistant', content: string): Promise<void> {
    const conv = await this.getOrCreate(userId);
    conv.messages.push({ role, content, timestamp: new Date() });
    conv.updatedAt = new Date();
    // Keep last 20 messages to avoid exceeding context
    if (conv.messages.length > 20) {
      conv.messages = conv.messages.slice(-20);
    }

    // Persist to MongoDB
    if (this.mongoRepository) {
      await this.mongoRepository.addMessage(userId, role, content);
    }
  }

  detectHandoffTrigger(text: string): { needed: boolean; priority: Priority } {
    const lower = text.toLowerCase();

    // Emergency = RED
    if (EMERGENCY_KEYWORDS.some(k => lower.includes(k))) {
      return { needed: true, priority: 'RED' };
    }

    // Frustration detection: excessive caps or !! = ORANGE
    const capsRatio = (text.match(/[A-ZÁÉÍÓÚÜÑ]/g) || []).length / text.length;
    if (capsRatio > 0.6 || text.includes('!!')) {
      return { needed: true, priority: 'ORANGE' };
    }

    // Explicit handoff request = NORMAL
    const allTriggers = [...HANDOFF_TRIGGERS_ES, ...HANDOFF_TRIGGERS_EN];
    if (allTriggers.some(t => lower.includes(t))) {
      return { needed: true, priority: 'NORMAL' };
    }

    return { needed: false, priority: 'NORMAL' };
  }

  async requestHandoff(userId: string, reason: string, priority: Priority): Promise<void> {
    const conv = await this.getOrCreate(userId);
    conv.state = 'HANDOFF_REQUESTED';
    conv.priority = priority;
    conv.handoffReason = reason;
    conv.updatedAt = new Date();

    // Persist to MongoDB
    if (this.mongoRepository) {
      await this.mongoRepository.updateStatus(userId, 'handoff');
      await this.mongoRepository.save(userId, {
        priority,
        handoffReason: reason,
        updatedAt: conv.updatedAt,
      });
    }

    // Notificar a operadores via Telegram (fire-and-forget — no bloquea
    // la respuesta al cliente si Telegram tarda).
    if (this.handoffNotifier) {
      this.handoffNotifier.notify({
        userId,
        channel:      conv.channel,
        priority,
        reason,
        lastMessages: conv.messages.slice(-5),
      }).catch(err => this.logger.warn(`Handoff notification failed: ${err.message}`));
    }

    // Publish RED handoff inmediato al cerebro — no esperamos el cron de
    // 10 min porque emergencias necesitan razonamiento más rápido. Solo
    // para RED (orange/normal pueden esperar el snapshot agregado).
    // Fire-and-forget, no bloquea.
    if (priority === 'RED' && this.cerebroPublisher) {
      this.cerebroPublisher.publishHandoffOpenedRed({
        conversationId: userId,
        handoffId:      `${userId}-${conv.updatedAt.getTime()}`, // sintético; no hay tabla separada
        priority:       'RED',
        callerInfo:     conv.channel,
      }).catch(err => this.logger.warn(`Cerebro RED publish failed (non-fatal): ${err.message}`));
    }
  }

  async acceptHandoff(userId: string, operatorId: string): Promise<void> {
    const conv = await this.getOrCreate(userId);
    conv.state = 'HUMAN_ACTIVE';
    conv.operatorId = operatorId;
    conv.updatedAt = new Date();

    // Persist to MongoDB
    if (this.mongoRepository) {
      await this.mongoRepository.save(userId, {
        operatorId,
        updatedAt: conv.updatedAt,
      });
    }
  }

  async resolveHandoff(userId: string): Promise<void> {
    const conv = await this.getOrCreate(userId);
    conv.state = 'AI_ACTIVE';
    conv.operatorId = undefined;
    conv.handoffReason = undefined;
    conv.updatedAt = new Date();

    // Persist to MongoDB
    if (this.mongoRepository) {
      await this.mongoRepository.updateStatus(userId, 'resolved');
    }
  }

  async getHandoffQueue(status?: string): Promise<Conversation[]> {
    // First check MongoDB if available
    if (this.mongoRepository) {
      const mongoConvs = await this.mongoRepository.getHandoffQueue(status);
      return mongoConvs.map(mc => ({
        id: `${(mc as any).channel || 'web'}-${mc.userId}-${mc.createdAt.getTime()}`,
        channel: (mc as any).channel || 'web',
        userId: mc.userId,
        state: this.mapMongoStatusToState(mc.status as any),
        priority: (mc.priority as Priority) || 'NORMAL',
        messages: mc.messages as Message[],
        agentGender: (mc as any).agentGender || 'male',
        handoffReason: (mc as any).handoffReason,
        operatorId: (mc as any).operatorId,
        createdAt: mc.createdAt,
        updatedAt: mc.updatedAt,
      }));
    }

    // Fallback to in-memory
    return Array.from(this.conversations.values())
      .filter(c => c.state === 'HANDOFF_REQUESTED')
      .sort((a, b) => {
        const order: Record<Priority, number> = { RED: 0, ORANGE: 1, NORMAL: 2 };
        return order[a.priority] - order[b.priority];
      });
  }

  private mapMongoStatusToState(status: string): ConversationState {
    if (status === 'handoff') return 'HANDOFF_REQUESTED';
    if (status === 'resolved') return 'AI_ACTIVE';
    return 'AI_ACTIVE';
  }

  async getAll(): Promise<Conversation[]> {
    if (this.mongoRepository) {
      const mongoConvs = await this.mongoRepository.getAllActive();
      return mongoConvs.map(mc => ({
        id: `${(mc as any).channel || 'web'}-${mc.userId}-${mc.createdAt.getTime()}`,
        channel: (mc as any).channel || 'web',
        userId: mc.userId,
        state: this.mapMongoStatusToState(mc.status as any),
        priority: (mc.priority as Priority) || 'NORMAL',
        messages: mc.messages as Message[],
        agentGender: (mc as any).agentGender || 'male',
        handoffReason: (mc as any).handoffReason,
        operatorId: (mc as any).operatorId,
        createdAt: mc.createdAt,
        updatedAt: mc.updatedAt,
      }));
    }

    return Array.from(this.conversations.values());
  }

  async buildOperatorContext(userId: string): Promise<string> {
    const conv = this.conversations.get(userId) || (this.mongoRepository ? await this.mongoRepository.getConversation(userId) : null);
    if (!conv) return '';

    const msgs = (conv as any).messages || [];
    const lastMessages = msgs.slice(-6)
      .map((m: any) => `[${m.role.toUpperCase()}]: ${m.content}`)
      .join('\n');
    const channel = (conv as any).channel || 'web';
    const priority = (conv as any).priority || 'NORMAL';
    const handoffReason = (conv as any).handoffReason || 'Solicitado por usuario';
    return `Canal: ${channel} | Prioridad: ${priority}\nMotivo: ${handoffReason}\n\nÚltimos mensajes:\n${lastMessages}`;
  }

  // FIX 9: Clean up old conversations (older than 30 days)
  async cleanupOldConversations(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    // Clean in-memory cache
    const deletedCount = Array.from(this.conversations.entries())
      .filter(([_, conv]) => conv.updatedAt < cutoff)
      .reduce((count, [userId]) => {
        this.conversations.delete(userId);
        return count + 1;
      }, 0);

    // Clean in MongoDB if available
    if (this.mongoRepository) {
      try {
        await (this.mongoRepository as any).deleteOldConversations(cutoff);
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    }

    console.log(`[ConversationService] Cleaned up ${deletedCount} old conversations`);
  }
}
