import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      ok:        true,
      service:   'voice-call-service',
      displayName: 'Uyari',
      meaning:   'escuchar / oír (kichwa)',
      ts:        new Date().toISOString(),
    };
  }
}
