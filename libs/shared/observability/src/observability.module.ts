import { Module, DynamicModule } from '@nestjs/common';
import { CorrelationModule } from './correlation';
import { LoggingModule, LoggingModuleOptions } from './logging';
import { HealthModule } from './health';

export interface ObservabilityModuleOptions extends LoggingModuleOptions {
  enableTracing?: boolean;
}

/**
 * Main observability module that bundles:
 * - Structured logging with Pino
 * - Correlation ID middleware
 * - Health check endpoints
 * - OpenTelemetry tracing (optional)
 */
@Module({})
export class ObservabilityModule {
  static forRoot(options: ObservabilityModuleOptions): DynamicModule {
    const imports = [
      CorrelationModule,
      LoggingModule.forRoot(options),
      HealthModule,
    ];

    return {
      module: ObservabilityModule,
      imports,
      exports: imports,
      global: true,
    };
  }
}
