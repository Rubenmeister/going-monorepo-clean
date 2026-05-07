import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'cerebro-service',
      timestamp: new Date().toISOString(),
      subscribeEnabled: process.env.CEREBRO_SUBSCRIBE_ENABLED === 'true',
    };
  }
}
