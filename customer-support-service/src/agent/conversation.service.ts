import { Injectable } from '@nestjs/common';

export type ConversationState = 'AI_ACTIVE' | 'HANDOFF_REQUESTED' | 'HUMAN_ACTIVE';
export type Priority = 'RED' | 'ORANGE' | 'NORMAL';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  channel: 'whatsapp' | 'web';
  userId: string;       // phone number or user ID
  state: ConversationState;
  priority: Priority;
  messages: Message[];
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
  // In-memory store — replace with Redis for production
  private conversations = new Map<string, Conversation>();

  getOrCreate(userId: string, channel: 'whatsapp' | 'web' = 'whatsapp'): Conversation {
    if (!this.conversations.has(userId)) {
      const conv: Conversation = {
        id: `${channel}-${userId}-${Date.now()}`,
        channel,
        userId,
        state: 'AI_ACTIVE',
        priority: 'NORMAL',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.conversations.set(userId, conv);
    }
    return this.conversations.get(userId)!;
  }

  addMessage(userId: string, role: 'user' | 'assistant', content: string): void {
    const conv = this.getOrCreate(userId);
    conv.messages.push({ role, content, timestamp: new Date() });
    conv.updatedAt = new Date();
    // Keep last 20 messages to avoid exceeding context
    if (conv.messages.length > 20) {
      conv.messages = conv.messages.slice(-20);
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

  requestHandoff(userId: string, reason: string, priority: Priority): void {
    const conv = this.getOrCreate(userId);
    conv.state = 'HANDOFF_REQUESTED';
    conv.priority = priority;
    conv.handoffReason = reason;
    conv.updatedAt = new Date();
  }

  acceptHandoff(userId: string, operatorId: string): void {
    const conv = this.getOrCreate(userId);
    conv.state = 'HUMAN_ACTIVE';
    conv.operatorId = operatorId;
    conv.updatedAt = new Date();
  }

  resolveHandoff(userId: string): void {
    const conv = this.getOrCreate(userId);
    conv.state = 'AI_ACTIVE';
    conv.operatorId = undefined;
    conv.handoffReason = undefined;
    conv.updatedAt = new Date();
  }

  getHandoffQueue(): Conversation[] {
    return Array.from(this.conversations.values())
      .filter(c => c.state === 'HANDOFF_REQUESTED')
      .sort((a, b) => {
        const order: Record<Priority, number> = { RED: 0, ORANGE: 1, NORMAL: 2 };
        return order[a.priority] - order[b.priority];
      });
  }

  getAll(): Conversation[] {
    return Array.from(this.conversations.values());
  }

  buildOperatorContext(userId: string): string {
    const conv = this.conversations.get(userId);
    if (!conv) return '';
    const lastMessages = conv.messages.slice(-6)
      .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
      .join('\n');
    return `Canal: ${conv.channel} | Prioridad: ${conv.priority}\nMotivo: ${conv.handoffReason || 'Solicitado por usuario'}\n\nÚltimos mensajes:\n${lastMessages}`;
  }
}
