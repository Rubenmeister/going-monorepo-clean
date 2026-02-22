import { Module, DynamicModule } from '@nestjs/common';
import * as prometheus from 'prom-client';
import { HealthCheckController } from './health/health-check.controller';
import { PrometheusMetrics, MetricsConfig } from './metrics/prometheus.metrics';
import {
  createLogger,
  LoggerConfig,
  StructuredLogger,
} from './logger/winston.logger';

export interface ObservabilityConfig {
  logger?: LoggerConfig;
  metrics?: MetricsConfig;
  enableHealthCheck?: boolean;
  healthChecks?: Record<string, () => Promise<boolean>>;
}

@Module({})
export class ObservabilityModule {
  static forRoot(config: ObservabilityConfig): DynamicModule {
    const {
      logger: loggerConfig,
      metrics: metricsConfig,
      enableHealthCheck = true,
      healthChecks = {},
    } = config;

    // Create logger instance
    const winstonLogger = createLogger(
      loggerConfig || { serviceName: 'default' }
    );
    const structuredLogger = new StructuredLogger(
      winstonLogger,
      loggerConfig?.serviceName || 'default'
    );

    // Create metrics instance
    const prometheusMetrics = new PrometheusMetrics(
      metricsConfig || { serviceName: 'default' }
    );

    // Create metrics endpoint controller
    @Module({})
    class MetricsController {
      @Get('/metrics')
      async metrics() {
        return prometheus.register.metrics();
      }

      @Get('/metrics/contentType')
      getContentType() {
        return prometheus.register.contentType;
      }
    }

    const providers = [
      {
        provide: 'WINSTON_LOGGER',
        useValue: winstonLogger,
      },
      {
        provide: 'STRUCTURED_LOGGER',
        useValue: structuredLogger,
      },
      {
        provide: 'PROMETHEUS_METRICS',
        useValue: prometheusMetrics,
      },
    ];

    if (enableHealthCheck) {
      providers.push({
        provide: 'HEALTH_CHECKS',
        useValue: healthChecks,
      });
    }

    return {
      module: ObservabilityModule,
      providers,
      exports: ['WINSTON_LOGGER', 'STRUCTURED_LOGGER', 'PROMETHEUS_METRICS'],
      controllers: enableHealthCheck ? [HealthCheckController] : [],
    };
  }
}

// Export convenience decorators and utilities
export { createLogger, StructuredLogger } from './logger/winston.logger';
export { PrometheusMetrics, MetricsConfig } from './metrics/prometheus.metrics';
export {
  HealthCheckController,
  HealthCheckFactory,
} from './health/health-check.controller';
