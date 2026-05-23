import { Injectable, Logger } from '@nestjs/common';
import {
  CreateIncidentInput,
  IncidentRepository,
} from '../infrastructure/persistence/incident.repository';
import { IncidentDocument } from '../infrastructure/schemas/incident.schema';
import { OpsNotifierService } from './ops-notifier.service';

/**
 * Orquesta el flujo SOS:
 *
 *   1. Persiste el incidente en Mongo (collection `incidents`).
 *   2. Notifica al equipo de operadores via Telegram con ubicación + map link.
 *   3. (TODO Día 5b) Publica evento al cerebro para que aparezca en el ops
 *      dashboard en tiempo real y dispare reglas del orchestrator.
 *
 * El cliente del SOS NO espera la notificación a ops — devolvemos 201 con
 * el incident.id en <300ms y la notificación va fire-and-forget en
 * paralelo. La persistencia SÍ es síncrona (sin incident no hay respuesta
 * útil al cliente, ni id de referencia para que reporte después).
 *
 * Idempotencia: si el cliente reintenta el mismo SOS (red flaky), genera
 * incidentes duplicados. A futuro podríamos dedupe por (userId, location,
 * createdAt±10s) — por ahora preferimos duplicar a perder uno real.
 */
@Injectable()
export class SosService {
  private readonly logger = new Logger(SosService.name);

  constructor(
    private readonly repo: IncidentRepository,
    private readonly opsNotifier: OpsNotifierService,
  ) {}

  async createSos(input: CreateIncidentInput): Promise<IncidentDocument> {
    const t0 = Date.now();
    const incident = await this.repo.create(input);
    const dtCreate = Date.now() - t0;
    this.logger.log(
      `[sos] incident creado id=${incident._id} userId=${input.userId} ` +
      `type=${input.emergencyType} channel=${input.channel} dt=${dtCreate}ms`,
    );

    // Notificación a ops — fire-and-forget. No bloqueamos el response al
    // cliente porque queremos confirmarle el ack rápido para que su UI
    // muestre "SOS enviado" sin esperar a Telegram (que puede tardar 1-3s).
    this.opsNotifier.notify(incident).catch(err =>
      this.logger.error(`[sos] ops-notify error para incident ${incident._id}: ${err.message}`),
    );

    return incident;
  }
}
