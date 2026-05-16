import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WorldSnapshotRepository } from '../infrastructure/persistence/world-snapshot.repository';
import { TelegramAlertService } from '../infrastructure/telegram-alert.service';

/**
 * Detector de transiciones en la salud del Cerebro — Telegram early warning.
 *
 * Diseño:
 *   - @Cron cada 10 min: lee último snapshot, compara con state previo
 *     in-memory, dispara alerta SOLO en transición (no spam cada ciclo).
 *   - Alertas detectadas:
 *       a) systemHealth degrado/critical → alert con detalle de qué cambió
 *       b) Cualquier agent supera su threshold STALE
 *       c) Snapshot generation freezing (> 30 min sin generar uno nuevo)
 *   - Recovery: cuando un alert activo "se resuelve" (e.g. el agent vuelve
 *     a publicar dentro de ventana), manda "✅ resuelto".
 *
 * State in-memory:
 *   - activeAlerts: Set<string> con los IDs de alerts encendidos.
 *   - Restart pierde state → posible re-alert en startup. Aceptable.
 *
 * No throws — best-effort. Si Telegram falla, log y seguir. Si el cron del
 * world model freeza, este monitor SÍ debe alertar (lectura directa del
 * Mongo snapshot, no depende del world model service en runtime).
 */
@Injectable()
export class HealthMonitorService {
  private readonly logger = new Logger(HealthMonitorService.name);

  /** Alerts activos por ID. Reset al restart del container. */
  private readonly activeAlerts = new Set<string>();

  /** Para "ya envié bienvenida"; evita un spam masivo al startup. */
  private hasSentStartupBanner = false;

  // Thresholds de stale alineados con world-model.service.ts. Si cambian
  // allá, recordá actualizar acá también (TODO: extraer a un módulo compartido).
  private readonly STALE_THRESHOLDS_MIN: Record<string, number> = {
    'ops-agent':                60,
    'financial-agent':          60 * 8,
    'content-agent':            60 * 24 * 8,
    'marketing-agent':          60 * 24 * 8,
    'going-agent':              60 * 24,
    'customer-support-service': 40,
    'mobile-agent':             60 * 24,
    'frontend-agent':           60 * 24,
  };

  /** Si pasó este tiempo sin un snapshot nuevo, alarmar. */
  private readonly SNAPSHOT_STALE_MIN = 30;

  constructor(
    private readonly config:    ConfigService,
    private readonly snapshots: WorldSnapshotRepository,
    private readonly telegram:  TelegramAlertService,
  ) {}

  /**
   * Toggle: CEREBRO_HEALTH_ALERTS_ENABLED=false desactiva todo. Default true.
   * Útil para silenciar durante windows de mantenimiento.
   */
  private isEnabled(): boolean {
    return this.config.get<string>('CEREBRO_HEALTH_ALERTS_ENABLED') !== 'false';
  }

  @Cron(CronExpression.EVERY_10_MINUTES, { name: 'cerebro-health-monitor' })
  async check(): Promise<void> {
    if (!this.isEnabled()) return;

    let snapshot;
    try {
      snapshot = await this.snapshots.latest();
    } catch (e) {
      this.logger.warn(`No se pudo leer snapshot: ${(e as Error).message}`);
      return;
    }
    if (!snapshot) {
      // No hay snapshots aún — primera vida del cerebro. No alarmar.
      return;
    }

    // ── Evaluar cada condición ──────────────────────────
    const transitions = this.evaluate(snapshot);

    // ── Banner inicial (solo 1 vez por restart) ──────────
    if (!this.hasSentStartupBanner) {
      this.hasSentStartupBanner = true;
      const activeCount = this.activeAlerts.size;
      this.logger.log(
        `Health monitor armado. State inicial: ${activeCount} alerts activos.`,
      );
    }

    // ── Dispatch ────────────────────────────────────────
    for (const t of transitions) {
      try {
        await this.telegram.send(t.message);
        this.logger.log(`[health-alert] ${t.kind}: ${t.id}`);
      } catch (e) {
        this.logger.warn(`Telegram send falló: ${(e as Error).message}`);
      }
    }
  }

