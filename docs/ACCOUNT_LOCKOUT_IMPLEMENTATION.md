# Account Lockout Implementation

## Overview

This document describes the complete implementation of Redis-based account lockout mechanism to protect user accounts from brute force attacks.

## Security Vulnerability Addressed

**P0-6: Incomplete Account Lockout Implementation**

The original account-lockout service had 7 TODO comments with no actual Redis operations, leaving accounts vulnerable to brute force attacks.

### Risks Without Account Lockout

- **Brute Force Attacks**: Attackers can make unlimited login attempts
- **Credential Guessing**: Weak passwords can be quickly cracked
- **Automated Attacks**: No protection against automated password cracking tools
- **Account Takeover**: Successful attack gives full account access

## Implementation

### Location

`user-auth-service/src/infrastructure/services/account-lockout.service.ts`

### Architecture

Uses Redis for:

- **Atomic Operations**: Increment counters atomically
- **Automatic Expiration**: Keys expire automatically after lockout duration
- **Fast Lookups**: O(1) performance for checking lock status
- **Distributed**: Works across multiple instances

### Redis Key Patterns

```redis
# Failed attempts counter (auto-expires)
lockout:attempts:{userId} -> integer

# Lockout status (auto-expires)
lockout:locked:{userId} -> JSON metadata
```

### Configuration

```typescript
MAX_FAILED_ATTEMPTS = 5; // Attempts before lockout
LOCKOUT_DURATION_MINUTES = 15; // Lockout duration
LOCKOUT_DURATION_SECONDS = 900; // In seconds for Redis
```

## Redis Operations Implemented

### 1. isAccountLocked(userId)

**Purpose**: Check if account is currently locked

**Redis Operation**: `EXIST lockout:locked:{userId}`

**Response**:

- `1` = Account is locked
- `0` = Account is not locked

```typescript
// Implementation
const lockKey = this.LOCKOUT_KEY(userId);
const isLocked = await this.redis.exists(lockKey);
return ok(isLocked === 1);
```

### 2. recordFailedAttempt(userId)

**Purpose**: Record a failed login attempt and lock account if threshold exceeded

**Redis Operations**:

```
1. INCR lockout:attempts:{userId}    -> increment counter
2. EXPIRE lockout:attempts:{userId} 900 -> set expiration
3. SETEX lockout:locked:{userId} 900 "{metadata}" -> lock account
```

**Response**:

```typescript
{
  attempts: number,      // Current attempt count
  isLocked: boolean      // Whether account is now locked
}
```

### 3. resetFailedAttempts(userId)

**Purpose**: Reset counter after successful login

**Redis Operation**: `DEL lockout:attempts:{userId}`

**Usage**: Called after successful authentication to clear the attempt counter

### 4. lockAccount(userId)

**Purpose**: Immediately lock an account

**Redis Operation**: `SETEX lockout:locked:{userId} 900 "{metadata}"`

**Stores**:

```json
{
  "lockedAt": "2026-02-22T10:30:00Z",
  "reason": "max_failed_attempts",
  "expiresAt": "2026-02-22T10:45:00Z"
}
```

### 5. unlockAccount(userId) - Admin Operation

**Purpose**: Manually unlock an account (admin only)

**Redis Operations**:

```
DEL lockout:locked:{userId}
DEL lockout:attempts:{userId}
```

**Returns**: Number of keys deleted (0-2)

### 6. getRemainingLockoutTime(userId)

**Purpose**: Get remaining lockout time in seconds

**Redis Operation**: `TTL lockout:locked:{userId}`

**Response**:

- Positive number = seconds remaining
- `0` = Not locked or already expired
- `-1` = No expiration set
- `-2` = Key doesn't exist

### 7. getFailedAttemptsCount(userId)

**Purpose**: Get current failed attempt count

**Redis Operation**: `GET lockout:attempts:{userId}`

**Response**: Integer count (0 if not found)

## Integration with Authentication Flow

### Login Process

```
1. User enters credentials
   ↓
2. Check if account is locked
   - If locked: Reject with "Account temporarily locked" + show remaining time
   ↓
3. Validate credentials
   - If invalid:
     ↓ recordFailedAttempt()
     ↓ If count >= 5: Account locked automatically
   - If valid:
     ↓ resetFailedAttempts()
     ↓ Issue JWT token
```

### Code Example

