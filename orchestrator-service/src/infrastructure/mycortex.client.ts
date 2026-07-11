import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Cliente HTTP para mycortex-service.
 *
 * Hoy expone solo `recordOutcome()` — usado por el dispatcher para cerrar
 * el feedback loop después de ejecutar una decisión. MyCortex ve el outcome
 * en su próximo ciclo y puede calibrar urgency/strategy en consecuencia.
 *
 * Best-effort: si falla, log y seguir. La decision YA está persistida en
 * orchestrator_decisions con su outcome — esto es solo para que MyCortex
 * lo vea en su Mongo. La pérdida de un push no compromete la auditoría.
 */
@Injectable()
export class MycortexClient {
  private readonly logger = new Logger(MycortexClient.name);

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    return (
      this.config.get<string>('MYCORTEX_URL') ||
      'https://mycortex-service-780842550857.us-central1.run.app'
    ).replace(/\/$/, '');
  }

  /**
   * Mapea el outcome del orchestrator (success/failure/unknown) al vocabulario
   * de MyCortex (effective/ineffective/unknown). 'effective' acá significa
   * "la acción se ejecutó OK" — MyCortex evalúa después si realmente
   * resolvió el problema mirando si la anomalía persiste.
   */
  async recordOutcome(args: {
    intentionId: string;
    decisionOutcome: 'success' | 'failure' | 'unknown';
    errorMessage?: string;
  }): Promise<void> {
    const mappedOutcome =
      args.decisionOutcome === 'success'
        ? 'effective'
        : args.decisionOutcome === 'failure'
        ? 'ineffective'
        : 'unknown';

    const url = `${this.baseUrl}/mycortex/intentions/${args.intentionId}/outcome`;
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '' },
        body: JSON.stringify({
          outcome:        mappedOutcome,
          notes:          args.errorMessage,
          acknowledgedBy: 'orchestrator-service',
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.warn(
          `recordOutcome ${args.intentionId.slice(0, 8)} → HTTP ${res.status}: ${body.slice(0, 200)}`,
        );
        return;
      }
      this.logger.log(
        `recordOutcome ${args.intentionId.slice(0, 8)} → ${mappedOutcome} OK`,
      );
    } catch (e) {
      this.logger.warn(
        `recordOutcome ${args.intentionId.slice(0, 8)} exception: ${(e as Error).message}`,
      );
    }
  }
}
