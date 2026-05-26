import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConversationEntity, ConversationDocument } from '../schemas/conversation.schema';
import { Conversation } from '../../agent/conversation.service';

@Injectable()
export class MongoConversationRepository {
  constructor(
    @InjectModel('Conversation') private conversationModel: Model<ConversationDocument>
  ) {}

  async getOrCreate(userId: string): Promise<ConversationEntity> {
    let conv = await this.conversationModel.findOne({ userId });
    if (!conv) {
      conv = await this.conversationModel.create({
        userId,
        messages: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return conv;
  }

  async findOne(userId: string): Promise<ConversationEntity | null> {
    return this.conversationModel.findOne({ userId });
  }

  async save(userId: string, conversation: any): Promise<ConversationEntity> {
    return this.conversationModel.findOneAndUpdate(
      { userId },
      {
        ...conversation,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );
  }

  async addMessage(userId: string, role: 'user' | 'assistant', content: string): Promise<void> {
    await this.conversationModel.findOneAndUpdate(
      { userId },
      {
        $push: {
          messages: {
            role,
            content,
            timestamp: new Date(),
          },
        },
        updatedAt: new Date(),
      }
    );
  }

  async updateStatus(userId: string, status: 'active' | 'handoff' | 'resolved'): Promise<void> {
    await this.conversationModel.findOneAndUpdate(
      { userId },
      { status, updatedAt: new Date() }
    );
  }

  /**
   * Marca como 'resolved' todas las conversaciones en estado 'handoff' cuyo
   * updatedAt sea más viejo que `olderThanMs`. Devuelve el número modificado.
   * Usado por el orchestrator (cleanup_handoffs action) cuando MyCortex
   * detecta tickets fantasma de épocas pre-actuales.
   *
   * Conservador: solo toca handoffs que ya estaban estancados (sin operatorId
   * asignado). Si un operador ya está atendiendo, no interferimos.
   */
  async resolveStaleHandoffs(olderThanMs: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanMs);
    const result = await this.conversationModel.updateMany(
      {
        status:    'handoff',
        updatedAt: { $lt: cutoff },
        $or: [
          { operatorId: { $exists: false } },
          { operatorId: null },
          { operatorId: '' },
        ],
      },
      {
        $set: {
          status:        'resolved',
          handoffReason: undefined,
          updatedAt:     new Date(),
        },
      },
    );
    return result.modifiedCount ?? 0;
  }

  async getHandoffQueue(status?: string): Promise<ConversationEntity[]> {
    const query: any = { status: 'handoff' };
    if (status) {
      query.priority = status;
    }
    return this.conversationModel
      .find(query)
      .sort({ createdAt: -1 })
      .lean();
  }

  async getConversation(userId: string): Promise<ConversationEntity | null> {
    return this.conversationModel.findOne({ userId }).lean();
  }

  async getAllActive(): Promise<ConversationEntity[]> {
    return this.conversationModel
      .find({ status: { $in: ['active', 'handoff'] } })
      .sort({ createdAt: -1 })
      .lean();
  }

  // ─── Métricas para el cerebro-service ─────────────────────────────
  //
  // Estos counts son baratos (Mongo cuenta sobre índices status + priority).
  // Los usa MetricsService cada 10 min para componer el snapshot que se
  // publica al cerebro.

  async countByStatus(status: 'active' | 'handoff' | 'resolved'): Promise<number> {
    return this.conversationModel.countDocuments({ status });
  }

  async countHandoffByPriority(priority: 'RED' | 'ORANGE' | 'NORMAL'): Promise<number> {
    return this.conversationModel.countDocuments({ status: 'handoff', priority });
  }

  /** Conversaciones nuevas (createdAt >= since). */
  async countCreatedSince(since: Date): Promise<number> {
    return this.conversationModel.countDocuments({ createdAt: { $gte: since } });
  }

  /** Tickets de handoff abiertos en una ventana — basados en createdAt. */
  async countHandoffsCreatedSince(since: Date): Promise<number> {
    return this.conversationModel.countDocuments({
      status: 'handoff',
      createdAt: { $gte: since },
    });
  }

  /**
   * Aproximación: tickets resueltos en la ventana = status='resolved' y
   * updatedAt >= since. (No tenemos resolvedAt explícito; el updateStatus
   * actualiza updatedAt cuando el operador cierra el handoff.)
   */
  async countResolvedSince(since: Date): Promise<number> {
    return this.conversationModel.countDocuments({
      status: 'resolved',
      updatedAt: { $gte: since },
    });
  }

  /**
   * Cerebro Fase B — métrica para ActionVerifier del orchestrator.
   * Cuenta conversations status='handoff' + priority='RED' + sin asignar
   * operador, más viejas que `olderThanH` horas. Es la métrica que el
   * cleanup_stale_customer_handoffs debe reducir.
   */
  async countRedHandoffsOlderThan(olderThanH: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanH * 3600 * 1000);
    return this.conversationModel.countDocuments({
      status: 'handoff',
      priority: 'RED',
      createdAt: { $lt: cutoff },
      $or: [
        { operatorId: { $exists: false } },
        { operatorId: null },
        { operatorId: '' },
      ],
    });
  }

  /**
   * Edad de la handoff RED/ORANGE más vieja sin atender (status=handoff).
   * Devuelve el `createdAt` o null si la cola está limpia.
   */
  async oldestHandoffByPriority(priority: 'RED' | 'ORANGE' | 'NORMAL'): Promise<Date | null> {
    const doc = await this.conversationModel
      .findOne({ status: 'handoff', priority })
      .sort({ createdAt: 1 })
      .select('createdAt')
      .lean();
    return doc?.createdAt ?? null;
  }
}
