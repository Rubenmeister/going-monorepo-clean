import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import { WorldSnapshotClient } from './world-snapshot.client';
import { AnthropicClient } from './anthropic.client';
import { PromptBuilderService } from './prompt-builder.service';
import { IntentionsParserService } from './intentions-parser.service';
import { TelegramReporterService } from './telegram-reporter.service';
import { IntentionRepository } from '../infrastructure/persistence/intention.repository';

/**
 * Loop principal de MyCortex.
 *
 * Cada 30 min:
 *   1. Expira intenciones viejas (cleanup de la tabla).
 *   2. Trae el world snapshot del cerebro-service.
 *   3. Trae las últimas N intenciones recientes (para que el modelo tenga
 *      contexto histórico — calibra y aprende implícitamente).
 *   4. Construye el prompt y llama a Claude.
 *   5. Parsea el output (Zod), persiste, reporta a Telegram.
 *
 * Toda la operación bajo guard MYCORTEX_REASONING_ENABLED — si false,
 * el cron logea pero no llama Claude (evita gasto durante deploys de prueba).
 */
@Injectable()
export class ReasoningLoopService implements OnModuleInit {
  private readonly logger = new Logger(ReasoningLoopService.name);

  constructor(
    private readonly config:   ConfigService,
    private readonly snapshot: WorldSnapshotClient,
    private readonly anthropic: AnthropicClient,
    private readonly prompt:   PromptBuilderService,
    private readonly parser:   IntentionsParserService,
    private readonly reporter: TelegramReporterService,
    private readonly repo:     IntentionRepository,
  ) {}

  onModuleInit() {
    const enabled = this.isEnabled();
    this.logger.log(
      `MyCortex reasoning loop ${enabled ? 'ENABLED ✅' : 'DISABLED ⏸️ (set MYCORTEX_REASONING_ENABLED=true para activar)'}`,
    );
  }

  private isEnabled(): boolean {
    return this.config.get<string>('MYCORTEX_REASONING_ENABLED') === 'true';
  }

  /**
   * @Cron usa expresión hardcoded EVERY_30_MINUTES — alineado con el cron
   * más lento del sistema (financial-agent corre cada 30 min algunos días),
   * así MyCortex siempre razona DESPUÉS de que los agentes publican.
   */
  @Cron(CronExpression.EVERY_30_MINUTES, { name: 'mycortex-reasoning' })
  async runScheduled(): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug('MYCORTEX_REASONING_ENABLED!=true — saltando ciclo');
      return;
    }
    await this.runOnce();
  }

  /**
   * Una iteración completa del razonamiento. Expuesto público para que el
   * controller pueda invocarlo on-demand vía POST /mycortex/run-now.
   */
  async runOnce(): Promise<{
    cycleId:        string;
    intentionsCount: number;
    reasoning:      string;
    error?:         string;
  }> {
    const cycleId = uuidv4();
    this.logger.log(`🧠 Ciclo ${cycleId} iniciando...`);

    // 1. Expirar viejas
    try {
      const expired = await this.repo.expirePast();
      if (expired > 0) this.logger.log(`Expiré ${expired} intención(es) vieja(s)`);
    } catch (e) {
      this.logger.warn(`Error expirando intenciones viejas: ${(e as Error).message}`);
    }

    // 2. Snapshot del cerebro
    let snapshot;
    try {
      snapshot = await this.snapshot.fetchLatest();
    } catch (e) {
      const err = (e as Error).message;
      this.logger.error(`No se pudo obtener world snapshot: ${err}`);
      return { cycleId, intentionsCount: 0, reasoning: '', error: err };
    }

    // 3. Memoria reciente (últimas 24h, top 20 ordenadas)
    const recentIntentions = await this.repo.recent(20).catch(() => []);

    // 4. Prompt + Claude
    const systemPrompt = this.prompt.buildSystemPrompt();
    const userPrompt = this.prompt.buildUserPrompt({
      snapshot,
      recentIntentions,
      nowIso: new Date().toISOString(),
    });

    let modelResponse;
    try {
      modelResponse = await this.anthropic.reason({
        systemPrompt,
        userPrompt,
        maxTokens: 2500,
      });
    } catch (e) {
      const err = (e as Error).message;
      this.logger.error(`Claude call falló: ${err}`);
      return { cycleId, intentionsCount: 0, reasoning: '', error: err };
    }

    // 5. Parsear, persistir, reportar
    const { reasoning, intentions } = this.parser.parse(modelResponse.text);
    this.logger.log(
      `Modelo propuso ${intentions.length} intención(es) (reasoning len=${reasoning.length})`,
    );

    if (intentions.length > 0) {
      try {
        await this.repo.saveMany(
          intentions.map(i => ({
            intentionId: uuidv4(),
            cycleId,
            type:        i.type,
            urgency:     i.urgency,
            target:      i.target,
            reason:      i.reason,
            suggestedAction: i.suggestedAction,
            expiresAt:   i.expiresAt ? new Date(i.expiresAt) : undefined,
            data:        i.data,
            modelUsed:   modelResponse.model,
            worldSnapshotGeneratedAt: new Date(snapshot.generatedAt).getTime(),
            acknowledgedAt: undefined,
            acknowledgedBy: undefined,
            outcomeNotes:   undefined,
            outcomeRecordedAt: undefined,
          })),
        );
      } catch (e) {
        this.logger.error(`Error persistiendo intenciones: ${(e as Error).message}`);
      }
    }

    // Reporte Telegram (incluso si intentions=[] — Ruben quiere ver que el ciclo corrió)
    await this.reporter.report({
      cycleId,
      snapshot,
      intentions,
      reasoning,
      model:    modelResponse.model,
      tokensIn:  modelResponse.tokensIn,
      tokensOut: modelResponse.tokensOut,
    });

    this.logger.log(`✅ Ciclo ${cycleId} completado — ${intentions.length} intención(es)`);
    return { cycleId, intentionsCount: intentions.length, reasoning };
  }
}
