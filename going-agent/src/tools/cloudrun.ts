import { Logging } from '@google-cloud/logging';
import { CloudBuildClient } from '@google-cloud/cloudbuild';
import { config } from '../config';

const logging = new Logging({ projectId: config.gcpProject });
const cloudbuild = new CloudBuildClient();

export class CloudRunTool {

  /** Obtiene los últimos errores de un servicio en Cloud Run via GCP Logging API */
  async getServiceLogs(serviceName: string, limit = 50): Promise<string> {
    try {
      const [entries] = await logging.getEntries({
        filter: [
          `resource.type="cloud_run_revision"`,
          `resource.labels.service_name="${serviceName}"`,
          `severity>=ERROR`,
        ].join(' AND '),
        pageSize: limit,
        orderBy: 'timestamp desc',
      });

      if (!entries.length) return `✅ Sin errores recientes en ${serviceName}`;

      return entries.map(e => {
        const payload = e.data as any;
        const msg = typeof payload === 'string'
          ? payload
          : payload?.message || payload?.textPayload || JSON.stringify(payload).slice(0, 200);
        return `[${e.metadata.timestamp}] ${msg}`;
      }).join('\n');

    } catch (e: any) {
      return `❌ Error leyendo logs de ${serviceName}: ${e.message}`;
    }
  }

  /** Lista los builds fallidos recientes via GCP Cloud Build API */
  async getFailedBuilds(): Promise<string> {
    try {
      const [builds] = await cloudbuild.listBuilds({
        projectId: config.gcpProject,
        filter: 'status="FAILURE"',
        pageSize: 5,
      });

      if (!builds.length) return '✅ Sin builds fallidos recientes';

      return builds.map(b => {
        const failedSteps = (b.steps || [])
          .filter((s: any) => s.status === 'FAILURE')
          .map((s: any) => `  - step "${s.name}"`)
          .join('\n');
        return `Build ${b.id} FAILED\n${failedSteps || '  (sin steps fallidos detallados)'}`;
      }).join('\n\n');

    } catch (e: any) {
      return `❌ Error leyendo builds: ${e.message}`;
    }
  }
}
