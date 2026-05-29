import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AutonomousEntry } from './autonomous-allowlist';
import {
  ActionVerification,
  ActionVerificationDocument,
} from '../infrastructure/schemas/action-verification.schema';

/**
 * Servicio de verificación post-acción para Fase A del cerebro autónomo.
 *
 * Flujo:
 *   1. Dispatcher ejecuta una acción que está en la allowlist.
 *   2. Llama a `scheduleVerification` con la entry de allowlist.
 *   3. Tras `entry.verify.waitMs`, mide la métrica (`verifierKey`).
 *   4. Compara contra el snapshot pre-acción.
 *   5. Si no convergió → alerta (o rollback, según entry.onVerifyFail).
 *   6. Persiste todo en `action_verifications` para auditoría.
 *
 * Las métricas concretas (cómo se cuenta "pending_red_handoffs", etc.)
 * viven en este servicio porque dependen del agente target. Por ahora
 * hardcodeadas. Si crece, refactorizar a un registry inyectable.
 */
@Injectable()
export class ActionVerifierService {
  private readonly logger = new Logger(ActionVerifierService.name);

  constructor(
    @InjectModel(ActionVerification.name)
    private readonly verifModel: Model<ActionVerificationDocument>,
    private readonly config: ConfigService,
  ) {}

  /**
   * Snapshot ANTES de ejecutar — el dispatcher lo llama justo antes de
   * dispatch. Retorna un id que después se usa para cerrar la verificación.
   */
  async snapshotBefore(args: {
    decisionId: string;
    entry: AutonomousEntry;
    /**
     * Contexto opcional del verifier — args del intent que la métrica
     * necesita para consultar el target específico (ej. `{ target: '+593...' }`
     * para block_voice_caller). Si la métrica es global (ej. pending_red_handoffs)
     * se omite.
     */
    verifierContext?: Record<string, unknown>;
  }): Promise<{ verificationId: string; metricBefore: number }> {
    const metricBefore = await this.measureMetric(
      args.entry.verify.verifierKey,
      args.verifierContext,
    );
    const doc = await this.verifModel.create({
      decisionId: args.decisionId,
      intentType: args.entry.intentType,
      verifierKey: args.entry.verify.verifierKey,
      direction: args.entry.verify.direction,
      minDelta: args.entry.verify.minDelta,
      metricBefore,
      metricBeforeAt: new Date(),
      status: 'pending_verification',
      onVerifyFail: args.entry.onVerifyFail,
      verifierContext: args.verifierContext,
    });
    return { verificationId: doc.id.toString(), metricBefore };
  }

  /**
   * Programa la verificación post-acción. El dispatcher la llama después
   * de un dispatch exitoso. Usa `setTimeout` deliberadamente — para
   * waitMs cortos (≤ 5 min) es suficiente y no necesitamos una cola.
   *
   * Si la API se reinicia antes del timeout, perdemos el callback. En
   * producción habría que mover a una cola persistente (BullMQ/Cloud
   * Tasks). Para Fase A es aceptable: el peor caso es "no se verificó
   * automáticamente", que el operador puede revisar manualmente desde el
   * admin dashboard mirando `action_verifications` collection.
   */
  scheduleVerification(args: {
    verificationId: string;
    entry: AutonomousEntry;
  }): void {
    const { verificationId, entry } = args;
    this.logger.log(
      `[verify] decision verificación id=${verificationId.slice(0, 8)} en ${entry.verify.waitMs}ms`,
    );

    setTimeout(() => {
      // Fire-and-forget — el doc en Mongo es la fuente de verdad si esto
      // se cae a mitad de camino.
      this.runVerification(verificationId, entry).catch((e) => {
        this.logger.error(
          `[verify] verificación ${verificationId.slice(0, 8)} falló: ${e.message}`,
        );
      });
    }, entry.verify.waitMs);
  }

  private async runVerification(
    verificationId: string,
    entry: AutonomousEntry,
  ): Promise<void> {
    const doc = await this.verifModel.findById(verificationId);
    if (!doc) {
      this.logger.warn(`[verify] doc ${verificationId.slice(0, 8)} no encontrado`);
      return;
    }

    // Re-leemos el verifierContext desde el doc para asegurar consistencia
    // (snapshotBefore lo persistió, runVerification lo lee). Esto blinda el
    // caso de restart entre dispatch y verify — el contexto sobrevive en Mongo.
    const metricAfter = await this.measureMetric(
      entry.verify.verifierKey,
      doc.verifierContext as Record<string, unknown> | undefined,
    );

    const delta = metricAfter - doc.metricBefore;
    const converged =
      entry.verify.direction === 'decrease'
        ? delta <= -entry.verify.minDelta
        : delta >= entry.verify.minDelta;

    doc.metricAfter = metricAfter;
    doc.metricAfterAt = new Date();
    doc.delta = delta;
    doc.converged = converged;
    doc.status = converged ? 'converged' : 'failed_to_converge';
    await doc.save();

    if (converged) {
      this.logger.log(
        `[verify] OK decision ${doc.decisionId.slice(0, 8)} ${entry.intentType} ` +
          `metric ${doc.metricBefore} → ${metricAfter} (Δ=${delta}, dir=${entry.verify.direction})`,
      );
      return;
    }

    // No convergió. Acción según onVerifyFail.
    this.logger.warn(
      `[verify] FAILED decision ${doc.decisionId.slice(0, 8)} ${entry.intentType} ` +
        `no convergió: metric ${doc.metricBefore} → ${metricAfter} ` +
        `(Δ=${delta}, esperaba ${entry.verify.direction} ≥ ${entry.verify.minDelta})`,
    );

    // TODO Fase A.2: si entry.onVerifyFail === 'rollback', invocar
    // entry.rollback.agentId/action vía agent-bridge. Para v1 solo
    // emitimos un log + se persiste status='failed_to_converge'. El
    // operador lo ve en el dashboard y decide rollback manual.
    //
    // TODO Fase A.3: notificar a Telegram con el detalle del fail. Hoy
    // el log queda solo en Cloud Run logs. Una vez que tengamos
    // confianza en el verifier (zero false positives), conectar al
    // canal de ops.
  }

