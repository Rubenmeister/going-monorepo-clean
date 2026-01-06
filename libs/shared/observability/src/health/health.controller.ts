import { Controller, Get, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma-health.indicator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    @Optional() private prisma: PrismaHealthIndicator,
  ) {}

  /**
   * Liveness probe - always returns OK if the service is running
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness check', description: 'Returns OK if service is alive' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async check(): Promise<HealthCheckResult> {
    const checks = [
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
    ];
    return this.health.check(checks);
  }

  /**
   * Readiness probe - checks if service is ready to receive traffic
   */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness check', description: 'Returns OK if service is ready to receive traffic' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready(): Promise<HealthCheckResult> {
    const checks: any[] = [
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
    ];

    if (this.prisma) {
      checks.push(() => this.prisma.isHealthy('database'));
    }

    return this.health.check(checks);
  }
}
