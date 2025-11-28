import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HttpHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

interface HealthStatus {
  status: 'ok' | 'error';
  info?: Record<string, any>;
  error?: Record<string, any>;
  details: Record<string, any>;
}

interface DetailedHealthStatus extends HealthStatus {
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.checkRedis(),
    ]);
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with system metrics' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  async detailedCheck(): Promise<DetailedHealthStatus> {
    const startTime = Date.now();
    
    try {
      // Run basic health checks
      const healthResult = await this.health.check([
        () => this.db.pingCheck('database'),
        () => this.checkRedis(),
        () => this.checkExternalServices(),
      ]);

      // Get system metrics
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        },
        cpu: {
          usage: Math.round((cpuUsage.user + cpuUsage.system) / 1000), // ms
        },
        details: {
          ...healthResult.details,
          responseTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        memory: {
          used: 0,
          total: 0,
          percentage: 0,
        },
        cpu: {
          usage: 0,
        },
        error: {
          message: error.message,
          stack: error.stack,
        },
        details: {
          responseTime: Date.now() - startTime,
        },
      };
    }
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness() {
    // Check if service is ready to accept traffic
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.checkRedis(),
      () => this.checkCriticalServices(),
    ]);
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async liveness() {
    // Basic liveness check - service is running
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  private async checkRedis() {
    try {
      const result = await this.redis.ping();
      if (result === 'PONG') {
        return {
          redis: {
            status: 'up',
            message: 'Redis is responding',
          },
        };
      }
      throw new Error('Redis ping failed');
    } catch (error) {
      throw new Error(`Redis health check failed: ${error.message}`);
    }
  }

  private async checkExternalServices() {
    const services = [];
    
    // Check other microservices if this is the API Gateway
    if (process.env.SERVICE_NAME === 'api-gateway') {
      const serviceUrls = [
        { name: 'user-auth-service', url: process.env.USER_AUTH_SERVICE_URL },
        { name: 'booking-service', url: process.env.BOOKING_SERVICE_URL },
        { name: 'tours-service', url: process.env.TOURS_SERVICE_URL },
        { name: 'payment-service', url: process.env.PAYMENT_SERVICE_URL },
      ];

      for (const service of serviceUrls) {
        if (service.url) {
          try {
            services.push(
              this.http.pingCheck(service.name, `${service.url}/health`)
            );
          } catch (error) {
            // Log error but don't fail the health check for external services
            console.warn(`External service ${service.name} health check failed:`, error.message);
          }
        }
      }
    }

    return Promise.all(services);
  }

  private async checkCriticalServices() {
    // Check only critical services that must be available
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.checkRedis(),
    ]);
  }
}

// Health Check Module
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}