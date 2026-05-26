import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DriverDocumentModel,
  DriverDocumentDocument,
  computeDriverCompliance,
} from '../infrastructure/persistence/schemas/driver-document.schema';

/**
 * DriverComplianceCronService — barre diariamente los DriverDocuments
 * vigentes y marca los expirados, además de loguear avisos de vencimientos
 * próximos (30 días, 7 días, hoy).
 *
 * Phase B del Driver Compliance System:
 *   - Cron diario @ 03:00 UTC (~22:00 EC del día anterior, off-peak)
 *   - Query: docs con status=approved + expiresAt < now+30d
 *   - Buckets:
 *       expiringSoon30  : 30d > daysLeft >= 7 → log info (Fase B.1: email warning)
 *       expiringSoon7   : 7d > daysLeft >= 0  → log warn  (Fase B.1: email + push urgent)
 *       expired         : daysLeft < 0        → update status=expired
 *   - Para cada driver que pierda compliance verified hoy, log estructurado.
 *     (La SUSPENSION efectiva del driver se hace via gate en matching engine
 *      en Fase D — este cron NO toca el User en user-auth-service para no
 *      cruzar boundary entre servicios.)
 *
 * Env toggle:
 *   COMPLIANCE_CRON_ENABLED   default 'true' (opt-out por seguridad)
 *
 * Concurrency: multi-pod safe — los updates a 'expired' son idempotentes
 * (segunda corrida no encuentra los mismos docs porque ya cambiaron status).
 */
@Injectable()
export class DriverComplianceCronService {
  private readonly logger = new Logger(DriverComplianceCronService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectModel(DriverDocumentModel.name)
    private readonly docModel: Model<DriverDocumentDocument>,
  ) {}

  private isEnabled(): boolean {
    return this.config.get<string>('COMPLIANCE_CRON_ENABLED') !== 'false';
  }

  /**
   * Cron principal: 03:00 UTC daily (10 PM EC del día anterior, off-peak).
   * Escanea, marca expirados, loguea próximos vencimientos.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'driver-compliance-scan' })
  async scanComplianceExpiry(): Promise<void> {
    if (!this.isEnabled()) return;

    const t0 = Date.now();
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Solo trae docs aprobados con expiración cercana (incluye ya vencidos)
    const docs = await this.docModel
      .find({
        status: 'approved',
        expiresAt: { $ne: null, $lt: in30Days },
      })
      .lean();

    if (docs.length === 0) {
      this.logger.log(`[compliance] sin docs por vencer en 30d · dt=${Date.now() - t0}ms`);
      return;
    }

    // ── Clasificar por bucket ─────────────────────────────────────
    const expired: DriverDocumentModel[] = [];
    const expiring7: DriverDocumentModel[] = [];
    const expiring30: DriverDocumentModel[] = [];
    const affectedDrivers = new Set<string>();

    for (const doc of docs) {
      if (!doc.expiresAt) continue;
      const exp = new Date(doc.expiresAt);
      if (exp < now) {
        expired.push(doc as DriverDocumentModel);
        affectedDrivers.add(doc.driverId);
      } else if (exp < in7Days) {
        expiring7.push(doc as DriverDocumentModel);
      } else if (exp < in30Days) {
        expiring30.push(doc as DriverDocumentModel);
      }
    }

    // ── Acción 1: marcar como expired los ya vencidos ─────────────
    let markedExpired = 0;
    for (const doc of expired) {
      const docId = (doc as any)._id;
      try {
        await this.docModel.updateOne(
          { _id: docId, status: 'approved' },
          { $set: { status: 'expired' } },
        );
        markedExpired++;
        this.logger.warn(
          `[compliance] expired driver=${doc.driverId} type=${doc.type} expiresAt=${doc.expiresAt?.toISOString()}`,
        );
      } catch (e) {
        this.logger.error(
          `[compliance] update fallo doc=${docId} driver=${doc.driverId}: ${(e as Error).message}`,
        );
      }
    }

    // ── Acción 2: avisos de proximidad (logs por ahora; Fase B.1 wires email) ─
    for (const doc of expiring7) {
      const daysLeft = Math.ceil((new Date(doc.expiresAt!).getTime() - now.getTime()) / 86_400_000);
      this.logger.warn(
        `[compliance] expiring-soon-7d driver=${doc.driverId} type=${doc.type} daysLeft=${daysLeft}`,
      );
    }
    for (const doc of expiring30) {
      const daysLeft = Math.ceil((new Date(doc.expiresAt!).getTime() - now.getTime()) / 86_400_000);
      this.logger.log(
        `[compliance] expiring-soon-30d driver=${doc.driverId} type=${doc.type} daysLeft=${daysLeft}`,
      );
    }

    // ── Acción 3: recomputar compliance de drivers afectados ──────
    let driversLostCompliance = 0;
    for (const driverId of affectedDrivers) {
      const allDocs = await this.docModel.find({ driverId }).lean();
      const report = computeDriverCompliance(allDocs as DriverDocumentModel[], now);
      if (report.status !== 'verified') {
        driversLostCompliance++;
        this.logger.warn(
          `[compliance] driver=${driverId} status=${report.status} ` +
            `missing=[${report.missing.join(',')}] ` +
            `expired=[${report.expired.join(',')}] ` +
            `rejected=[${report.rejected.join(',')}]`,
        );
      }
    }

    this.logger.log(
      `[compliance] ciclo ok — scanned=${docs.length} ` +
        `markedExpired=${markedExpired} ` +
        `expiring7d=${expiring7.length} expiring30d=${expiring30.length} ` +
        `affectedDrivers=${affectedDrivers.size} driversLostCompliance=${driversLostCompliance} ` +
        `dt=${Date.now() - t0}ms`,
    );
  }
}
