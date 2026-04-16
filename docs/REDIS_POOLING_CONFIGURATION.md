# P1-2: Redis Connection Pooling Configuration

## Overview

Redis connection pooling is critical for maintaining high performance and reliability in distributed systems. This guide details the implementation of optimized Redis connection pooling for the Going Platform.

## Architecture

### Connection Pool Service

**Location**: `/libs/shared/infrastructure/src/services/redis-pool.service.ts`

The `RedisPoolService` manages:

- **Connection Pool Settings**: Max/min connections, retries, queue behavior
- **Timeout Configuration**: Connection, command, and acquisition timeouts
- **Performance Tuning**: Keep-alive, reconnection strategies
- **TTL Strategies**: Different expiration policies for various key types

## Configuration

### Environment Variables

```bash
# Connection Pool
REDIS_URL=redis://localhost:6379
REDIS_MAX_CONNECTIONS=50
REDIS_MIN_IDLE_CONNECTIONS=10
REDIS_MAX_RETRIES=3

# Timeouts (milliseconds)
REDIS_CONN_TIMEOUT=10000
REDIS_CMD_TIMEOUT=5000
REDIS_ACQUIRE_TIMEOUT=2000

# Performance
REDIS_READY_CHECK=true
REDIS_OFFLINE_QUEUE=true
REDIS_RECONNECT_ON_ERROR=true
REDIS_KEEP_ALIVE=true
REDIS_KEEP_ALIVE_INTERVAL=30000

# TTL Strategy (aggressive|balanced|conservative)
REDIS_TTL_STRATEGY=balanced
REDIS_DEFAULT_TTL=3600
```

### Default Configuration by Environment

#### Development

```typescript
{
  maxConnections: 20,
  minIdleConnections: 5,
  maxRetriesPerRequest: 2,
  connectionTimeout: 5000,
  commandTimeout: 2000,
  ttlStrategy: 'aggressive'
}
```

**Use Case**: Local development with lower load

#### Staging

```typescript
{
  maxConnections: 50,
  minIdleConnections: 10,
  maxRetriesPerRequest: 3,
  connectionTimeout: 10000,
  commandTimeout: 5000,
  ttlStrategy: 'balanced'
}
```

**Use Case**: Pre-production testing with moderate load

#### Production

```typescript
{
  maxConnections: 100,
  minIdleConnections: 25,
  maxRetriesPerRequest: 5,
  connectionTimeout: 15000,
  commandTimeout: 8000,
  ttlStrategy: 'conservative'
}
```

**Use Case**: High-throughput, mission-critical systems

## TTL Strategies

### Aggressive (Development)

Shortest expiration times for quick cache refresh:

```typescript
{
  userSession: 1800,      // 30 minutes
  driverLocation: 300,    // 5 minutes
  rideState: 600,         // 10 minutes
  matchingCache: 120,     // 2 minutes
  tempData: 60            // 1 minute
}
```

**Benefits**:

- Minimal memory usage
- Fast data refresh
- Good for testing

**Trade-offs**:

- More database hits
- Higher bandwidth

### Balanced (Staging/Default)

Medium expiration for typical workloads:

```typescript
{
  userSession: 3600,      // 1 hour
  driverLocation: 900,    // 15 minutes
  rideState: 1800,        // 30 minutes
  matchingCache: 300,     // 5 minutes
  tempData: 300           // 5 minutes
}
```

**Benefits**:

- Good cache hit ratio
- Moderate memory usage
- Reasonable database load

**Recommended for**: Most production scenarios

### Conservative (Production)

Longer expiration for maximum cache efficiency:

```typescript
{
  userSession: 7200,      // 2 hours
  driverLocation: 1800,   // 30 minutes
  rideState: 3600,        // 1 hour
  matchingCache: 600,     // 10 minutes
  tempData: 900           // 15 minutes
}
```

**Benefits**:

- Maximum cache efficiency
- Minimal database load
- Lower bandwidth usage

**Trade-offs**:

- More memory usage
- Stale data risk

**Recommended for**: High-traffic production with stable data

## Implementation in Services