  /**
   * Compara el snapshot con activeAlerts state y devuelve los mensajes a
   * enviar. Actualiza activeAlerts in-place. Mensajes ya formateados.
   */
  private evaluate(snapshot: any): Array<{ id: string; kind: 'new' | 'resolved'; message: string }> {
    const now = Date.now();
    const transitions: Array<{ id: string; kind: 'new' | 'resolved'; message: string }> = [];
    const stillActive = new Set<string>();

    // ── 1. Snapshot freshness ─────────────────────────────
    const snapAge = (now - new Date(snapshot.generatedAt).getTime()) / 60_000;
    if (snapAge > this.SNAPSHOT_STALE_MIN) {
      const id = 'snapshot:stale';
      stillActive.add(id);
      if (!this.activeAlerts.has(id)) {
        transitions.push({
          id,
          kind: 'new',
          message:
            `🚨 *Cerebro snapshot stale*\n\n` +
            `El último world snapshot fue generado hace ${snapAge.toFixed(0)} min ` +
            `(threshold: ${this.SNAPSHOT_STALE_MIN} min).\n\n` +
            `Probable causa: WorldModelService @Cron está stuck o cerebro-service ` +
            `escaló a zero. Revisar logs de cerebro-service.`,
        });
      }
    }

    // ── 2. systemHealth degraded/critical ────────────────
    if (snapshot.systemHealth === 'critical' || snapshot.systemHealth === 'degraded') {
      const id = `systemHealth:${snapshot.systemHealth}`;
      stillActive.add(id);
      if (!this.activeAlerts.has(id)) {
        const emoji = snapshot.systemHealth === 'critical' ? '🚨' : '⚠️';
        const critCount = snapshot.totalCriticalAnomalies ?? 0;
        const warnCount = snapshot.totalWarnings ?? 0;
        transitions.push({
          id,
          kind: 'new',
          message:
            `${emoji} *Cerebro: systemHealth = ${snapshot.systemHealth}*\n\n` +
            `Críticas: ${critCount} · Warnings: ${warnCount}\n\n` +
            `Ver detalle: https://admin.goingec.com/cerebro/health`,
        });
      }
    }

    // ── 3. Agents stale ──────────────────────────────────
    for (const a of snapshot.agents ?? []) {
      const threshold = this.STALE_THRESHOLDS_MIN[a.agentId];
      if (!threshold) continue;
      if (!a.lastRunAt) continue; // sin datos no es stale, es "no arrancó"
      if (a.ageMinutes > threshold) {
        const id = `agent:stale:${a.agentId}`;
        stillActive.add(id);
        if (!this.activeAlerts.has(id)) {
          transitions.push({
            id,
            kind: 'new',
            message:
              `⚠️ *Agent stale: ${a.agentId}*\n\n` +
              `Último publish: hace ${a.ageMinutes} min (threshold: ${threshold} min, ` +
              `${(a.ageMinutes / threshold).toFixed(1)}× sobre).\n\n` +
              `Probable causa: env var CEREBRO_PUBLISH_ENABLED perdida, cron stuck, ` +
              `o el agent está fallando silenciosamente.\n\n` +
              `Diagnóstico: \`gcloud run jobs|services describe ${a.agentId}\``,
          });
        }
      }
    }

    // ── 4. Resolved transitions (alert estaba activo → ya no) ─────
    for (const prevId of this.activeAlerts) {
      if (!stillActive.has(prevId)) {
        transitions.push({
          id: prevId,
          kind: 'resolved',
          message: `✅ *Cerebro alert resuelto: ${prevId}*\n\nVolvió a estado normal.`,
        });
      }
    }

    // Update state
    this.activeAlerts.clear();
    for (const id of stillActive) this.activeAlerts.add(id);

    return transitions;
  }
}
