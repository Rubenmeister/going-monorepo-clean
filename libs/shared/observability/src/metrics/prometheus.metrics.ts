import * as prometheus from 'prom-client';

export interface MetricsConfig {
  serviceName: string;
  includeNodeMetrics?: boolean;
}

/**
 * Initialize Prometheus metrics for a service
 */
export class PrometheusMetrics {
  private httpRequestDuration: prometheus.Histogram;
  private httpRequestTotal: prometheus.Counter;
  private httpErrorsTotal: prometheus.Counter;

  private dbQueryDuration: prometheus.Histogram;
  private dbOperationsTotal: prometheus.Counter;

  private cacheHitsTotal: prometheus.Counter;
  private cacheMissesTotal: prometheus.Counter;

  private activeConnections: prometheus.Gauge;
  private queueSize: prometheus.Gauge;

  private customGauges: Map<string, prometheus.Gauge> = new Map();
  private customCounters: Map<string, prometheus.Counter> = new Map();

  constructor(private config: MetricsConfig) {
    if (config.includeNodeMetrics !== false) {
      prometheus.collectDefaultMetrics({ prefix: `${config.serviceName}_` });
    }

    // HTTP Metrics
    this.httpRequestDuration = new prometheus.Histogram({
      name: `${config.serviceName}_http_request_duration_seconds`,
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    this.httpRequestTotal = new prometheus.Counter({
      name: `${config.serviceName}_http_requests_total`,
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status'],
    });

    this.httpErrorsTotal = new prometheus.Counter({
      name: `${config.serviceName}_http_errors_total`,
      help: 'Total HTTP errors',
      labelNames: ['method', 'route', 'status'],
    });

    // Database Metrics
    this.dbQueryDuration = new prometheus.Histogram({
      name: `${config.serviceName}_db_query_duration_seconds`,
      help: 'Database query duration in seconds',
      labelNames: ['collection', 'operation'],
      buckets: [0.01, 0.1, 0.5, 1, 5],
    });

    this.dbOperationsTotal = new prometheus.Counter({
      name: `${config.serviceName}_db_operations_total`,
      help: 'Total database operations',
      labelNames: ['collection', 'operation', 'status'],
    });

    // Cache Metrics
    this.cacheHitsTotal = new prometheus.Counter({
      name: `${config.serviceName}_cache_hits_total`,
      help: 'Total cache hits',
      labelNames: ['cache_name'],
    });

    this.cacheMissesTotal = new prometheus.Counter({
      name: `${config.serviceName}_cache_misses_total`,
      help: 'Total cache misses',
      labelNames: ['cache_name'],
    });

    // Connection Metrics
    this.activeConnections = new prometheus.Gauge({
      name: `${config.serviceName}_active_connections`,
      help: 'Number of active connections',
    });

    this.queueSize = new prometheus.Gauge({
      name: `${config.serviceName}_queue_size`,
      help: 'Size of job queue',
      labelNames: ['queue_name'],
    });
  }

  /**
   * Track HTTP request duration
   */
  recordHttpRequest(
    method: string,
    route: string,
    status: number,
    duration: number
  ) {
    this.httpRequestDuration
      .labels(method, route, status.toString())
      .observe(duration);
    this.httpRequestTotal.labels(method, route, status.toString()).inc();

    if (status >= 400) {
      this.httpErrorsTotal.labels(method, route, status.toString()).inc();
    }
  }

  /**
   * Track database query duration
   */
  recordDatabaseQuery(
    collection: string,
    operation: string,
    duration: number,
    success: boolean
  ) {
    this.dbQueryDuration.labels(collection, operation).observe(duration);
    this.dbOperationsTotal
      .labels(collection, operation, success ? 'success' : 'error')
      .inc();
  }

  /**
   * Track cache operations
   */
  recordCacheHit(cacheName: string) {
    this.cacheHitsTotal.labels(cacheName).inc();
  }

  recordCacheMiss(cacheName: string) {
    this.cacheMissesTotal.labels(cacheName).inc();
  }

  /**
   * Update gauge metrics
   */
  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  setQueueSize(queueName: string, size: number) {
    this.queueSize.labels(queueName).set(size);
  }

  /**
   * Create custom gauge
   */
  createGauge(
    name: string,
    help: string,
    labels: string[] = []
  ): prometheus.Gauge {
    const fullName = `${this.config.serviceName}_${name}`;
    if (!this.customGauges.has(fullName)) {
      const gauge = new prometheus.Gauge({
        name: fullName,
        help,
        labelNames: labels,
      });
      this.customGauges.set(fullName, gauge);
    }
    return this.customGauges.get(fullName)!;
  }

  /**
   * Create custom counter
   */
  createCounter(
    name: string,
    help: string,
    labels: string[] = []
  ): prometheus.Counter {
    const fullName = `${this.config.serviceName}_${name}`;
    if (!this.customCounters.has(fullName)) {
      const counter = new prometheus.Counter({
        name: fullName,
        help,
        labelNames: labels,
      });
      this.customCounters.set(fullName, counter);
    }
    return this.customCounters.get(fullName)!;
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return prometheus.register.metrics();
  }

  /**
   * Get content type for metrics endpoint
   */
  getContentType(): string {
    return prometheus.register.contentType;
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clearMetrics() {
    prometheus.register.clear();
  }
}

export const defaultMetricsConfig: MetricsConfig = {
  serviceName: 'going-service',
  includeNodeMetrics: true,
};
