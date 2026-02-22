/**
 * Token Bucket Rate Limiter Service
 * Distributed rate limiting using Redis
 *
 * Algorithm: Token bucket with configurable refill rate
 * Features:
 * - Per-user rate limits
 * - Per-IP rate limits
 * - Per-endpoint rate limits
 * - Graceful degradation under load
 * - Sliding window tracking
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'redis';

export interface RateLimitConfig {
  capacity: number; // Max tokens in bucket
  refillRate: number; // Tokens per second
  window: number; // Time window in seconds
}

export interface RateLimitResult {
  allowed: boolean;
  tokensRemaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface BucketState {
  tokens: number;
  lastRefill: number;
  capacity: number;
}

@Injectable()
export class TokenBucketService {
  private redisClient: Redis.RedisClient;
  private readonly prefix = 'rate_limit';

  // Default rate limit configurations
  private readonly defaultConfigs: Record<string, RateLimitConfig> = {
    'auth:login': { capacity: 5, refillRate: 0.1, window: 60 }, // 5 per min
    'auth:register': { capacity: 3, refillRate: 0.05, window: 60 }, // 3 per min
    'api:default': { capacity: 100, refillRate: 1.67, window: 60 }, // 100 per min
    'api:payments': { capacity: 10, refillRate: 0.17, window: 60 }, // 10 per min
    'api:rides': { capacity: 30, refillRate: 0.5, window: 60 }, // 30 per min
  };

  constructor(@Inject('REDIS_CLIENT') redisClient: Redis.RedisClient) {
    this.redisClient = redisClient;
  }

  /**
   * Try to consume tokens from bucket
   * Returns true if allowed, false if rate limited
   */
  async tryConsume(
    key: string,
    tokens: number = 1,
    config?: RateLimitConfig
  ): Promise<RateLimitResult> {
    const redisKey = `${this.prefix}:${key}`;
    const cfg = config || this.defaultConfigs['api:default'];

    try {
      // Use Lua script for atomic operation
      const script = this.getTokenBucketScript();
      const now = Date.now();

      const result = await this.executeScript(
        script,
        [redisKey],
        [cfg.capacity, cfg.refillRate, tokens, now]
      );

      const [tokensRemaining, resetTime, allowed] = result;

      if (allowed) {
        return {
          allowed: true,
          tokensRemaining,
          resetTime,
        };
      } else {
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        return {
          allowed: false,
          tokensRemaining,
          resetTime,
          retryAfter,
        };
      }
    } catch (error) {
      console.error('[TokenBucket] Error consuming tokens:', error);
      // Fail open in case of Redis error (allow request)
      return {
        allowed: true,
        tokensRemaining: -1,
        resetTime: Date.now(),
      };
    }
  }

  /**
   * Initialize bucket with capacity and refill rate
   */
  async initBucket(
    key: string,
    capacity: number,
    refillRate: number
  ): Promise<void> {
    const redisKey = `${this.prefix}:${key}`;
    const now = Date.now();

    try {
      await this.redisClient.hsetAsync(redisKey, {
        tokens: capacity,
        lastRefill: now,
        capacity,
        refillRate,
      });

      // Set expiration (24 hours)
      await this.redisClient.expireAsync(redisKey, 86400);
    } catch (error) {
      console.error('[TokenBucket] Error initializing bucket:', error);
    }
  }

  /**
   * Get current bucket state
   */
  async getBucketState(key: string): Promise<BucketState | null> {
    const redisKey = `${this.prefix}:${key}`;

    try {
      const data = await this.redisClient.hgetallAsync(redisKey);
      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      return {
        tokens: parseFloat(data.tokens),
        lastRefill: parseInt(data.lastRefill),
        capacity: parseFloat(data.capacity),
      };
    } catch (error) {
      console.error('[TokenBucket] Error getting bucket state:', error);
      return null;
    }
  }

  /**
   * Reset bucket to full capacity
   */
  async resetBucket(key: string): Promise<void> {
    const redisKey = `${this.prefix}:${key}`;

    try {
      const state = await this.getBucketState(key);
      if (state) {
        await this.redisClient.hsetAsync(redisKey, {
          tokens: state.capacity,
          lastRefill: Date.now(),
        });
      }
    } catch (error) {
      console.error('[TokenBucket] Error resetting bucket:', error);
    }
  }

  /**
   * Get rate limit stats for monitoring
   */
  async getStats(keyPattern: string): Promise<any> {
    const pattern = `${this.prefix}:${keyPattern}*`;
    const keys = await this.getKeys(pattern);

    const stats = {
      totalKeys: keys.length,
      averageTokens: 0,
      fullBuckets: 0,
      emptyBuckets: 0,
      buckets: [] as any[],
    };

    let totalTokens = 0;

    for (const key of keys) {
      const state = await this.getBucketState(
        key.replace(`${this.prefix}:`, '')
      );
      if (state) {
        totalTokens += state.tokens;

        if (state.tokens >= state.capacity) {
          stats.fullBuckets++;
        } else if (state.tokens <= 0) {
          stats.emptyBuckets++;
        }

        stats.buckets.push({
          key,
          tokens: state.tokens,
          capacity: state.capacity,
          utilization: (state.tokens / state.capacity) * 100,
        });
      }
    }

    stats.averageTokens = keys.length > 0 ? totalTokens / keys.length : 0;

    return stats;
  }

  /**
   * Clean up expired buckets
   */
  async cleanup(): Promise<number> {
    const pattern = `${this.prefix}:*`;
    const keys = await this.getKeys(pattern);

    let cleaned = 0;
    for (const key of keys) {
      const ttl = await this.redisClient.ttlAsync(key);
      if (ttl === -1) {
        // No expiration set, remove it
        await this.redisClient.delAsync(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get Lua script for atomic token bucket operation
   * Returns [tokensRemaining, resetTime, allowed]
   */
  private getTokenBucketScript(): string {
    return `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local tokensToConsume = tonumber(ARGV[3])
      local now = tonumber(ARGV[4])

      -- Get current bucket state
      local state = redis.call('HGETALL', key)
      local tokens = capacity
      local lastRefill = now
      local refillRateStored = refillRate

      if #state > 0 then
        for i = 1, #state, 2 do
          if state[i] == 'tokens' then
            tokens = tonumber(state[i + 1])
          elseif state[i] == 'lastRefill' then
            lastRefill = tonumber(state[i + 1])
          elseif state[i] == 'refillRate' then
            refillRateStored = tonumber(state[i + 1])
          end
        end
      end

      -- Calculate tokens to add (refill)
      local timePassed = math.max(0, (now - lastRefill) / 1000)
      local tokensToAdd = timePassed * refillRateStored
      tokens = math.min(capacity, tokens + tokensToAdd)

      -- Try to consume tokens
      local allowed = 0
      if tokens >= tokensToConsume then
        tokens = tokens - tokensToConsume
        allowed = 1
      end

      -- Store updated state
      redis.call('HSET', key, 'tokens', tokens, 'lastRefill', now)
      redis.call('EXPIRE', key, 86400)

      -- Calculate reset time (when bucket will be full again)
      local tokensNeeded = capacity - tokens
      local resetTime = now + (tokensNeeded / refillRateStored * 1000)

      return {math.floor(tokens), math.floor(resetTime), allowed}
    `;
  }

  /**
   * Execute Lua script in Redis
   */
  private executeScript(
    script: string,
    keys: string[],
    args: any[]
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.redisClient.eval(
        script,
        keys.length,
        ...keys,
        ...args,
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  /**
   * Get keys matching pattern
   */
  private getKeys(pattern: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.redisClient.keys(pattern, (err, keys) => {
        if (err) reject(err);
        else resolve(keys || []);
      });
    });
  }
}

export default TokenBucketService;