### Using RedisPoolService

```typescript
import { RedisPoolService } from '@going-monorepo-clean/shared-infrastructure';

@Injectable()
export class MyRepository {
  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private redisPoolService: RedisPoolService
  ) {}

  async saveData(key: string, data: any): Promise<void> {
    // Get optimized TTL for data type
    const ttlSeconds = this.redisPoolService.getTTL('driverLocation');
    const ttlMs = ttlSeconds * 1000;

    await this.cache.set(key, data, ttlMs);
  }

  getConfig(): RedisPoolConfig {
    return this.redisPoolService.getConfig();
  }
}
```

### Module Registration

```typescript
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisPoolService } from '@going-monorepo-clean/shared-infrastructure';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService, RedisPoolService],
      useFactory: async (
        configService: ConfigService,
        redisPoolService: RedisPoolService
      ) => {
        const storeOptions = redisPoolService.getStoreOptions();
        return {
          store: await redisStore({
            url: configService.get('REDIS_URL'),
            maxRetriesPerRequest: storeOptions.maxRetriesPerRequest,
            enableReadyCheck: storeOptions.enableReadyCheck,
            enableOfflineQueue: storeOptions.enableOfflineQueue,
            connectTimeout: storeOptions.connectTimeout,
            retryStrategy: storeOptions.retryStrategy,
            keepAlive: storeOptions.keepAliveInterval,
          }),
        };
      },
      isGlobal: true,
    }),
  ],
  providers: [RedisPoolService],
})
export class InfrastructureModule {}
```

## Connection Pool Details

### Pool Sizing

**Rule of Thumb**: `maxConnections = concurrent_requests * 1.5`

| Load Profile | Requests/sec | Connections | Min Idle |
| ------------ | ------------ | ----------- | -------- |
| Light        | < 100        | 20          | 5        |
| Moderate     | 100-500      | 50          | 10       |
| Heavy        | 500-2000     | 100         | 25       |
| Extreme      | > 2000       | 150+        | 40+      |

### Connection Acquisition

```
Request → Check Available Connection
          ↓ (if available)
          Use Connection
          ↓ (if not available)
          Wait (up to acquireConnectionTimeout)
          ↓ (if timeout)
          Error: Connection Timeout
```

### Retry Strategy

```typescript
retryStrategy: (times: number) => {
  const delay = Math.min(times * 50, 2000);
  // 1st retry:  50ms
  // 2nd retry: 100ms
  // 3rd retry: 150ms
  // 4th+ retry: 2000ms (max)
  return delay;
};
```

## Performance Optimization

### 1. Connection Reuse

```typescript
// ✅ Good: Reuse connection
const value = await cache.get(key);

// ❌ Bad: Don't create new connections
const redis = require('redis');
const client = redis.createClient();
const value = await client.get(key);
```

### 2. Pipelining

```typescript
// ✅ Good: Pipeline multiple commands
const multi = cache.store.multi();
multi.set('key1', 'value1');
multi.set('key2', 'value2');
multi.get('key1');
await multi.exec();
```

### 3. Batch Operations

```typescript
// ✅ Good: Use mGet for multiple keys
const values = await cache.store.mGet(['key1', 'key2', 'key3']);

// ❌ Bad: Multiple individual gets
const value1 = await cache.get('key1');
const value2 = await cache.get('key2');
const value3 = await cache.get('key3');
```

### 4. TTL Optimization

```typescript
// ✅ Good: Use appropriate TTL for data type
const sessionTTL = redisPoolService.getTTL('userSession');
cache.set('session:123', data, sessionTTL * 1000);

// ❌ Bad: Fixed TTL for all data
cache.set('key', data, 3600000); // Always 1 hour
```

## Monitoring

### Connection Pool Stats

The `RedisPoolService` provides:

```typescript
interface RedisPoolStats {
  connectedClients: number;
  usedMemory: number;
  usedMemoryPeak: number;
  totalCommandsProcessed: number;
  commandsPerSecond: number;
  avgCommandLatency: number;
  connectionPoolUtilization: number;
}
```

