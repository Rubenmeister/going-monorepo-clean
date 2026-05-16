import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebEventDocument, WebEventEntity } from '../schemas/web-event.schema';

@Injectable()
export class WebEventRepository {
  constructor(
    @InjectModel('WebEvent') private readonly model: Model<WebEventDocument>,
  ) {}

  /**
   * Upsert por (appId, dedupKey). Primer hit crea la fila; subsiguientes
   * hits incrementan count + actualizan lastSeen sin tocar firstSeen.
   * Devuelve el doc actualizado.
   */
  async upsert(args: {
    appId:        string;
    errorType:    string;
    message:      string;
    stack?:       string;
    url:          string;
    userAgent?:   string;
    dedupKey:     string;
    sessionId?:   string;
  }): Promise<WebEventDocument> {
    const now = new Date();
    const updated = await this.model.findOneAndUpdate(
      { appId: args.appId, dedupKey: args.dedupKey },
      {
        $setOnInsert: {
          appId:     args.appId,
          dedupKey:  args.dedupKey,
          errorType: args.errorType,
          message:   args.message.slice(0, 500),
          stack:     args.stack?.slice(0, 2000),
          url:       args.url,
          userAgent: args.userAgent?.slice(0, 200),
          firstSeen: now,
        },
        $set: {
          lastSeen:  now,
          // Mantenemos message/stack del primer hit (más info que el último)
          // solo si no estaban — si llega versión más larga, gana
        },
        $inc: { count: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    if (!updated) {
      throw new Error('WebEventRepository.upsert: returned null');
    }
    return updated;
  }

  /**
   * Top errores por appId en una ventana — usado por frontend-agent
   * para incluir los más frecuentes en su world snapshot.
   */
  async topByApp(args: {
    appId?:    string;
    sinceMs:   number;
    limit?:    number;
  }): Promise<WebEventEntity[]> {
    const query: Record<string, unknown> = {
      lastSeen: { $gte: new Date(args.sinceMs) },
    };
    if (args.appId) query.appId = args.appId;
    return this.model
      .find(query)
      .sort({ count: -1, lastSeen: -1 })
      .limit(args.limit ?? 25)
      .lean();
  }

  /** Counts por appId — métricas baratas para snapshot del world model. */
  async countsByApp(sinceMs: number): Promise<Record<string, number>> {
    const since = new Date(sinceMs);
    const agg = await this.model.aggregate([
      { $match: { lastSeen: { $gte: since } } },
      { $group: { _id: '$appId', total: { $sum: '$count' } } },
    ]);
    const out: Record<string, number> = {};
    for (const row of agg) out[row._id] = row.total;
    return out;
  }
}
