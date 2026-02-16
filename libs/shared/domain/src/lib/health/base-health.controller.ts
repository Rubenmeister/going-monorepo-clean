import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';

/**
 * Base health controller for all services
 * Each service should extend this and add custom indicators
 *
 * @example
 * @Controller('health')
 * export class HealthController extends BaseHealthController {
 *   constructor(
 *     health: HealthCheckService,
 *     db: MongooseHealthIndicator,
 *     private redis: RedisHealthIndicator
 *   ) {
 *     super(health, db);
 *   }
 *
 *   @Get()
 *   @HealthCheck()
 *   async check(): Promise<HealthCheckResult> {
 *     return this.health.check([
 *       () => this.db.pingCheck('database'),
 *       () => this.redis.isHealthy('redis'),
 *     ]);
 *   }
 * }
 */
@Controller('health')
export abstract class BaseHealthController {
  constructor(
    protected readonly health: HealthCheckService,
    protected readonly db: MongooseHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('live')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @HealthCheck()
  async readiness(): Promise<HealthCheckResult> {
    return this.check();
  }
}
