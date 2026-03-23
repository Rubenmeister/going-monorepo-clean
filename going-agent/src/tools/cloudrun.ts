import { execSync } from 'child_process';
import { config } from '../config';

export class CloudRunTool {

  private run(cmd: string): string {
    try {
      return execSync(cmd, { encoding: 'utf8', timeout: 30000 });
    } catch (e: any) {
      return e.stdout || e.message || 'error';
    }
  }

  listServices(): string {
    return this.run(
      `gcloud run services list --project=${config.gcpProject} --region=${config.gcpRegion} --format=json`
    );
  }

  getServiceLogs(serviceName: string, lines = 50): string {
    return this.run(
      `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${serviceName} AND severity>=ERROR" ` +
      `--project=${config.gcpProject} --limit=${lines} --format="value(textPayload,jsonPayload.message)" --order=desc`
    );
  }

  getFailedBuilds(): string {
    return this.run(
      `gcloud builds list --project=${config.gcpProject} --filter="status=FAILURE" --limit=5 --format=json`
    );
  }

  getServiceStatus(serviceName: string): string {
    return this.run(
      `gcloud run services describe ${serviceName} --project=${config.gcpProject} --region=${config.gcpRegion} --format=json`
    );
  }
}
