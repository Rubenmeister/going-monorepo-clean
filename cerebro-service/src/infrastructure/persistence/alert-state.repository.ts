import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AlertStateEntity, AlertStateDocument } from '../schemas/alert-state.schema';

/**
 * Persistencia singleton del state del HealthMonitorService.
 *
 * Uso:
 *   - onModuleInit en HealthMonitorService: getActiveIds() para rehidratar
 *     el Set in-memory al arrancar el container.
 *   - Después de cada @Cron evaluate: setActiveIds(...) para guardar el
 *     state actualizado y sobrevivir a recycles.
 *
 * Failures: best-effort. Si Mongo falla, el repo loggea y devuelve [] / void
 * (la app no se rompe — al peor caso, vuelven los re-alerts en el próximo
 * recycle).
 */
@Injectable()
export class AlertStateRepository {
  private readonly logger = new Logger(AlertStateRepository.name);

  /** _id fijo del documento singleton. */
  private static readonly SINGLETON_ID = 'singleton';

  constructor(
    @InjectModel('AlertState') private readonly model: Model<AlertStateDocument>,
  ) {}

  /** Devuelve los IDs activos persistidos, o [] si no hay state previo. */
  async getActiveIds(): Promise<string[]> {
    try {
      const doc = await this.model
        .findById(AlertStateRepository.SINGLETON_ID)
        .lean();
      return doc?.activeAlertIds ?? [];
    } catch (e) {
      this.logger.warn(`getActiveIds fallo: ${(e as Error).message}`);
      return [];
    }
  }

  /** Reemplaza el set persistido. Upsert idempotente. */
  async setActiveIds(ids: string[]): Promise<void> {
    try {
      await this.model.findByIdAndUpdate(
        AlertStateRepository.SINGLETON_ID,
        {
          $set: {
            _id: AlertStateRepository.SINGLETON_ID,
            activeAlertIds: ids,
          },
        },
        { upsert: true, new: false },
      );
    } catch (e) {
      this.logger.warn(`setActiveIds fallo: ${(e as Error).message}`);
    }
  }
}
