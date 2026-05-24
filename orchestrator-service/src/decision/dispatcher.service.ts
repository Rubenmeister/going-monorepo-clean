import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { RulesEngineService, ActionRule } from './rules-engine.service';
import { safetyMeta } from './safety-levels';
import { AgentOverrideService } from './agent-override.service';
import { DecisionRepository } from '../infrastructure/persistence/decision.repository';
import { AgentBridgeClient } from '../infrastructure/agent-bridge.client';
import { TelegramApprovalService } from '../infrastructure/telegram-approval.service';
import { MycortexClient } from '../infrastructure/mycortex.client';
import { DecisionEntity } from '../infrastructure/schemas/decision.schema';

/**
 * El dispatcher es el corazón del Orchestrator. Para cada intención de
 * MyCortex:
 *
 *   1. Resuelve la regla (RulesEngineService).
 *   2. Si es human_only → persiste 'ignored' + notifica Telegram.
 *   3. Crea Decision en estado proposed.
 *   4. Aplica safety level:
 *        - Cat 1 → ejecuta directo via bridge
 *        - Cat 2 → ejecuta directo via bridge + post-notify
 *        - Cat 3 → estado pending_approval, manda Telegram con timeout
 *   5. Persiste outcome.
 *
 * Si ORCHESTRATOR_EXECUTE_ENABLED=false (default), persiste decisiones
 * en estado 'dormant' sin tocar el bridge — útil durante la semana de
 * observación.
 */
@Injectable()
export class DispatcherService {
  private readonly logger = new Logger(DispatcherService.name);

  constructor(
    private readonly config:    ConfigService,
    private readonly rules:     RulesEngineService,
    private readonly repo:      DecisionRepository,
    private readonly bridge:    AgentBridgeClient,
    private readonly telegram:  TelegramApprovalService,
    private readonly mycortex:  MycortexClient,
    private readonly overrides: AgentOverrideService,
  ) {}

  private get executeEnabled(): boolean {
    return this.config.get<string>('ORCHESTRATOR_EXECUTE_ENABLED') === 'true';
  }

  /**
   * Nivel máximo de safety que se ejecuta automáticamente. Pensado para
   * rollout gradual (Etapa A del roadmap):
   *
   *   - 0 (default) → ningún Cat se ejecuta automáticamente, todo dormant.
   *   - 1           → solo Cat 1 (info-only, log_anomaly). Cat 2/3 dormant.
   *   - 2           → Cat 1 + Cat 2 (reversibles). Cat 3 sigue Telegram-ack.
   *   - 3           → todos los niveles. Cat 3 igual requiere Telegram ack.
   *
   * Cat 3 SIEMPRE requiere ack — este max no lo cambia (su gate es safetyMeta.requiresAck).
   * Lo que sí controla: si Cat 3 entra en pending_approval o queda dormant.
   *
   * Solo aplica cuando executeEnabled=true. Si executeEnabled=false, todo
   * cae a dormant con dormantReason='execute_disabled' (master switch).
   */
  private get maxAutoLevel(): 0 | 1 | 2 | 3 {
    const raw = parseInt(this.config.get<string>('ORCHESTRATOR_MAX_AUTO_LEVEL') || '0', 10);
    if (raw === 1 || raw === 2 || raw === 3) return raw;
    return 0;
  }

