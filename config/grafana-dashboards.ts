/**
 * API Gateway Performance Dashboard Configuration
 * Grafana dashboard for monitoring API endpoint performance
 *
 * Metrics:
 * - Request latency (p50, p95, p99)
 * - Error rates by endpoint
 * - Request volume trends
 * - Response size distribution
 * - Cache hit rates
 */

export const apiGatewayPerformanceDashboard = {
  dashboard: {
    title: 'API Gateway Performance',
    description: 'Real-time monitoring of API endpoint performance and health',
    tags: ['api-gateway', 'performance', 'monitoring'],
    timezone: 'browser',
    panels: [
      {
        title: 'Request Latency (p50, p95, p99)',
        type: 'graph',
        targets: [
          {
            expr: 'histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))',
            legendFormat: 'p50',
            refId: 'A',
          },
          {
            expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
            legendFormat: 'p95',
            refId: 'B',
          },
          {
            expr: 'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))',
            legendFormat: 'p99',
            refId: 'C',
          },
        ],
        gridPos: { h: 8, w: 12, x: 0, y: 0 },
        yaxes: [
          {
            label: 'Latency (ms)',
            format: 'ms',
          },
        ],
      },
      {
        title: 'Error Rate by Endpoint',
        type: 'graph',
        targets: [
          {
            expr: 'sum by (path) (rate(http_requests_total{status=~"5.."}[5m]))',
            legendFormat: '{{path}}',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 12, x: 12, y: 0 },
        yaxes: [
          {
            label: 'Errors/sec',
            format: 'short',
          },
        ],
      },
      {
        title: 'Request Volume',
        type: 'graph',
        targets: [
          {
            expr: 'sum(rate(http_requests_total[5m]))',
            legendFormat: 'Total RPS',
            refId: 'A',
          },
          {
            expr: 'sum by (path) (rate(http_requests_total[5m]))',
            legendFormat: '{{path}}',
            refId: 'B',
          },
        ],
        gridPos: { h: 8, w: 24, x: 0, y: 8 },
      },
      {
        title: 'Cache Hit Rate',
        type: 'gauge',
        targets: [
          {
            expr: 'sum(rate(cache_hits_total[5m])) / sum(rate(cache_requests_total[5m]))',
            legendFormat: 'Hit Rate',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 6, x: 0, y: 16 },
        thresholds: '70,85',
      },
      {
        title: 'Response Size Distribution',
        type: 'histogram',
        targets: [
          {
            expr: 'histogram_quantile(0.99, sum(rate(http_response_size_bytes_bucket[5m])) by (le))',
            legendFormat: 'p99',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 12, x: 6, y: 16 },
      },
      {
        title: 'Top Slowest Endpoints',
        type: 'table',
        targets: [
          {
            expr: 'topk(10, histogram_quantile(0.95, sum by (path) (rate(http_request_duration_seconds_bucket[5m]))))',
            format: 'table',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 12, x: 12, y: 16 },
      },
    ],
  },
};

export const databasePerformanceDashboard = {
  dashboard: {
    title: 'Database Query Performance',
    description:
      'Monitor database query performance, slow queries, and index usage',
    tags: ['database', 'mongodb', 'performance'],
    timezone: 'browser',
    panels: [
      {
        title: 'Query Duration by Collection',
        type: 'graph',
        targets: [
          {
            expr: 'histogram_quantile(0.95, sum by (collection) (rate(mongodb_query_duration_seconds_bucket[5m])))',
            legendFormat: '{{collection}}',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 12, x: 0, y: 0 },
      },
      {
        title: 'Slow Queries (>200ms)',
        type: 'table',
        targets: [
          {
            expr: 'topk(20, sum by (collection, operation) (increase(mongodb_slow_queries_total[5m])))',
            format: 'table',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 12, x: 12, y: 0 },
      },
      {
        title: 'Query Success Rate',
        type: 'gauge',
        targets: [
          {
            expr: 'sum(rate(mongodb_queries_total{status="success"}[5m])) / sum(rate(mongodb_queries_total[5m]))',
            legendFormat: 'Success Rate',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 6, x: 0, y: 8 },
        thresholds: '99,99.5',
      },
      {
        title: 'Index Hit Rate',
        type: 'gauge',
        targets: [
          {
            expr: 'sum(rate(mongodb_index_hits_total[5m])) / sum(rate(mongodb_queries_total[5m]))',
            legendFormat: 'Hit Rate',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 6, x: 6, y: 8 },
        thresholds: '80,95',
      },
      {
        title: 'Connection Pool Utilization',
        type: 'gauge',
        targets: [
          {
            expr: 'mongodb_pool_active_connections / mongodb_pool_max_connections',
            legendFormat: 'Pool Usage',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 6, x: 12, y: 8 },
        thresholds: '70,85',
      },
    ],
  },
};

export const cachePerformanceDashboard = {
  dashboard: {
    title: 'Cache Performance',
    description: 'Redis cache hit/miss rates, memory usage, and key eviction',
    tags: ['cache', 'redis', 'performance'],
    timezone: 'browser',
    panels: [
      {
        title: 'Cache Hit/Miss Ratio',
        type: 'graph',
        targets: [
          {
            expr: 'rate(redis_keyspace_hits_total[5m])',
            legendFormat: 'Hits',
            refId: 'A',
          },
          {
            expr: 'rate(redis_keyspace_misses_total[5m])',
            legendFormat: 'Misses',
            refId: 'B',
          },
        ],
        gridPos: { h: 8, w: 12, x: 0, y: 0 },
      },
      {
        title: 'Hit Rate %',
        type: 'gauge',
        targets: [
          {
            expr: '(redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total)) * 100',
            legendFormat: 'Hit Rate',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 12, x: 12, y: 0 },
        thresholds: '70,85',
      },
      {
        title: 'Redis Memory Usage',
        type: 'gauge',
        targets: [
          {
            expr: 'redis_memory_used_bytes / (1024 * 1024)',
            legendFormat: 'Memory (MB)',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 6, x: 0, y: 8 },
      },
      {
        title: 'Key Eviction Rate',
        type: 'graph',
        targets: [
          {
            expr: 'rate(redis_evicted_keys_total[5m])',
            legendFormat: 'Evictions/sec',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 12, x: 6, y: 8 },
      },
      {
        title: 'Hot Keys (Top 10)',
        type: 'table',
        targets: [
          {
            expr: 'topk(10, redis_key_access_count)',
            format: 'table',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 12, x: 12, y: 8 },
      },
    ],
  },
};

export const serviceHealthDashboard = {
  dashboard: {
    title: 'Service Health Overview',
    description: 'Per-service availability, error rates, and resource usage',
    tags: ['services', 'health', 'monitoring'],
    timezone: 'browser',
    panels: [
      {
        title: 'Service Availability',
        type: 'table',
        targets: [
          {
            expr: '(1 - (sum by (service) (increase(service_errors_total[5m])) / sum by (service) (increase(service_requests_total[5m])))) * 100',
            format: 'table',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 12, x: 0, y: 0 },
      },
      {
        title: 'Service Error Rates',
        type: 'graph',
        targets: [
          {
            expr: 'sum by (service) (rate(service_errors_total[5m]))',
            legendFormat: '{{service}}',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 12, x: 12, y: 0 },
      },
      {
        title: 'Service Response Time (p95)',
        type: 'graph',
        targets: [
          {
            expr: 'histogram_quantile(0.95, sum by (service) (rate(service_response_time_bucket[5m])))',
            legendFormat: '{{service}}',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 12, x: 0, y: 8 },
      },
      {
        title: 'Memory Usage by Service',
        type: 'graph',
        targets: [
          {
            expr: 'container_memory_working_set_bytes{job=~"service.*"} / (1024*1024)',
            legendFormat: '{{job}}',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 12, x: 12, y: 8 },
      },
      {
        title: 'CPU Usage by Service',
        type: 'graph',
        targets: [
          {
            expr: 'sum by (job) (rate(container_cpu_usage_seconds_total{job=~"service.*"}[5m]))',
            legendFormat: '{{job}}',
            refId: 'A',
          },
        ],
        gridPos: { h: 8, w: 12, x: 0, y: 16 },
      },
    ],
  },
};
