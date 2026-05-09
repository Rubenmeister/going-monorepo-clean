import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobsClient } from '@google-cloud/run';

/**
 * Wrapper sobre Google Cloud Run Jobs API.
 *
 * Para invocar un Cloud Run Job con argumentos dinámicos, hay 2 caminos:
 *  1. Override de env vars en runOverrides (el más simple — pasamos
 *     COMMAND_JSON con todo el payload)
 *  2. Override de container args en runOverrides
 *
 * Vamos con #1 porque los agents ya conocen sus env vars y agregar uno
 * más es trivial. El agent que recibe el comando lee process.env.COMMAND_JSON
 * y lo parsea.
 *
 * Limitaciones:
 *  - El job tiene que estar previamente desplegado (este client solo
 *    triggers ejecuciones, no crea jobs).
 *  - El env var override solo dura para esta ejecución específica.
 */
@Injectable()
export class CloudRunJobsClient {
  private readonly logger = new Logger(CloudRunJobsClient.name);
  private client?: JobsClient;

  constructor(private readonly config: ConfigService) {}

  private get jobs(): JobsClient {
    if (!this.client) {
      // ADC del SA del service.
      this.client = new JobsClient();
    }
    return this.client;
  }

  private get project(): string {
    return this.config.get<string>('GCP_PROJECT') || 'going-5d1ae';
  }

  private get region(): string {
    return this.config.get<string>('GCP_REGION') || 'us-central1';
  }

  /**
   * Trigger un job con un payload JSON. Devuelve el operation name para
   * que el caller pueda hacer follow-up si quiere (la API es async).
   *
   * Por simplicidad NO esperamos a que termine — los jobs pueden tardar
   * minutos. El Orchestrator marca la decision como 'executed' apenas
   * trigeamos OK; si la ejecución falla, eso lo veremos en logs del
   * agent y los próximos eventos al cerebro.
   */
  async triggerJob(args: {
    jobName:     string;
    decisionId:  string;
    action:      string;
    payload:     Record<string, unknown>;
  }): Promise<{
    ok:           boolean;
    executionName?: string;
    error?:       string;
  }> {
    const fullName = `projects/${this.project}/locations/${this.region}/jobs/${args.jobName}`;
    const commandJson = JSON.stringify({
      decisionId: args.decisionId,
      action:     args.action,
      payload:    args.payload,
    });

    try {
      const t0 = Date.now();
      const [operation] = await this.jobs.runJob({
        name: fullName,
        overrides: {
          containerOverrides: [
            {
              env: [
                { name: 'COMMAND_JSON', value: commandJson },
                { name: 'COMMAND_DECISION_ID', value: args.decisionId },
                { name: 'COMMAND_ACTION', value: args.action },
              ],
            },
          ],
        },
      });

      const ms = Date.now() - t0;
      const executionName = operation.name || undefined;
      this.logger.log(
        `triggered job ${args.jobName} action=${args.action} in ${ms}ms — execution=${executionName}`,
      );
      return { ok: true, executionName };
    } catch (e) {
      const err = (e as Error).message;
      this.logger.error(`runJob ${fullName} failed: ${err}`);
      return { ok: false, error: err };
    }
  }
}