### Health Checks

Health checks run every 30 seconds:

```
✅ Successful check   → Continue normal operation
❌ Failed check       → Log error, enable alerts
⚠️  Multiple failures → Trigger connection pool reset
```

## Troubleshooting

### Connection Timeouts

**Symptom**: `Error: Redis connection timeout`

**Solutions**:

1. Increase `REDIS_CONN_TIMEOUT`:

   ```bash
   REDIS_CONN_TIMEOUT=20000  # 20 seconds
   ```

2. Check Redis server availability

3. Verify network connectivity

### Pool Exhaustion

**Symptom**: `Error: Connection pool exhausted`

**Solutions**:

1. Increase `REDIS_MAX_CONNECTIONS`:

   ```bash
   REDIS_MAX_CONNECTIONS=100
   ```

2. Review application load

3. Optimize query patterns (reduce concurrent requests)

### Memory Issues

**Symptom**: Redis memory usage constantly growing

**Solutions**:

1. Reduce `REDIS_DEFAULT_TTL` or switch to 'aggressive' strategy

2. Implement key eviction policy:

   ```bash
   maxmemory-policy allkeys-lru
   ```

3. Monitor large keys:

   ```bash
   redis-cli --bigkeys
   ```

## Best Practices

### 1. Always Use Connection Pool

```typescript
// ✅ Good: Uses pool from CacheModule
@Inject(CACHE_MANAGER) cache: Cache

// ❌ Bad: Direct Redis connection
const redis = require('redis').createClient()
```

### 2. Handle Errors Gracefully

```typescript
try {
  const value = await cache.get(key);
  return value;
} catch (error) {
  // Fallback to database
  return await database.get(key);
}
```

### 3. Monitor TTL Usage

```typescript
// Check remaining TTL
const ttl = await cache.store.ttl(key);
if (ttl < 60) {
  // Refresh if expiring soon
  await cache.set(key, data, ttlMs);
}
```

### 4. Load Balanced Connections

For clustered Redis:

```bash
REDIS_URL=redis://node1,node2,node3
REDIS_CLUSTER=true
REDIS_MAX_CONNECTIONS=50
```

## Performance Metrics

### Expected Performance

| Operation          | Latency | Throughput    |
| ------------------ | ------- | ------------- |
| GET                | < 1ms   | > 50k ops/sec |
| SET                | < 1ms   | > 50k ops/sec |
| MGET (100 keys)    | < 10ms  | > 10k ops/sec |
| Pipeline (10 cmds) | < 5ms   | > 20k ops/sec |

### Monitoring Checklist

- [ ] Connection pool utilization < 80%
- [ ] Average latency < 5ms
- [ ] Memory usage within limits
- [ ] Hit rate > 80%
- [ ] No connection timeouts in logs

## Services Updated

### Phase 1 (Completed)

✅ **Tracking Service**

- `infrastructure.module.ts` - Redis pool integration
- `redis-tracking.repository.ts` - TTL optimization

### Phase 2 (Recommended)

The following services should adopt the same pattern:

- User Auth Service (token caching)
- Transport Service (ride state caching)
- Notifications Service (message queue)
- Payment Service (payment state)
- Analytics Service (metrics aggregation)

## Summary

| Feature                   | Status      | Details                             |
| ------------------------- | ----------- | ----------------------------------- |
| **Pool Service**          | ✅ Complete | Centralized pool management         |
| **Connection Pool**       | ✅ Complete | Configurable min/max connections    |
| **TTL Strategies**        | ✅ Complete | Aggressive/balanced/conservative    |
| **Health Checks**         | ✅ Complete | 30-second monitoring                |
| **Timeout Configuration** | ✅ Complete | Connection/command/acquire timeouts |
| **Keep-Alive**            | ✅ Complete | 30-second TCP keep-alive            |
| **Tracking Service**      | ✅ Complete | Redis pool integration              |
| **Remaining Services**    | 🔄 Planned  | 5+ services to integrate            |

---

**Next Steps**: Integrate Redis pooling into remaining services (auth, transport, notifications, payment, analytics).
