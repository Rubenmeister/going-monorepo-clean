import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Cliente HTTP para leer el world snapshot del cerebro-service.
 *
 * Usamos HTTP en lugar de tocar Mongo directo (DB `going-cerebro`) por:
 *   - Encapsulación: el cerebro-service es dueño de su modelo de datos.
 *   - Versionado: si el shape cambia, lo controla el cerebro vía la
 *     respuesta del endpoint, no por mantener schemas duplicados acá.
 *   - Tests más simples: mockear HTTP es más fácil que mockear Mongoose.
 *
 * El cerebro-service expone /cerebro/state públicamente (por ahora sin auth
 * — está detrás del SA going-agent-sa, mismo que mycortex). En producción
 * con tráfico real, conviene agregar auth interna entre servicios.
 */
@Injectable()
export class WorldSnapshotClient {
  private readonly logger = new Logger(WorldSnapshotClient.name);

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    return (
      this.config.get<string>('CEREBRO_STATE_URL') ||
      'https://cerebro-service-780842550857.us-central1.run.app'
    ).replace(/\/$/, '');
  }

  /** Trae el último snapshot. Lanza si el cerebro-service no responde. */
  async fetchLatest(): Promise<WorldSnapshot> {
    const url = `${this.baseUrl}/cerebro/state`;
    const t0 = Date.now();

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        // Timeout duro de 10s — si el cerebro está caído no queremos
        // bloquear el ciclo de razonamiento esperando.
        signal: AbortSignal.timeout(10000),
      });
    } catch (err) {
      throw new Error(`cerebro-service unreachable (${url}): ${(err as Error).message}`);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`cerebro-service ${url} returned ${res.status}: ${body.slice(0, 300)}`);
    }

    const json = (await res.json()) as WorldSnapshot;
    const ms = Date.now() - t0;
    this.logger.log(
      `World snapshot fetched in ${ms}ms — health=${json.systemHealth} ` +
        `crit=${json.totalCriticalAnomalies} warn=${json.totalWarnings}`,
    );
    return json;
  }
}

/**
 * Shape del snapshot — DEBE coincidir con WorldSnapshotEntity del cerebro-service.
 * Lo redeclaramos local porque importar entre microservicios crea acoplamiento;
 * cuando el contrato del endpoint estabilice, esto pasa a libs/ compartida.
 */
export interface WorldSnapshot {
  version?:               string;
  generatedAt:            string;
  windowMinutes:          number;
  systemHealth:           'healthy' | 'degraded' | 'critical';
  totalCriticalAnomalies: number;
  totalWarnings:          number;
  agents: Array<{
    agentId:        string;
    lastRunAt:      string | null;
    lastStatus:     string;
    ageMinutes:     number;
    metrics:        Record<string, number | string>;
    anomaliesCount: number;
    criticalCount:  number;
    warningCount:   number;
  }>;
  activeAnomalies: Array<{
    agentId:    string;
    type:       string;
    severity:   string;
    message:    string;
    detectedAt: string;
    data?:      Record<string, unknown>;
  }>;
  topProposedActions: Array<{
    agentId:    string;
    type:       string;
    reason:     string;
    urgency:    number;
    target?:    string;
    proposedAt: string;
  }>;
  business: Record<string, number | undefined>;
  changedSinceLast?: {
    healthChanged:       boolean;
    newCriticalCount:    number;
    resolvedCriticalCount: number;
    description:         string;
  };
}