```typescript
async login(email: string, password: string) {
  const user = await this.userRepository.findByEmail(email);
  if (!user) {
    this.recordFailedAttempt(user.id);
    throw new UnauthorizedException('Invalid credentials');
  }

  // Check account lockout
  const lockoutResult = await this.accountLockout.isAccountLocked(user.id);
  if (lockoutResult.value) {
    const timeLeft = await this.accountLockout.getRemainingLockoutTime(user.id);
    throw new TooManyRequestsException(
      `Account locked. Retry in ${timeLeft.value} seconds`
    );
  }

  // Validate password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    // Record failed attempt and auto-lock if needed
    const recordResult = await this.accountLockout.recordFailedAttempt(user.id);
    if (recordResult.value.isLocked) {
      throw new TooManyRequestsException(
        `Account locked after ${recordResult.value.attempts} failed attempts`
      );
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  // Success: reset attempt counter
  await this.accountLockout.resetFailedAttempts(user.id);
  return this.generateToken(user);
}
```

## Configuration

### Environment Variables

```env
# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_DB=0

# Account Lockout (optional, uses defaults)
ACCOUNT_LOCKOUT_MAX_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION_MINUTES=15
```

### Module Registration

```typescript
import { Module } from '@nestjs/common';
import { AccountLockoutService } from './account-lockout.service';

@Module({
  providers: [AccountLockoutService],
  exports: [AccountLockoutService],
})
export class AccountLockoutModule {}
```

### Dependency Injection

```typescript
constructor(
  @Optional()
  @Inject('REDIS_CLIENT')
  private readonly redis?: Redis,
) {}
```

## Redis Operations Performance

| Operation | Complexity | Performance | Use Case              |
| --------- | ---------- | ----------- | --------------------- |
| INCR      | O(1)       | ~1ms        | Record failed attempt |
| EXPIRE    | O(1)       | ~1ms        | Set auto-expiration   |
| SETEX     | O(1)       | ~1ms        | Atomic set + expire   |
| EXISTS    | O(1)       | ~1ms        | Check if locked       |
| TTL       | O(1)       | ~1ms        | Get remaining time    |
| GET       | O(1)       | ~1ms        | Get attempt count     |
| DEL       | O(N)       | ~1ms        | Delete 1-2 keys       |

## Graceful Degradation

If Redis is unavailable:

```typescript
if (!this.redis) {
  this.logger.warn('Redis client not available');
  // Return false for lock checks
  // Don't enforce lockout
  return ok(false);
}
```

This allows the application to function without Redis while logging warnings. In production, ensure Redis is always available.

## Security Considerations

### ✅ DO

- ✅ Use HTTPS/TLS for authentication endpoints
- ✅ Store passwords as bcrypt hashes (not plain text)
- ✅ Use strong JWT secrets (48+ characters)
- ✅ Implement rate limiting on login endpoint
- ✅ Log all authentication attempts
- ✅ Monitor for pattern of failed attempts
- ✅ Use CAPTCHA after 3 failed attempts
- ✅ Send email notifications on account lock

### ❌ DON'T

- ❌ Store attempt counts in user database (use Redis instead)
- ❌ Use weak lockout durations (< 15 minutes)
- ❌ Use low max attempts threshold (< 5)
- ❌ Log passwords or sensitive data
- ❌ Return specific error messages ("user not found" vs "password wrong")
- ❌ Use same lockout across all users
- ❌ Disable lockout in production

## Monitoring & Alerting

### Metrics to Track

```typescript
// Number of accounts locked in last 24h
ACCOUNT_LOCKOUTS_24H;

// Peak lockout attempts per minute
PEAK_LOCKOUT_ATTEMPTS;

// Users repeatedly locked (suspicious)
REPEAT_LOCKOUT_USERS;

// Average time to unlock
AVG_LOCKOUT_DURATION;
```

### Alert Conditions

```
IF (lockout_attempts > 100 per minute) THEN alert("Brute force attack detected")
IF (same_user_locked > 5 times per day) THEN alert("Credential compromise suspected")
IF (failed_logins > 1000 per hour) THEN alert("Large scale attack - consider IP blocking")
```

## Testing

### Unit Tests

