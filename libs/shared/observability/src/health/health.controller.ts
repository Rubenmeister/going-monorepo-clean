import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
} from '@nestjs/terminus';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  /**
   * Liveness probe - always returns OK if the service is running
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness check', description: 'Returns OK if service is alive' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  /**
   * Readiness probe - checks if service is ready to receive traffic
   */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness check', description: 'Returns OK if service is ready to receive traffic' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  ready(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }
}
