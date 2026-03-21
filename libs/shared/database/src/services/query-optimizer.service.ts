/**
 * Database Query Optimizer Service
 * Monitors, analyzes, and optimizes MongoDB queries
 *
 * Features:
 * - Query performance monitoring
 * - Slow query detection
 * - Index recommendations
 * - Query plan analysis
 * - Connection pool optimization
 * - Read replica routing
 */

import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

export interface QueryMetrics {
  collection: string;
  operation: 'find' | 'insert' | 'update' | 'delete' | 'aggregate';
  query: string;
  duration: number; // ms
  documentsScanned: number;
  documentsReturned: number;
  indexUsed: boolean;
  timestamp: Date;
  isSlow: boolean;
}

export interface SlowQuery {
  query: string;
  collection: string;
  avgDuration: number;
  occurrences: number;
  recommendation: string;
}

export interface IndexRecommendation {
  collection: string;
  field: string;
  type: 'single' | 'compound';
  fields?: string[];
  reason: string;
  estimatedImpact: string;
}

@Injectable()
export class QueryOptimizerService {
  private slowQueries: Map<string, QueryMetrics[]> = new Map();
  private indexRecommendations: IndexRecommendation[] = [];
  private readonly slowQueryThreshold = 200; // ms
  private readonly maxSlowQueriesStored = 1000;

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Record query metrics
   */
  recordQueryMetrics(metrics: QueryMetrics): void {
    const key = `${metrics.collection}:${metrics.operation}`;

    if (!this.slowQueries.has(key)) {
      this.slowQueries.set(key, []);
    }

    // Mark as slow query if duration exceeds threshold
    metrics.isSlow = metrics.duration > this.slowQueryThreshold;

    const queries = this.slowQueries.get(key)!;
    queries.push(metrics);

    // Keep only recent queries
    if (queries.length > this.maxSlowQueriesStored) {
      queries.shift();
    }

    if (metrics.isSlow) {
      this.analyzeSlowQuery(metrics);
    }
  }

  /**
   * Get slow queries for a collection
   */
  getSlowQueries(collection?: string): SlowQuery[] {
    const slowQueries: Map<string, QueryMetrics[]> = new Map();

    // Aggregate slow queries
    for (const [key, metrics] of this.slowQueries.entries()) {
      const [coll] = key.split(':');

      if (collection && coll !== collection) {
        continue;
      }

      const slowMetrics = metrics.filter((m) => m.isSlow);
      if (slowMetrics.length > 0) {
        slowQueries.set(key, slowMetrics);
      }
    }

    // Convert to SlowQuery format
    return Array.from(slowQueries.entries()).map(([key, metrics]) => {
      const [coll, op] = key.split(':');
      const avgDuration =
        metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;

      return {
        query: metrics[0].query,
        collection: coll,
        avgDuration,
        occurrences: metrics.length,
        recommendation: this.generateRecommendation(metrics[0], avgDuration),
      };
    });
  }

  /**
   * Analyze slow query and generate recommendations
   */
  private analyzeSlowQuery(metrics: QueryMetrics): void {
    // Check if index is used
    if (!metrics.indexUsed) {
      const recommendation: IndexRecommendation = {
        collection: metrics.collection,
        field: this.extractFieldFromQuery(metrics.query),
        type: 'single',
        reason: `Query on ${metrics.collection}.${this.extractFieldFromQuery(
          metrics.query
        )} without index`,
        estimatedImpact: `Could reduce query time by 70-90% (from ${metrics.duration}ms)`,
      };

      if (
        !this.indexRecommendations.some((r) => r.field === recommendation.field)
      ) {
        this.indexRecommendations.push(recommendation);
      }
    }

    // Check if many documents were scanned
    if (metrics.documentsScanned > metrics.documentsReturned * 10) {
      console.warn(
        `[QueryOptimizer] High scan inefficiency in ${metrics.collection}: ` +
          `scanned ${metrics.documentsScanned}, returned ${metrics.documentsReturned}`
      );
    }
  }

  /**
   * Generate recommendation text for slow query
   */
  private generateRecommendation(
    metrics: QueryMetrics,
    avgDuration: number
  ): string {
    if (!metrics.indexUsed) {
      return `Add index on: ${this.extractFieldFromQuery(metrics.query)}`;
    }

    if (metrics.documentsScanned > metrics.documentsReturned * 5) {
      return `Query scans ${metrics.documentsScanned} docs, returns ${metrics.documentsReturned}. Consider more selective query.`;
    }

    if (avgDuration > 1000) {
      return `Query takes ${avgDuration.toFixed(
        0
      )}ms. Consider query optimization or caching.`;
    }

    return `Monitor this query, currently averaging ${avgDuration.toFixed(
      0
    )}ms.`;
  }

