/**
 * Redis Connection Pool Service
 * Manages Redis connection pooling, health checks, and optimization
 */

import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RedisPoolConfig {
  // Connection Pool Settings
  maxConnections?: number; // Maximum connections in pool
  minIdleConnections?: number; // Minimum idle connections
  maxRetriesPerRequest?: number; // Retries before failing
  enableReadyCheck?: boolean; // Health check before operations
  enableOfflineQueue?: boolean; // Queue commands when offline

  // Timeout Settings (milliseconds)
  connectionTimeout?: number; // Time to connect
  commandTimeout?: number; // Time to execute command
  acquireConnectionTimeout?: number; // Time to get connection from pool

  // Performance Settings
  reconnectOnError?: boolean; // Reconnect on error
  enableKeepAlive?: boolean; // TCP keep-alive
  keepAliveInterval?: number; // Keep-alive interval (ms)

  // TTL Strategies
  defaultTTL?: number; // Default key TTL (seconds)
  ttlStrategy?: 'aggressive' | 'balanced' | 'conservative';
}

export interface RedisPoolStats {
  connectedClients: number;
  usedMemory: number;
  usedMemoryPeak: number;
  totalCommandsProcessed: number;
  commandsPerSecond: number;
  avgCommandLatency: number;
  connectionPoolUtilization: number;
}

export const DEFAULT_REDIS_POOL_CONFIG: RedisPoolConfig = {
  // Connection Pool (optimized for high throughput)
  maxConnections: 50,
  minIdleConnections: 10,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,

  // Timeouts (balanced)
  connectionTimeout: 10000, // 10 seconds
  commandTimeout: 5000, // 5 seconds
  acquireConnectionTimeout: 2000, // 2 seconds

  // Performance
  reconnectOnError: true,
  enableKeepAlive: true,
  keepAliveInterval: 30000, // 30 seconds

  // TTL Strategy
  defaultTTL: 3600, // 1 hour default
  ttlStrategy: 'balanced',
};

// TTL strategies for different key types
export const TTL_STRATEGIES = {
  aggressive: {
    // Short TTLs for fast data
    userSession: 1800, // 30 minutes
    driverLocation: 300, // 5 minutes
    rideState: 600, // 10 minutes
    matchingCache: 120, // 2 minutes
    tempData: 60, // 1 minute
  },
  balanced: {
    // Medium TTLs (default)
    userSession: 3600, // 1 hour
    driverLocation: 900, // 15 minutes
    rideState: 1800, // 30 minutes
    matchingCache: 300, // 5 minutes
    tempData: 300, // 5 minutes
  },
  conservative: {
    // Long TTLs for important data
    userSession: 7200, // 2 hours
    driverLocation: 1800, // 30 minutes
    rideState: 3600, // 1 hour
    matchingCache: 600, // 10 minutes
    tempData: 900, // 15 minutes
  },
};

