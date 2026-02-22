/**
 * Cache Optimization Service
 * Manages hot data identification, TTL optimization, and cache invalidation
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'redis';

export interface CacheMetrics {
  keyName: string;
  accessCount: number;
  lastAccessed: number;
  createdAt: number;
  ttl: number;
  size: number; // bytes
  hitRate: number; // percentage
}

export interface HotDataAnalysis {
  hotKeys: CacheMetrics[];
  coldKeys: CacheMetrics[];
  trends: {
    increasingAccess: CacheMetrics[];
    decreasingAccess: CacheMetrics[];
    stable: CacheMetrics[];
  };
}

export interface CacheInvalidationPolicy {
  pattern: string;
  invalidationType: 'immediate' | 'event-based' | 'ttl-based';
  dependencies?: string[];
  ttl?: number;
}

@Injectable()
export class CacheOptimizerService {
  private redisClient: Redis.RedisClient;
  private readonly metricsPrefix = 'cache_metrics';
  private readonly invalidationPrefix = 'cache_invalidation';

  // Default TTL configurations
  private readonly ttlStrategy: Record<string, number> = {
    'user:*': 3600, // 1 hour
    'driver:*': 300, // 5 minutes
    'ride:*': 1800, // 30 minutes
    'pricing:*': 1800, // 30 minutes
    'rating:*': 86400, // 24 hours
    'session:*': 1800, // 30 minutes
    'notification:*': 600, // 10 minutes
  };

  constructor(@Inject('REDIS_CLIENT') redisClient: Redis.RedisClient) {
    this.redisClient = redisClient;
    this.initializeOptimization();
  }

  /**
   * Record cache access for analysis
   */
  async recordAccess(key: string, latency: number = 0): Promise<void> {
    const metricsKey = `${this.metricsPrefix}:${key}`;

    try {
      const now = Date.now();

      // Increment access count
      await this.redisClient.hincrbyAsync(metricsKey, 'accessCount', 1);

      // Update last accessed timestamp
      await this.redisClient.hsetAsync(metricsKey, 'lastAccessed', now);

      // Track latency (simple moving average)
      await this.redisClient.hincrbyfloatAsync(
        metricsKey,
        'latencySum',
        latency
      );
      await this.redisClient.hincrbyAsync(metricsKey, 'latencyCount', 1);

      // Set expiration (keep metrics for 7 days)
      await this.redisClient.expireAsync(metricsKey, 604800);
    } catch (error) {
      console.error('[CacheOptimizer] Error recording access:', error);
    }
  }

  /**
   * Identify hot keys (frequently accessed)
   */
  async findHotKeys(accessThreshold: number = 100): Promise<CacheMetrics[]> {
    const pattern = `${this.metricsPrefix}:*`;
    const keys = await this.getKeys(pattern);

    const hotKeys: CacheMetrics[] = [];

    for (const key of keys) {
      const metrics = await this.getMetrics(key);
      if (metrics && metrics.accessCount > accessThreshold) {
        hotKeys.push(metrics);
      }
    }

    return hotKeys.sort((a, b) => b.accessCount - a.accessCount);
  }

  /**
   * Identify cold keys (rarely accessed)
   */
  async findColdKeys(accessThreshold: number = 1): Promise<CacheMetrics[]> {
    const pattern = `${this.metricsPrefix}:*`;
    const keys = await this.getKeys(pattern);

    const coldKeys: CacheMetrics[] = [];
    const now = Date.now();
    const oneWeekAgo = now - 604800000; // 7 days

    for (const key of keys) {
      const metrics = await this.getMetrics(key);
      if (
        metrics &&
        metrics.accessCount <= accessThreshold &&
        metrics.lastAccessed < oneWeekAgo
      ) {
        coldKeys.push(metrics);
      }
    }

    return coldKeys;
  }

  /**
   * Analyze access patterns and trends
   */
  async analyzePatterns(): Promise<HotDataAnalysis> {
    const hotKeys = await this.findHotKeys(50);
    const coldKeys = await this.findColdKeys();

    // Analyze trends
    const trends = {
      increasingAccess: [] as CacheMetrics[],
      decreasingAccess: [] as CacheMetrics[],
      stable: [] as CacheMetrics[],
    };

    for (const key of hotKeys) {
      const trend = await this.calculateTrend(key.keyName);
      if (trend > 0.2) {
        trends.increasingAccess.push(key);
      } else if (trend < -0.2) {
        trends.decreasingAccess.push(key);
      } else {
        trends.stable.push(key);
      }
    }

    return {
      hotKeys,
      coldKeys,
      trends,
    };
  }

  /**
   * Register cache invalidation policy
   */
  async registerInvalidationPolicy(
    policy: CacheInvalidationPolicy
  ): Promise<void> {
    const policyKey = `${this.invalidationPrefix}:${policy.pattern}`;

    try {
      await this.redisClient.hsetAsync(policyKey, {
        pattern: policy.pattern,
        invalidationType: policy.invalidationType,
        dependencies: JSON.stringify(policy.dependencies || []),
        ttl: policy.ttl || 0,
      });

      // Set policy expiration (30 days)
      await this.redisClient.expireAsync(policyKey, 2592000);

      console.log(
        `[CacheOptimizer] Policy registered for pattern: ${policy.pattern}`
      );
    } catch (error) {
      console.error('[CacheOptimizer] Error registering policy:', error);
    }
  }

  /**
   * Invalidate cache with cascading support
   */
  async invalidate(pattern: string, cascade: boolean = true): Promise<number> {
    const keys = await this.getKeys(pattern);
    let invalidated = 0;

    for (const key of keys) {
      // Delete the cache key
      await this.redisClient.delAsync(key);
      invalidated++;

      // Invalidate dependent keys if cascade enabled
      if (cascade) {
        const dependentPattern = await this.getDependentPattern(pattern);
        if (dependentPattern) {
          const dependentKeys = await this.getKeys(dependentPattern);
          for (const depKey of dependentKeys) {
            await this.redisClient.delAsync(depKey);
            invalidated++;
          }
        }
      }
    }

    console.log(`[CacheOptimizer] Invalidated ${invalidated} cache keys`);
    return invalidated;
  }

  /**
   * Batch invalidation with better performance
   */
  async invalidateBatch(patterns: string[]): Promise<number> {
    let totalInvalidated = 0;

    for (const pattern of patterns) {
      totalInvalidated += await this.invalidate(pattern, false);
    }

    return totalInvalidated;
  }

  /**
   * Optimize TTL based on access patterns
   */
  async optimizeTTL(key: string): Promise<number> {
    const metrics = await this.getMetrics(`${this.metricsPrefix}:${key}`);
    if (!metrics) {
      return -1;
    }

    // Get current TTL
    const currentTTL = await this.getTTL(key);

    // Calculate optimal TTL based on access rate
    const accessRate =
      metrics.accessCount / ((Date.now() - metrics.createdAt) / 1000); // accesses per second
    let optimalTTL = currentTTL;

    if (accessRate > 10) {
      // Hot key: use longer TTL
      optimalTTL = 3600; // 1 hour
    } else if (accessRate > 1) {
      // Warm key: medium TTL
      optimalTTL = 1800; // 30 minutes
    } else if (accessRate > 0.1) {
      // Lukewarm key: shorter TTL
      optimalTTL = 300; // 5 minutes
    } else {
      // Cold key: very short TTL
      optimalTTL = 60; // 1 minute
    }

    // Apply optimized TTL
    if (optimalTTL !== currentTTL) {
      await this.redisClient.expireAsync(key, optimalTTL);
      console.log(
        `[CacheOptimizer] TTL optimized for ${key}: ${currentTTL}s → ${optimalTTL}s`
      );
    }

    return optimalTTL;
  }

  /**
   * Get cache statistics
   */
  async getStatistics(): Promise<any> {
    const hotKeys = await this.findHotKeys();
    const coldKeys = await this.findColdKeys();

    // Get Redis info
    const redisInfo = await this.getRedisInfo();

    const stats = {
      totalKeys: hotKeys.length + coldKeys.length,
      hotKeysCount: hotKeys.length,
      coldKeysCount: coldKeys.length,
      memoryUsed: redisInfo.memory_used_human,
      memoryPeak: redisInfo.used_memory_peak_human,
      fragmentationRatio: redisInfo.mem_fragmentation_ratio,
      evictedKeys: redisInfo.evicted_keys,
      hitRate:
        parseInt(redisInfo.keyspace_hits, 10) /
        (parseInt(redisInfo.keyspace_hits, 10) +
          parseInt(redisInfo.keyspace_misses, 10)),
      topHotKeys: hotKeys.slice(0, 10),
      topColdKeys: coldKeys.slice(0, 10),
    };

    return stats;
  }

  /**
   * Cleanup expired metrics
   */
  async cleanupMetrics(): Promise<number> {
    const pattern = `${this.metricsPrefix}:*`;
    const keys = await this.getKeys(pattern);

    let cleaned = 0;
    const now = Date.now();
    const oneMonthAgo = now - 2592000000; // 30 days

    for (const key of keys) {
      const metricsKey = key;
      const data = await this.getMetrics(metricsKey);

      if (data && data.lastAccessed < oneMonthAgo) {
        await this.redisClient.delAsync(metricsKey);
        cleaned++;
      }
    }

    console.log(`[CacheOptimizer] Cleaned up ${cleaned} old metric entries`);
    return cleaned;
  }

  /**
   * Private helper to get metrics for a key
   */
  private async getMetrics(metricsKey: string): Promise<CacheMetrics | null> {
    try {
      const data = await this.redisClient.hgetallAsync(metricsKey);
      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      const keyName = metricsKey.replace(`${this.metricsPrefix}:`, '');

      return {
        keyName,
        accessCount: parseInt(data.accessCount || '0', 10),
        lastAccessed: parseInt(data.lastAccessed || '0', 10),
        createdAt: parseInt(data.createdAt || Date.now(), 10),
        ttl: await this.getTTL(keyName),
        size: 0, // Would need additional tracking
        hitRate: parseFloat(data.hitRate || '0'),
      };
    } catch (error) {
      console.error('[CacheOptimizer] Error getting metrics:', error);
      return null;
    }
  }

  /**
   * Calculate access trend (positive = increasing, negative = decreasing)
   */
  private async calculateTrend(key: string): Promise<number> {
    const metricsKey = `${this.metricsPrefix}:${key}`;
    const data = await this.redisClient.hgetallAsync(metricsKey);

    if (!data) return 0;

    const accessCount = parseInt(data.accessCount || '0', 10);
    const createdAt = parseInt(data.createdAt || Date.now(), 10);
    const lastAccessed = parseInt(data.lastAccessed || Date.now(), 10);

    const ageMs = Date.now() - createdAt;
    const recentAccessMs = Date.now() - lastAccessed;

    // Calculate trend: recent activity relative to total age
    if (recentAccessMs > ageMs / 2) {
      return -0.5; // Cold (not accessed in second half of lifetime)
    }

    const recentRate = 1 / (recentAccessMs / 1000);
    const avgRate = accessCount / (ageMs / 1000);

    return recentRate / avgRate - 1;
  }

  /**
   * Get TTL for a key
   */
  private async getTTL(key: string): Promise<number> {
    return new Promise((resolve) => {
      this.redisClient.ttl(key, (err, ttl) => {
        if (err) {
          console.error('[CacheOptimizer] Error getting TTL:', err);
          resolve(-1);
        } else {
          resolve(ttl);
        }
      });
    });
  }

  /**
   * Get dependent pattern for cascading invalidation
   */
  private async getDependentPattern(pattern: string): Promise<string | null> {
    const policies = await this.getKeys(`${this.invalidationPrefix}:*`);

    for (const policyKey of policies) {
      const policy = await this.redisClient.hgetallAsync(policyKey);
      if (policy && policy.dependencies) {
        const deps = JSON.parse(policy.dependencies);
        if (deps.includes(pattern)) {
          return policy.pattern;
        }
      }
    }

    return null;
  }

  /**
   * Get Redis INFO stats
   */
  private async getRedisInfo(): Promise<any> {
    return new Promise((resolve) => {
      this.redisClient.info((err, info) => {
        if (err) {
          console.error('[CacheOptimizer] Error getting Redis info:', err);
          resolve({});
        } else {
          const lines = info.split('\r\n');
          const result: any = {};
          lines.forEach((line) => {
            const [key, value] = line.split(':');
            if (key && value) {
              result[key] = value;
            }
          });
          resolve(result);
        }
      });
    });
  }

  /**
   * Get keys matching pattern
   */
  private getKeys(pattern: string): Promise<string[]> {
    return new Promise((resolve) => {
      this.redisClient.keys(pattern, (err, keys) => {
        if (err) {
          console.error('[CacheOptimizer] Error getting keys:', err);
          resolve([]);
        } else {
          resolve(keys || []);
        }
      });
    });
  }

  /**
   * Initialize optimization jobs
   */
  private initializeOptimization(): void {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupMetrics();
    }, 60 * 60 * 1000);

    // Run optimization analysis every 6 hours
    setInterval(() => {
      this.analyzePatterns();
    }, 6 * 60 * 60 * 1000);
  }
}

export default CacheOptimizerService;
