# Going Platform - Observability Library

Comprehensive observability library for the Going Platform providing structured logging, metrics collection, and health checks.

## Features

- **Structured Logging**: Winston-based logging with multiple transports

  - Console output for development
  - Daily rotating file logs
  - Elasticsearch integration for aggregated logging

- **Prometheus Metrics**: Metrics collection for:

  - HTTP request duration and count
  - Database query performance
  - Cache hit/miss rates
  - Custom application metrics

- **Health Checks**: Standardized health check endpoints
  - Liveness probe (/health/live)
  - Readiness probe (/health/ready)
  - Detailed health endpoint (/health)

## Installation

The library is already included in the monorepo at `libs/shared/observability`.

## Usage

### 1. Import the Module

In your NestJS application module:

```typescript
import { ObservabilityModule } from '@going-platform/shared-observability';

@Module({
  imports: [
    ObservabilityModule.forRoot({
      logger: {
        serviceName: 'booking-service',
        environment: process.env.NODE_ENV,
        logLevel: process.env.LOG_LEVEL || 'info',
      },
      metrics: {
        serviceName: 'booking-service',
      },
      enableHealthCheck: true,
      healthChecks: {
        mongodb: HealthCheckFactory.mongooseCheck(mongooseConnection),
        redis: HealthCheckFactory.redisCheck(redisClient),
      },
    }),
  ],
})
export class AppModule {}
```

### 2. Use Structured Logger

Inject the logger in your services:

```typescript
import { Inject } from '@nestjs/common';
import { StructuredLogger } from '@going-platform/shared-observability';

@Injectable()
export class BookingService {
  constructor(
    @Inject('STRUCTURED_LOGGER')
    private logger: StructuredLogger
  ) {}

  async createBooking(data: CreateBookingDto) {
    this.logger.info('Creating new booking', {
      userId: data.userId,
      vehicleId: data.vehicleId,
    });

    try {
      const booking = await this.bookingModel.create(data);
      return booking;
    } catch (error) {
      this.logger.error('Failed to create booking', error, {
        userId: data.userId,
      });
      throw error;
    }
  }
}
```

### 3. Use Prometheus Metrics

Track custom metrics:

```typescript
import { Inject } from '@nestjs/common';
import { PrometheusMetrics } from '@going-platform/shared-observability';

@Injectable()
export class RideService {
  constructor(
    @Inject('PROMETHEUS_METRICS')
    private metrics: PrometheusMetrics
  ) {}

  async acceptRide(rideId: string) {
    const startTime = Date.now();

    try {
      // Accept the ride
      const result = await this.acceptRideLogic(rideId);

      const duration = (Date.now() - startTime) / 1000;
      this.metrics.recordDatabaseQuery('rides', 'update', duration, true);

      return result;
    } catch (error) {
      this.metrics.recordDatabaseQuery(
        'rides',
        'update',
        Date.now() - startTime,
        false
      );
      throw error;
    }
  }
}
```

### 4. Setup HTTP Request Tracking

Add middleware for automatic HTTP request tracking:

```typescript
// http-metrics.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrometheusMetrics } from '@going-platform/shared-observability';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(private metrics: PrometheusMetrics) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      const route = req.route?.path || req.path;

      this.metrics.recordHttpRequest(
        req.method,
        route,
        res.statusCode,
        duration
      );
    });

    next();
  }
}

// app.module.ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpMetricsMiddleware).forRoutes('*');
  }
}
```

### 5. Expose Metrics Endpoint

Add a controller to expose Prometheus metrics:

```typescript
import { Controller, Get } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PrometheusMetrics } from '@going-platform/shared-observability';

@Controller('metrics')
export class MetricsController {
  constructor(
    @Inject('PROMETHEUS_METRICS')
    private metrics: PrometheusMetrics
  ) {}

  @Get()
  async getMetrics() {
    return this.metrics.getMetrics();
  }
}
```

## Environment Variables

```env
# Logging
LOG_LEVEL=info
LOGSTASH_URL=logstash:5000
ELASTICSEARCH_NODE=http://elasticsearch:9200
ELASTIC_PASSWORD=ElasticPassword123!

# Service Name
SERVICE_NAME=booking-service
NODE_ENV=production
```

## Access Dashboards

After starting docker-compose:

- **Kibana** (Logs): http://localhost:5601

  - Username: elastic
  - Password: ElasticPassword123! (default)

- **Grafana** (Metrics): http://localhost:3100

  - Username: admin
  - Password: admin (default)

- **Prometheus** (Raw Metrics): http://localhost:9090

- **Service Health**: http://localhost:3000/health

## Available Metrics

### HTTP Metrics

- `{service}_http_request_duration_seconds` - Request duration histogram
- `{service}_http_requests_total` - Total requests counter
- `{service}_http_errors_total` - Total errors counter

### Database Metrics

- `{service}_db_query_duration_seconds` - Query duration histogram
- `{service}_db_operations_total` - Total operations counter

### Cache Metrics

- `{service}_cache_hits_total` - Cache hits counter
- `{service}_cache_misses_total` - Cache misses counter

### System Metrics (Automatic)

- `{service}_process_uptime_seconds`
- `{service}_process_memory_usage_bytes`
- `{service}_nodejs_eventloop_lag_seconds`

## Best Practices

1. **Use appropriate log levels**:

   - `error` - Problems that need immediate attention
   - `warn` - Unexpected behavior but recoverable
   - `info` - Important business events
   - `debug` - Detailed debugging information

2. **Include context in logs**:

   - User ID
   - Request ID
   - Transaction ID
   - Service version

3. **Monitor key metrics**:

   - Error rate
   - Response time (P50, P95, P99)
   - Cache hit rate
   - Database query performance

4. **Set up alerts** in Grafana for:
   - Error rate > 5%
   - Response time P99 > 1000ms
   - Service unhealthy
   - High memory usage

## Troubleshooting

### Logs not appearing in Elasticsearch

1. Check Elasticsearch is running: `curl http://localhost:9200`
2. Check Logstash is running: `curl http://localhost:9600`
3. Verify ELASTICSEARCH_PASSWORD is correct
4. Check service logs: `docker logs going-logstash`

### Prometheus metrics not updating

1. Verify service is exporting metrics: `curl http://localhost:3000/metrics`
2. Check Prometheus scrape config: http://localhost:9090/config
3. Verify service name matches in prometheus.yml

### Health check failing

1. Check MongoDB connection: `docker logs going-mongodb`
2. Check Redis connection: `docker logs going-redis`
3. Verify connection strings in health checks