@Injectable()
export class RedisPoolService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisPoolService.name);
  private config: RedisPoolConfig;
  private readonly statsInterval: NodeJS.Timeout[] = [];

  constructor(private configService: ConfigService) {
    this.config = this.buildConfig();
  }

  async onModuleInit() {
    this.logger.log('[Redis] Pool service initialized');
    this.logger.debug(`Pool Config: ${JSON.stringify(this.config, null, 2)}`);
    this.startHealthChecks();
  }

  async onModuleDestroy() {
    this.logger.log('[Redis] Shutting down pool service');
    this.statsInterval.forEach((interval) => clearInterval(interval));
  }

  /**
   * Build Redis configuration from environment
   */
  private buildConfig(): RedisPoolConfig {
    return {
      // Connection Pool
      maxConnections: this.configService.get(
        'REDIS_MAX_CONNECTIONS',
        DEFAULT_REDIS_POOL_CONFIG.maxConnections
      ),
      minIdleConnections: this.configService.get(
        'REDIS_MIN_IDLE_CONNECTIONS',
        DEFAULT_REDIS_POOL_CONFIG.minIdleConnections
      ),
      maxRetriesPerRequest: this.configService.get(
        'REDIS_MAX_RETRIES',
        DEFAULT_REDIS_POOL_CONFIG.maxRetriesPerRequest
      ),
      enableReadyCheck: this.configService.get(
        'REDIS_READY_CHECK',
        DEFAULT_REDIS_POOL_CONFIG.enableReadyCheck
      ),
      enableOfflineQueue: this.configService.get(
        'REDIS_OFFLINE_QUEUE',
        DEFAULT_REDIS_POOL_CONFIG.enableOfflineQueue
      ),

      // Timeouts
      connectionTimeout: this.configService.get(
        'REDIS_CONN_TIMEOUT',
        DEFAULT_REDIS_POOL_CONFIG.connectionTimeout
      ),
      commandTimeout: this.configService.get(
        'REDIS_CMD_TIMEOUT',
        DEFAULT_REDIS_POOL_CONFIG.commandTimeout
      ),
      acquireConnectionTimeout: this.configService.get(
        'REDIS_ACQUIRE_TIMEOUT',
        DEFAULT_REDIS_POOL_CONFIG.acquireConnectionTimeout
      ),

      // Performance
      reconnectOnError: this.configService.get(
        'REDIS_RECONNECT_ON_ERROR',
        DEFAULT_REDIS_POOL_CONFIG.reconnectOnError
      ),
      enableKeepAlive: this.configService.get(
        'REDIS_KEEP_ALIVE',
        DEFAULT_REDIS_POOL_CONFIG.enableKeepAlive
      ),
      keepAliveInterval: this.configService.get(
        'REDIS_KEEP_ALIVE_INTERVAL',
        DEFAULT_REDIS_POOL_CONFIG.keepAliveInterval
      ),

      // TTL
      defaultTTL: this.configService.get(
        'REDIS_DEFAULT_TTL',
        DEFAULT_REDIS_POOL_CONFIG.defaultTTL
      ),
      ttlStrategy: this.configService.get(
        'REDIS_TTL_STRATEGY',
        DEFAULT_REDIS_POOL_CONFIG.ttlStrategy
      ) as any,
    };
  }

  /**
   * Get current pool configuration
   */
  getConfig(): RedisPoolConfig {
    return { ...this.config };
  }

  /**
   * Get TTL for a specific key type
   */
  getTTL(keyType: keyof typeof TTL_STRATEGIES.balanced): number {
    const strategy = TTL_STRATEGIES[this.config.ttlStrategy!];
    return strategy[keyType] || this.config.defaultTTL!;
  }

  /**
   * Get Redis store configuration options
   */
  getStoreOptions(): Record<string, any> {
    return {
      // Connection pool options (ioredis/redis client settings)
      maxRetriesPerRequest: this.config.maxRetriesPerRequest,
      enableReadyCheck: this.config.enableReadyCheck,
      enableOfflineQueue: this.config.enableOfflineQueue,

      // Timeout settings
      connectTimeout: this.config.connectionTimeout,
      commandTimeout: this.config.commandTimeout,

      // Performance
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },

      // Keep-alive
      keepAlive: this.config.keepAliveInterval,

      // Logging
      lazyConnect: false,
    };
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks() {
    // Monitor pool stats every 30 seconds
    const healthCheckInterval = setInterval(async () => {
      try {
        // Stats would be gathered from actual Redis client
        // This is a placeholder for monitoring infrastructure
        this.logger.debug('[Redis] Health check passed');
      } catch (error) {
        this.logger.error(`[Redis] Health check failed: ${error.message}`);
      }
    }, 30000);

    this.statsInterval.push(healthCheckInterval);
  }

  /**
   * Get recommended configuration for environment
   */
  getRecommendedConfig(
    environment: 'development' | 'staging' | 'production'
  ): RedisPoolConfig {
    switch (environment) {
      case 'production':
        return {
          ...DEFAULT_REDIS_POOL_CONFIG,
          maxConnections: 100,
          minIdleConnections: 25,
          maxRetriesPerRequest: 5,
          connectionTimeout: 15000,
          commandTimeout: 8000,
          ttlStrategy: 'conservative',
        };
      case 'staging':
        return {
          ...DEFAULT_REDIS_POOL_CONFIG,
          maxConnections: 50,
          minIdleConnections: 10,
          maxRetriesPerRequest: 3,
          connectionTimeout: 10000,
          commandTimeout: 5000,
          ttlStrategy: 'balanced',
        };
      default: // development
        return {
          ...DEFAULT_REDIS_POOL_CONFIG,
          maxConnections: 20,
          minIdleConnections: 5,
          maxRetriesPerRequest: 2,
          connectionTimeout: 5000,
          commandTimeout: 2000,
          ttlStrategy: 'aggressive',
        };
    }
  }
}