  /**
   * Procesa una intención. Devuelve la decisión persistida (con su status
   * final). Idempotente: si la misma intentionId ya tiene decisión, la
   * devuelve sin reprocesar.
   */
  async process(intent: {
    intentionId: string;
    type:        string;
    target?:     string;
    urgency?:    number;
    data?:       Record<string, unknown>;
  }): Promise<DecisionEntity> {
    // 1. Idempotencia
    const existing = await this.repo.findByIntentionId(intent.intentionId);
    if (existing) {
      this.logger.debug(`Intention ${intent.intentionId.slice(0, 8)} ya procesada (status=${existing.status})`);
      return existing;
    }

    // 2. Resolver regla
    const resolved = this.rules.resolve(intent);
    const decisionId = uuidv4();
    const now = new Date();

    // Caso human_only o unresolved → no ejecutar, solo persistir + notificar.
    if (resolved === null || 'humanOnly' in resolved) {
      const reason =
        resolved !== null && 'humanOnly' in resolved
          ? resolved.reason
          : 'unresolved';
      const decision: Partial<DecisionEntity> = {
        decisionId,
        intentionId:     intent.intentionId,
        intentionType:   intent.type,
        intentionUrgency: intent.urgency,
        status:          'ignored',
        humanOnlyReason: reason,
      };
      const created = await this.repo.create(decision);
      await this.telegram.notifyHumanOnly(created.toObject());
      return created.toObject();
    }

    // resolved ahora está narroweado a { action, args }
    const { action, args } = resolved;
    const meta = safetyMeta(action.safetyLevel);

    // 3. Crear Decision base
    const baseDecision: Partial<DecisionEntity> = {
      decisionId,
      intentionId:      intent.intentionId,
      intentionType:    intent.type,
      intentionUrgency: intent.urgency,
      agentId:          action.agent,
      action:           action.action,
      args,
      safetyLevel:      action.safetyLevel,
      status:           'proposed',
    };

    // 4. Modo dormant — master switch off
    if (!this.executeEnabled) {
      baseDecision.status        = 'dormant';
      baseDecision.dormantReason = 'execute_disabled';
      const created = await this.repo.create(baseDecision);
      this.logger.log(
        `[DORMANT/master-off] decision ${decisionId.slice(0, 8)} ${intent.type} → ${action.agent}/${action.action} (Cat ${action.safetyLevel})`,
      );
      return created.toObject();
    }

    // 5. Modo dormant — safety level por encima del max permitido
    //    Pensado para rollout gradual: arrancamos con MAX_AUTO_LEVEL=1, después 2.
    if (action.safetyLevel > this.maxAutoLevel) {
      baseDecision.status        = 'dormant';
      baseDecision.dormantReason = `above_auto_level:${this.maxAutoLevel}`;
      const created = await this.repo.create(baseDecision);
      this.logger.log(
        `[DORMANT/level-gate] decision ${decisionId.slice(0, 8)} Cat ${action.safetyLevel} > MAX_AUTO=${this.maxAutoLevel} — ${intent.type} → ${action.agent}/${action.action}`,
      );
      return created.toObject();
    }

    // 5b. Override granular por agente (audit/UI admin task #31).
    //     Si ops pausó este agente desde la UI, dormant inmediato — no
    //     toca el bridge, no notifica Telegram. La razón se guarda para
    //     que la UI lo distinga de los otros tipos de dormant.
    const isPaused = await this.overrides.isPaused(action.agent);
    if (isPaused) {
      baseDecision.status        = 'dormant';
      baseDecision.dormantReason = 'agent_paused';
      const created = await this.repo.create(baseDecision);
      this.logger.log(
        `[DORMANT/agent-paused] decision ${decisionId.slice(0, 8)} → ${action.agent} pausado por ops — skip ${intent.type}/${action.action}`,
      );
      return created.toObject();
    }

    // 6. Cat 3 — pedir ack y esperar (solo si maxAutoLevel ≥ 3)
    if (meta.requiresAck) {
      baseDecision.status    = 'pending_approval';
      baseDecision.expiresAt = new Date(now.getTime() + meta.ackTimeoutMs);
      const created = await this.repo.create(baseDecision);
      await this.telegram.requestApproval(created.toObject());
      this.logger.log(
        `decision ${decisionId.slice(0, 8)} → pending_approval (Cat 3, timeout ${meta.ackTimeoutMs / 60000}min)`,
      );
      return created.toObject();
    }

    // 7. Cat 1 / Cat 2 — ejecutar directo
    const created = await this.repo.create(baseDecision);
    await this.executeNow(created.toObject(), action);
    return (await this.repo.findById(decisionId)) ?? created.toObject();
  }

  /**
   * Ejecuta una decisión que ya pasó la validación (Cat 1, Cat 2, o Cat 3
   * recién aprobada). Persiste outcome.
   *
   * Después del dispatch, cierra el feedback loop con MyCortex llamando
   * PATCH /mycortex/intentions/:id/outcome. Best-effort: si falla, log y
   * seguir — la decision YA está persistida acá con su outcome real.
   */
  async executeNow(decision: DecisionEntity, rule: ActionRule): Promise<void> {
    await this.repo.updateStatus(decision.decisionId, 'executing');

    const result = await this.bridge.dispatch({
      decisionId: decision.decisionId,
      agentId:    rule.agent,
      action:     rule.action,
      payload:    decision.args ?? {},
    });

    await this.repo.updateStatus(decision.decisionId, 'executed', {
      executedAt:   new Date(),
      outcome:      result.ok ? 'success' : 'failure',
      outcomeData:  result.outcomeData,
      errorMessage: result.error,
    });

    // Cat 2 + Cat 3 → post-notify
    if (safetyMeta(rule.safetyLevel).postNotify) {
      const updated = await this.repo.findById(decision.decisionId);
      if (updated) await this.telegram.notifyExecution(updated);
    }

    // Feedback loop a MyCortex — si la intención existía allá, se actualiza
    // su outcome para que MyCortex lo vea en próximos ciclos. El client
    // maneja errores internamente (best-effort, no rethrow).
    if (decision.intentionId) {
      await this.mycortex.recordOutcome({
        intentionId:     decision.intentionId,
        decisionOutcome: result.ok ? 'success' : 'failure',
        errorMessage:    result.error,
      });
    }
  }
}
