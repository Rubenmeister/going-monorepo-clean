import {
  Controller,
  Get,
  HttpCode,
  Inject,
  Optional,
  Response,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: Record<string, boolean>;
}

/**
 * Generic health check controller that can be extended by services
 */
@ApiTags('Health')
@Controller('health')
export class HealthCheckController {
  constructor(
    @Optional()
    @Inject('HEALTH_CHECKS')
    private readonly healthChecks?: Record<string, () => Promise<boolean>>
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  async check(@Response() res: any) {
    const checks: Record<string, boolean> = {};

    // Run custom health checks if provided
    if (this.healthChecks) {
      for (const [name, check] of Object.entries(this.healthChecks)) {
        try {
          checks[name] = await check();
        } catch (error) {
          checks[name] = false;
        }
      }
    }

    const allHealthy = Object.values(checks).every((check) => check !== false);
    const uptime = process.uptime();

    const response: HealthCheckResponse = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime,
      checks: Object.keys(checks).length > 0 ? checks : { basic: true },
    };

    // Return 503 if unhealthy, 200 if healthy
    res.status(allHealthy ? 200 : 503).json(response);
  }

  @Get('live')
  @HttpCode(200)
  @ApiOperation({ summary: 'Liveness probe (simple readiness)' })
  liveness() {
    return { status: 'alive' };
  }

  @Get('ready')
  @HttpCode(200)
  @ApiOperation({ summary: 'Readiness probe (detailed checks)' })
  async readiness() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Helper to create health checks for common dependencies
 */
export class HealthCheckFactory {
  static mongooseCheck(mongooseConnection: any) {
    return async () => {
      try {
        await mongooseConnection.connection.db.admin().ping();
        return true;
      } catch {
        return false;
      }
    };
  }

  static redisCheck(redisClient: any) {
    return async () => {
      try {
        await redisClient.ping();
        return true;
      } catch {
        return false;
      }
    };
  }

  static elasticsearchCheck(elasticsearchClient: any) {
    return async () => {
      try {
        await elasticsearchClient.ping();
        return true;
      } catch {
        return false;
      }
    };
  }

  static httpCheck(url: string) {
    return async () => {
      try {
        const response = await fetch(url, { timeout: 5000 });
        return response.ok;
      } catch {
        return false;
      }
    };
  }
}