  /**
   * Registry de cómo medir cada métrica. Las llamadas van por HTTP a
   * endpoints admin de los agents para mantener la separación de bounded
   * contexts (el orchestrator no toca Mongos ajenas).
   *
   * Fallback: si HTTP falla o el endpoint no responde, retorna -1
   * (sentinel "no medible"). El verifier marca status='failed_to_converge'
   * y persiste el error — el operador lo ve en el dashboard.
   *
   * Por qué medir desde orchestrator vs delegar al agent: queremos que
   * el cerebro verifique INDEPENDIENTEMENTE — sin depender de que el
   * agente reporte correctamente "hice cleanup". El cerebro mide con
   * sus propios ojos contra el endpoint admin.
   */
  private async measureMetric(
    key: string,
    context?: Record<string, unknown>,
  ): Promise<number> {
    switch (key) {
      case 'pending_red_handoffs':
        // Métrica global, no requiere context.
        return this.fetchCustomerSupportMetric('pending-red-handoffs', 24);

      case 'active_voice_block_for_caller': {
        // Métrica granular: cuántos blocks activos hay para el caller del intent.
        // context.target = '+593...' (E.164). Si no viene, no podemos medir.
        const target = typeof context?.target === 'string' ? context.target : null;
        if (!target) {
          this.logger.warn(
            `[verify] active_voice_block_for_caller sin context.target — skipping`,
          );
          return -1;
        }
        return this.fetchVoiceMetric('active-blocks', { from: target });
      }

      default:
        this.logger.warn(`[verify] verifierKey desconocido: ${key}`);
        return -1;
    }
  }

  /**
   * Fetch a customer-support-service /support/metrics/:path?olderThanH=X.
   * Auth: X-Internal-Token (mismo secret que el dispatcher usa para
   * llamar al agent-bridge). Timeout 5s — la verificación corre en
   * background así que no es crítico.
   */
  private async fetchCustomerSupportMetric(
    metricPath: string,
    olderThanH: number,
  ): Promise<number> {
    const base = this.config.get<string>('CUSTOMER_SUPPORT_SERVICE_URL');
    const token = this.config.get<string>('INTERNAL_SERVICE_TOKEN');
    if (!base) {
      this.logger.warn(
        '[verify] CUSTOMER_SUPPORT_SERVICE_URL no configurado — métrica no medible',
      );
      return -1;
    }
    if (!token) {
      this.logger.warn(
        '[verify] INTERNAL_SERVICE_TOKEN no configurado — sin auth, no medimos',
      );
      return -1;
    }
    const url = `${base.replace(/\/$/, '')}/support/metrics/${metricPath}?olderThanH=${olderThanH}`;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'x-internal-token': token },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        this.logger.warn(
          `[verify] customer-support metric HTTP ${res.status} en ${url}`,
        );
        return -1;
      }
      const data = (await res.json()) as { count?: number };
      if (typeof data.count !== 'number') {
        this.logger.warn(`[verify] customer-support response sin count: ${JSON.stringify(data).slice(0, 80)}`);
        return -1;
      }
      return data.count;
    } catch (e) {
      this.logger.warn(
        `[verify] customer-support metric fallo: ${(e as Error).message}`,
      );
      return -1;
    }
  }

  /**
   * Fetch a voice-call-service `/voice/metrics/:metricPath?<params>`.
   *
   * Auth: header `Authorization: Bearer <INTERNAL_SERVICE_TOKEN>` (mismo
   * token compartido entre orchestrator y los agents). Distinto del
   * `x-internal-token` que usa customer-support — voice-call-service
   * implementa el patrón Bearer estándar.
   *
   * Convención de response: `{ count: number, ... }`. El verifier solo
   * lee `count` y descarta el resto. Si la response no tiene `count`,
   * lo trata como -1 (no medible).
   *
   * Timeout 5s, fire-and-forget si falla.
   */
  private async fetchVoiceMetric(
    metricPath: string,
    params: Record<string, string>,
  ): Promise<number> {
    const base = this.config.get<string>('VOICE_CALL_SERVICE_URL');
    const token = this.config.get<string>('INTERNAL_SERVICE_TOKEN');
    if (!base) {
      this.logger.warn(
        '[verify] VOICE_CALL_SERVICE_URL no configurado — métrica no medible',
      );
      return -1;
    }
    if (!token) {
      this.logger.warn(
        '[verify] INTERNAL_SERVICE_TOKEN no configurado — sin auth, no medimos',
      );
      return -1;
    }
    const qs = new URLSearchParams(params).toString();
    const url = `${base.replace(/\/$/, '')}/voice/metrics/${metricPath}?${qs}`;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        this.logger.warn(
          `[verify] voice metric HTTP ${res.status} en ${url}`,
        );
        return -1;
      }
      const data = (await res.json()) as { count?: number };
      if (typeof data.count !== 'number') {
        this.logger.warn(`[verify] voice response sin count: ${JSON.stringify(data).slice(0, 80)}`);
        return -1;
      }
      return data.count;
    } catch (e) {
      this.logger.warn(
        `[verify] voice metric fallo: ${(e as Error).message}`,
      );
      return -1;
    }
  }
}
