import { Injectable, Logger } from '@nestjs/common';
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
  ) {}

  /**
   * Snapshot ANTES de ejecutar — el dispatcher lo llama justo antes de
   * dispatch. Retorna un id que después se usa para cerrar la verificación.
   */
  async snapshotBefore(args: {
    decisionId: string;
    entry: AutonomousEntry;
  }): Promise<{ verificationId: string; metricBefore: number }> {
    const metricBefore = await this.measureMetric(args.entry.verify.verifierKey);
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
    const metricAfter = await this.measureMetric(entry.verify.verifierKey);
    const doc = await this.verifModel.findById(verificationId);
    if (!doc) {
      this.logger.warn(`[verify] doc ${verificationId.slice(0, 8)} no encontrado`);
      return;
    }

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
   * Registry de cómo medir cada métrica. Hardcodeado para Fase A.
   * Devuelve un número que el verifier compara antes vs después.
   *
   * Esto vive acá (en orchestrator) y NO en customer-support-service
   * porque queremos que el cerebro verifique INDEPENDIENTEMENTE — sin
   * depender de que el agente reporte correctamente que "hizo cleanup".
   * El cerebro mide la métrica real con sus propios ojos.
   */
  private async measureMetric(key: string): Promise<number> {
    switch (key) {
      case 'pending_red_handoffs':
        // TODO Fase A.1: conectar al Mongo de customer-support (DB
        // 'going-support', col 'conversations'). Por ahora retorna -1
        // como sentinel "no implementado" — el verifier debe saber
        // tratar esto como "no verificable, omitir convergence check".
        //
        // Implementación real:
        //   import { MongoClient } from 'mongodb';
        //   const c = new MongoClient(process.env.CUSTOMER_SUPPORT_MONGO_URL);
        //   await c.connect();
        //   const cnt = await c.db('going-support').collection('conversations')
        //     .countDocuments({
        //       status: 'handoff',
        //       priority: 'RED',
        //       createdAt: { $lt: new Date(Date.now() - 24*60*60*1000) },
        //     });
        //   await c.close();
        //   return cnt;
        return -1;

      default:
        this.logger.warn(`[verify] verifierKey desconocido: ${key}`);
        return -1;
    }
  }
}
