import { Module, DynamicModule } from '@nestjs/common';
import { CorrelationModule } from './correlation';
import { LoggingModule, LoggingModuleOptions } from './logging';
import { HealthModule } from './health';

export interface ObservabilityModuleOptions extends LoggingModuleOptions {
  enableTracing?: boolean;
  sentryDsn?: string;
}

/**
 * Main observability module that bundles:
 * - Structured logging with Pino
 * - Correlation ID middleware
 * - Health check endpoints
 * - OpenTelemetry tracing (optional)
 * 
 * Note: Sentry should be initialized in main.ts using Sentry.init()
 * from '@sentry/nestjs' package before NestFactory.create()
 */
@Module({})
export class ObservabilityModule {
  static forRoot(options: ObservabilityModuleOptions): DynamicModule {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imports: any[] = [
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
