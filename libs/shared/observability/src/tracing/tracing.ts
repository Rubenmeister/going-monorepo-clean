import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | null = null;

export interface TracingOptions {
  serviceName: string;
  endpoint?: string;
}

/**
 * Initialize OpenTelemetry tracing.
 * Call this at the very start of your application (before NestFactory.create).
 * 
 * @example
 * ```typescript
 * // In main.ts, BEFORE NestFactory.create
 * import { initTracing } from '@going/shared/observability';
 * initTracing({ serviceName: 'api-gateway' });
 * ```
 */
export function initTracing(options: TracingOptions): void {
  const isEnabled = process.env['OTEL_ENABLED'] === 'true';
  
  if (!isEnabled) {
    console.log(`[Tracing] Disabled for ${options.serviceName}`);
    return;
  }

  const endpoint = options.endpoint || process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] || 'http://localhost:4318';

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: options.serviceName,
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();
  console.log(`[Tracing] Started for ${options.serviceName} -> ${endpoint}`);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk?.shutdown()
      .then(() => console.log('[Tracing] Shutdown complete'))
      .catch((err) => console.error('[Tracing] Shutdown error', err));
  });
}

/**
 * Shutdown tracing SDK
 */
export async function shutdownTracing(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
  }
}
