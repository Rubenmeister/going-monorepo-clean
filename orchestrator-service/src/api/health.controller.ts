import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'orchestrator-service',
      timestamp: new Date().toISOString(),
      executeEnabled: process.env.ORCHESTRATOR_EXECUTE_ENABLED === 'true',
      pollEnabled:    process.env.ORCHESTRATOR_POLL_ENABLED !== 'false',
    };
  }
}
