import { Controller, Get } from '@nestjs/common';
import { IncidentRepository } from '../infrastructure/persistence/incident.repository';

/**
 * Health checks para Cloud Run startup/liveness probes y el ops dashboard.
 *
 *   GET /health   → 200 con {status:'ok'} si el container está vivo
 *   GET /health/ready → 200 con counts de incidentes activos si Mongo responde
 *
 * Cloud Run usa /health para startupProbe (no espera Mongo, sube el container
 * primero). /health/ready es para alertar si Mongo se cae mid-run.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly repo: IncidentRepository) {}

  @Get()
  liveness() {
    return { status: 'ok', service: 'emergency-service', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async readiness() {
    try {
      const [open, inProgress] = await Promise.all([
        this.repo.countByStatus('open'),
        this.repo.countByStatus('in_progress'),
      ]);
      return {
        status:     'ok',
        service:    'emergency-service',
        mongo:      'connected',
        incidents:  { open, in_progress: inProgress },
        timestamp:  new Date().toISOString(),
      };
    } catch (err) {
      return {
        status:    'degraded',
        service:   'emergency-service',
        mongo:     'error',
        error:     (err as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
