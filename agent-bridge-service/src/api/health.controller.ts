import { Controller, Get } from '@nestjs/common';
import { AGENT_REGISTRY } from '../infrastructure/agent-registry';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'agent-bridge-service',
      timestamp: new Date().toISOString(),
      registeredAgents: Object.keys(AGENT_REGISTRY).length,
    };
  }
}