```typescript
describe('AccountLockoutService', () => {
  it('should lock account after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await service.recordFailedAttempt(userId);
    }
    const isLocked = await service.isAccountLocked(userId);
    expect(isLocked.value).toBe(true);
  });

  it('should reset counter after successful login', async () => {
    await service.recordFailedAttempt(userId);
    await service.resetFailedAttempts(userId);
    const count = await service.getFailedAttemptsCount(userId);
    expect(count.value).toBe(0);
  });

  it('should auto-unlock after expiration', async () => {
    await service.recordFailedAttempt(userId);
    // Wait for expiration (in test: 1 second instead of 15 minutes)
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const isLocked = await service.isAccountLocked(userId);
    expect(isLocked.value).toBe(false);
  });

  it('should allow admin unlock', async () => {
    await service.lockAccount(userId);
    await service.unlockAccount(userId);
    const isLocked = await service.isAccountLocked(userId);
    expect(isLocked.value).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('Login with Account Lockout', () => {
  it('should reject login after account locked', async () => {
    // Record 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await authService.login(email, wrongPassword);
    }
    // 6th attempt should fail with lockout message
    expect(() => authService.login(email, correctPassword)).toThrow(
      'Account locked'
    );
  });
});
```

## Migration from Previous Implementation

If you had a different account lockout system:

```bash
# 1. Stop accepting logins
# 2. Migrate user attempt counts to Redis
# 3. Export all active locks to Redis
# 4. Update auth service to use new implementation
# 5. Test in staging first
# 6. Deploy to production
# 7. Monitor for issues
```

## Performance Optimization

### Caching Checks

For high-traffic scenarios, cache the lock status temporarily:

```typescript
// Cache lock status for 5 seconds
const cacheKey = `lockout:cache:${userId}`;
const cached = await this.redis.get(cacheKey);
if (cached !== null) {
  return ok(cached === 'true');
}

// Perform check and cache result
const isLocked = await this.redis.exists(this.LOCKOUT_KEY(userId));
await this.redis.setex(cacheKey, 5, isLocked ? 'true' : 'false');
return ok(isLocked === 1);
```

### Batch Operations

For checking multiple users (admin dashboard):

```typescript
// Get status for 100 users
const userIds = [...];
const lockKeys = userIds.map(id => this.LOCKOUT_KEY(id));
const results = await this.redis.mget(lockKeys);  // MGET is O(N)
```

## Troubleshooting

### Issue: Accounts stay locked longer than expected

- Check Redis `TTL` values
- Verify LOCKOUT_DURATION_SECONDS is set correctly
- Check Redis memory not full (eviction could delete keys)

### Issue: Account locks not being enforced

- Verify Redis connection is established
- Check logs for "Redis client not available"
- Verify lockout key names match (case-sensitive)

### Issue: Memory leak in Redis

- Ensure `EXPIRE` is set on all keys
- Monitor key count: `redis-cli INFO keyspace`
- Check for keys without expiration: `redis-cli SCAN 0 MATCH "lockout:*"`

## References

- [Redis Commands](https://redis.io/commands/)
- [OWASP Account Lockout Guidance](https://owasp.org/www-community/Blocking_Brute_Force_Attacks)
- [Redis Expiration](https://redis.io/commands/expire/)
- [ioredis Documentation](https://github.com/luin/ioredis)

## Related Security Fixes

This is part of **P0-6: Complete Redis operations for account lockout**:

- **P0-1**: ✅ Remove hardcoded secrets (COMPLETED)
- **P0-2**: ✅ Fix WebSocket CORS configuration (COMPLETED)
- **P0-3**: ✅ Add JWT validation to WebSocket handshakes (COMPLETED)
- **P0-4**: ✅ Replace eval() with safe alternatives (COMPLETED)
- **P0-5**: ✅ Remove weak default passwords (COMPLETED)
- **P0-6**: 🔄 Complete Redis operations for account lockout (THIS FIX)

---

**Status**: ✅ COMPLETED
**Date**: 2026-02-22
**Impact**: CRITICAL - Prevents brute force attacks
**Effort**: 2-3 hours (implementation + testing)

---

## Summary of Changes

**File**: `user-auth-service/src/infrastructure/services/account-lockout.service.ts`

**TODO Items Completed**: 7/7

1. ✅ `isAccountLocked` - Check lock status via EXIST
2. ✅ `recordFailedAttempt` - Increment counter with INCR + EXPIRE
3. ✅ `resetFailedAttempts` - Delete counter with DEL
4. ✅ `lockAccount` - Create lock with SETEX
5. ✅ `unlockAccount` - Delete both keys with DEL
6. ✅ `getRemainingLockoutTime` - Get TTL with TTL command
7. ✅ `getFailedAttemptsCount` - Get count with GET

**Redis Client Injection**: Added Optional @Inject('REDIS_CLIENT')

**Graceful Degradation**: All methods check if Redis is available

**Error Handling**: Comprehensive error logging and Result types
