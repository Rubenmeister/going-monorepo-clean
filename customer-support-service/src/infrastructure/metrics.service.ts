import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoConversationRepository } from './persistence/mongo-conversation.repository';

/**
 * Snapshot de métricas que se publica al cerebro y también se sirve por
 * GET /support/metrics. El shape es plano y serializable a propósito —
 * va dentro del campo `metrics` de un AgentRunEvent (Record<string, number|string>).
 */
export interface SupportMetricsSnapshot {
  // Estado actual de la cola
  activeConversations:    number;
  pendingHandoffs:        number;
  resolvedConversations:  number;
  pendingHandoffsRed:     number;
  pendingHandoffsOrange:  number;
  pendingHandoffsNormal:  number;

  // Salud operativa
  oldestRedHandoffAgeMinutes:    number;  // 0 si no hay
  oldestOrangeHandoffAgeMinutes: number;

  // Última ventana (default 10 min — el cron del cerebro publisher)
  windowMinutes:               number;
  conversationsCreatedInWindow: number;
  handoffsCreatedInWindow:     number;
  resolutionsInWindow:         number;

  // Configuración
  operatorsConfigured: number;  // count de OPERATOR_TELEGRAM_CHAT_IDS

  generatedAt: string;          // ISO
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    private readonly repo: MongoConversationRepository,
    private readonly config: ConfigService,
  ) {}

  private operatorsConfigured(): number {
    const raw = this.config.get<string>('OPERATOR_TELEGRAM_CHAT_IDS') ?? '';
    return raw.split(',').map(s => s.trim()).filter(Boolean).length;
  }

  /**
   * Construye un snapshot completo. Las queries en paralelo — el conteo
   * por priority + status hace 6 round-trips a Mongo, pero todos contra
   * índices y muy rápido (<200ms en cluster M10).
   *
   * @param windowMinutes ventana hacia atrás para los counters "InWindow".
   *   Default 10 (alineado con el cron del CerebroPublisher).
   */
  async snapshot(windowMinutes = 10): Promise<SupportMetricsSnapshot> {
    const now    = new Date();
    const since  = new Date(now.getTime() - windowMinutes * 60 * 1000);

    const [
      activeConversations,
      pendingHandoffs,
      resolvedConversations,
      pendingHandoffsRed,
      pendingHandoffsOrange,
      pendingHandoffsNormal,
      oldestRed,
      oldestOrange,
      conversationsCreatedInWindow,
      handoffsCreatedInWindow,
      resolutionsInWindow,
    ] = await Promise.all([
      this.repo.countByStatus('active'),
      this.repo.countByStatus('handoff'),
      this.repo.countByStatus('resolved'),
      this.repo.countHandoffByPriority('RED'),
      this.repo.countHandoffByPriority('ORANGE'),
      this.repo.countHandoffByPriority('NORMAL'),
      this.repo.oldestHandoffByPriority('RED'),
      this.repo.oldestHandoffByPriority('ORANGE'),
      this.repo.countCreatedSince(since),
      this.repo.countHandoffsCreatedSince(since),
      this.repo.countResolvedSince(since),
    ]);

    const minutesSince = (d: Date | null): number =>
      d ? Math.floor((now.getTime() - d.getTime()) / 60000) : 0;

    return {
      activeConversations,
      pendingHandoffs,
      resolvedConversations,
      pendingHandoffsRed,
      pendingHandoffsOrange,
      pendingHandoffsNormal,
      oldestRedHandoffAgeMinutes:    minutesSince(oldestRed),
      oldestOrangeHandoffAgeMinutes: minutesSince(oldestOrange),
      windowMinutes,
      conversationsCreatedInWindow,
      handoffsCreatedInWindow,
      resolutionsInWindow,
      operatorsConfigured: this.operatorsConfigured(),
      generatedAt: now.toISOString(),
    };
  }
}