  /**
   * Extract field from query string
   */
  private extractFieldFromQuery(query: string): string {
    // Simple extraction - in production would be more sophisticated
    const match = query.match(/\{([^:]+):/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Get index recommendations
   */
  getIndexRecommendations(collection?: string): IndexRecommendation[] {
    if (collection) {
      return this.indexRecommendations.filter(
        (r) => r.collection === collection
      );
    }
    return this.indexRecommendations;
  }

  /**
   * Get query performance statistics
   */
  getQueryStats(collection?: string): any {
    const stats = {
      totalQueries: 0,
      slowQueries: 0,
      averageLatency: 0,
      queries: [] as any[],
    };

    let totalDuration = 0;

    for (const [key, metrics] of this.slowQueries.entries()) {
      const [coll] = key.split(':');

      if (collection && coll !== collection) {
        continue;
      }

      stats.totalQueries += metrics.length;
      const slowCount = metrics.filter((m) => m.isSlow).length;
      stats.slowQueries += slowCount;

      totalDuration += metrics.reduce((sum, m) => sum + m.duration, 0);

      stats.queries.push({
        key,
        count: metrics.length,
        slowCount,
        avgDuration: totalDuration / metrics.length,
        indexUsed: metrics.some((m) => m.indexUsed),
      });
    }

    stats.averageLatency =
      stats.totalQueries > 0 ? totalDuration / stats.totalQueries : 0;

    return stats;
  }

  /**
   * Get connection pool statistics
   */
  async getConnectionPoolStats(): Promise<any> {
    // This would connect to MongoDB admin commands
    return {
      activeConnections: 0,
      availableConnections: 0,
      maxConnections: 100,
      poolUtilization: 0,
      waitQueueSize: 0,
      connectionTimeouts: 0,
    };
  }

  /**
   * Recommend read replica routing
   */
  getReadReplicaRecommendation(
    operation: 'find' | 'insert' | 'update' | 'delete' | 'aggregate'
  ): 'primary' | 'secondary' {
    // Route read operations to secondary
    if (['find', 'aggregate'].includes(operation)) {
      return 'secondary';
    }
    // Route writes to primary
    return 'primary';
  }

  /**
   * Generate query optimization report
   */
  generateOptimizationReport(): string {
    const slowQueries = this.getSlowQueries();
    const indexRecommendations = this.getIndexRecommendations();
    const stats = this.getQueryStats();

    let report = `
# Database Query Optimization Report

**Generated**: ${new Date().toISOString()}

## Summary

- **Total Queries Monitored**: ${stats.totalQueries}
- **Slow Queries**: ${stats.slowQueries} (${(
      (stats.slowQueries / stats.totalQueries) *
      100
    ).toFixed(2)}%)
- **Average Query Latency**: ${stats.averageLatency.toFixed(2)}ms

## Slow Queries (Top 10)

| Query | Collection | Avg Duration (ms) | Occurrences | Recommendation |
|-------|-----------|-------------------|-------------|---|
`;

    slowQueries.slice(0, 10).forEach((sq) => {
      report += `| ${sq.query.substring(0, 30)}... | ${
        sq.collection
      } | ${sq.avgDuration.toFixed(2)} | ${sq.occurrences} | ${
        sq.recommendation
      } |\n`;
    });

    report += `

## Index Recommendations

${
  indexRecommendations.length > 0
    ? indexRecommendations
        .map(
          (rec) =>
            `### ${rec.collection}.${rec.field}
- **Type**: ${rec.type}
- **Reason**: ${rec.reason}
- **Estimated Impact**: ${rec.estimatedImpact}`
        )
        .join('\n\n')
    : '✅ No index recommendations at this time'
}

## Query Performance by Operation

| Operation | Count | Avg Duration (ms) | Slow Queries |
|-----------|-------|-------------------|---|
`;

    stats.queries.forEach((q: any) => {
      const [, op] = q.key.split(':');
      report += `| ${op} | ${q.count} | ${q.avgDuration.toFixed(2)} | ${
        q.slowCount
      } |\n`;
    });

    report += `

## Optimization Recommendations

1. **Immediate Actions**
   - Create missing indexes for slow queries
   - Review queries with high document scan ratios
   - Consider query optimization or caching

2. **Short-term (1-2 weeks)**
   - Implement read replica routing for read-heavy operations
   - Optimize frequently scanned collections
   - Update stale index statistics

3. **Medium-term (1 month)**
   - Implement query result caching
   - Profile slow operations in detail
   - Review and optimize data schema

4. **Long-term (quarterly)**
   - Monitor trend in query performance
   - Plan database scaling if needed
   - Review archival strategy for old data

---
Generated on ${new Date().toISOString()}
    `;

    return report;
  }

  /**
   * Initialize monitoring background jobs
   */
  private initializeMonitoring(): void {
    // Clear old metrics every hour
    setInterval(() => {
      const oneHourAgo = Date.now() - 3600000;

      for (const [, metrics] of this.slowQueries.entries()) {
        // Keep only recent metrics
        const filtered = metrics.filter(
          (m) => m.timestamp.getTime() > oneHourAgo
        );
        if (filtered.length === 0) {
          this.slowQueries.delete(
            Array.from(this.slowQueries.keys()).find(
              (k) => this.slowQueries.get(k) === metrics
            )!
          );
        }
      }
    }, 60 * 60 * 1000);

    // Generate report every 6 hours
    setInterval(() => {
      const report = this.generateOptimizationReport();
      console.log('[QueryOptimizer] Generated optimization report');
      // Could send to monitoring system here
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.slowQueries.clear();
    this.indexRecommendations = [];
    console.log('[QueryOptimizer] Metrics reset');
  }
}

export default QueryOptimizerService;
