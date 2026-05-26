import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  IDriverComplianceRepository,
  DriverComplianceStatus,
} from '@going-monorepo-clean/domains-transport-core';
import {
  DriverDocumentModel,
  DriverDocumentDocument,
  computeDriverCompliance,
} from './schemas/driver-document.schema';

/**
 * MongoDriverComplianceRepository — implementación del puerto que computa
 * compliance a partir de la collection driver_documents.
 *
 * Estrategia anti N+1:
 *   - Una sola query a Mongo: `find({ driverId: { $in: ids } })`.
 *   - Agrupa por driverId en memoria.
 *   - Computa compliance por cada driver con computeDriverCompliance.
 *
 * Trade-off: si un driver no tiene NINGÚN doc en la collection (no hizo
 * upload), no aparece en el Map devuelto. El caller (matching engine)
 * trata Map.get(id) === undefined como 'unknown' y excluye el driver
 * (fail-secure: si no podemos verificar, no operamos).
 *
 * Para no romper drivers viejos creados antes de este sistema, hay un
 * env var COMPLIANCE_GATE_STRICT (default 'false'). Si false, drivers
 * sin docs son tratados como 'verified' (legacy) — útil mientras se
 * está poblando la collection. Cambiar a 'true' una vez que todos los
 * drivers activos hayan completado su upload inicial.
 */
@Injectable()
export class MongoDriverComplianceRepository implements IDriverComplianceRepository {
  private readonly logger = new Logger(MongoDriverComplianceRepository.name);
  private readonly strictMode = process.env.COMPLIANCE_GATE_STRICT === 'true';

  constructor(
    @InjectModel(DriverDocumentModel.name)
    private readonly docModel: Model<DriverDocumentDocument>,
  ) {}

  async getStatusesForDrivers(
    driverIds: string[],
  ): Promise<Map<string, DriverComplianceStatus>> {
    const result = new Map<string, DriverComplianceStatus>();
    if (!driverIds || driverIds.length === 0) return result;

    try {
      const docs = await this.docModel
        .find({ driverId: { $in: driverIds } })
        .lean();

      // Agrupar por driverId
      const byDriver = new Map<string, DriverDocumentModel[]>();
      for (const doc of docs) {
        const list = byDriver.get(doc.driverId) ?? [];
        list.push(doc as DriverDocumentModel);
        byDriver.set(doc.driverId, list);
      }

      // Computar status por cada driver SOLICITADO (no solo los que tienen docs)
      const now = new Date();
      for (const driverId of driverIds) {
        const driverDocs = byDriver.get(driverId);
        if (!driverDocs || driverDocs.length === 0) {
          // Driver sin docs: en modo strict, mark como 'pending' (no opera).
          // En modo lax (default por ahora), mark como 'verified' para no
          // romper drivers legacy mientras se migra.
          result.set(
            driverId,
            this.strictMode ? 'pending' : 'verified',
          );
          continue;
        }
        const report = computeDriverCompliance(driverDocs, now);
        result.set(driverId, report.status as DriverComplianceStatus);
      }

      return result;
    } catch (e) {
      this.logger.error(
        `getStatusesForDrivers fallo (${driverIds.length} drivers): ${(e as Error).message}`,
      );
      // Devolver Map vacía — caller fail-secure si gate strict
      return new Map();
    }
  }
}
