import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'mycortex-service',
      timestamp: new Date().toISOString(),
      reasoningEnabled: process.env.MYCORTEX_REASONING_ENABLED === 'true',
      model: process.env.MYCORTEX_MODEL || 'claude-sonnet-4-5',
    };
  }
}
