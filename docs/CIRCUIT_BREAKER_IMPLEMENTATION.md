# P1-5: Circuit Breaker Implementation Guide

## Overview

The circuit breaker pattern is a critical resilience pattern that prevents cascading failures when external services are unavailable. It acts as a "circuit" that automatically stops sending requests to failing services.

## Circuit Breaker States

```
         Failure Threshold Exceeded
                    ↓
    [CLOSED] ──────→ [OPEN] ──────→ [HALF_OPEN] ──────→ [CLOSED]
    Normal     (Trip)    Fails Fast  (Test Recovery)  (Recovered)
   Operation            For Requests
```

### State Definitions

#### CLOSED (Normal Operation)

- ✅ **Status**: Service is healthy
- ✅ **Behavior**: All requests pass through
- ✅ **Metrics**: Successes tracked, failures reset on consecutive success
- ✅ **Example**: Payment service responding successfully

#### OPEN (Circuit Tripped)

- ❌ **Status**: Service is failing
- ❌ **Behavior**: Requests immediately rejected (fail fast)
- ❌ **Duration**: Fixed timeout (default: 60 seconds)
- ❌ **Purpose**: Prevent overwhelming failing service
- ❌ **Example**: Stripe API timeout after 5 consecutive failures

#### HALF_OPEN (Testing Recovery)

- 🔄 **Status**: Testing if service recovered
- 🔄 **Behavior**: Limited requests allowed
- 🔄 **Success**: If N successes → CLOSED
- 🔄 **Failure**: If 1 failure → OPEN
- 🔄 **Purpose**: Gracefully restore service
- 🔄 **Example**: Attempting Stripe connection after 60s timeout

## Configuration

### Default Configuration

```typescript
const DEFAULT_CONFIG = {
  failureThreshold: 5, // Open circuit after 5 failures
  successThreshold: 2, // Close circuit after 2 successes (half-open)
  timeout: 60000, // 60 seconds before attempting recovery
  volumeThreshold: 10, // Minimum 10 requests before threshold check
  fallbackFunction: undefined, // Optional fallback on circuit open
};
```

### Configuration per Service Type

#### Critical External Services (Payments, Auth)

```typescript
{
  failureThreshold: 3,      // Trip faster
  successThreshold: 3,      // Require more successes to close
  timeout: 30000,           // Faster recovery attempts (30s)
  volumeThreshold: 5,       // Lower volume threshold
}
```

#### Standard External Services (Notifications, Analytics)

```typescript
{
  failureThreshold: 5,      // Default
  successThreshold: 2,      // Default
  timeout: 60000,           // Default (60s)
  volumeThreshold: 10,      // Default
}
```

#### Non-Critical Services (Reporting, Suggestions)

```typescript
{
  failureThreshold: 10,     // More tolerant
  successThreshold: 2,      // Default
  timeout: 120000,          // Longer timeout (2 minutes)
  volumeThreshold: 20,      // Higher volume threshold
}
```

## Implementation Methods

### Method 1: Using Decorator (Recommended)

```typescript
import { WithCircuitBreaker } from '@going-monorepo-clean/shared-infrastructure';

@Injectable()
export class PaymentService {
  constructor(private stripe: StripeClient) {}

  @WithCircuitBreaker({
    failureThreshold: 3,
    timeout: 30000,
    fallbackFunction: async (error) => ({
      success: false,
      error: 'Payment service temporarily unavailable',
      originalError: error.message,
    }),
  })
  async processPayment(
    amount: number,
    customerId: string
  ): Promise<PaymentResult> {
    return this.stripe.charges.create({
      amount,
      customer: customerId,
      currency: 'USD',
    });
  }
}
```

### Method 2: Manual Circuit Breaker

```typescript
import { CircuitBreakerFactory } from '@going-monorepo-clean/shared-infrastructure';

@Injectable()
export class NotificationService {
  private firebaseBreaker: CircuitBreaker;

  constructor(
    private firebase: FirebaseAdminSDK,
    private cbFactory: CircuitBreakerFactory
  ) {
    this.firebaseBreaker = cbFactory.create({
      name: 'firebase-notifications',
      failureThreshold: 5,
      timeout: 60000,
      fallbackFunction: async (error) => {
        // Queue notification for retry
        await this.queueNotification(notification);
        return { queued: true };
      },
    });
  }

  async sendPushNotification(notification: Notification): Promise<Result> {
    return this.firebaseBreaker.execute(
      () => this.firebase.messaging().send(notification),
      { serviceName: 'Firebase', operationName: 'sendPush' }
    );
  }
}
```

### Method 3: Factory Service (Enterprise)

```typescript
import { CircuitBreakerFactory } from '@going-monorepo-clean/shared-infrastructure';

@Injectable()
export class ExternalServicesModule {
  constructor(private cbFactory: CircuitBreakerFactory) {
    this.initializeBreakers();
  }

  private initializeBreakers(): void {
    // Payment services
    this.cbFactory.create({
      name: 'stripe-payments',
      failureThreshold: 3,
      timeout: 30000,
    });

    this.cbFactory.create({
      name: 'stripe-webhooks',
      failureThreshold: 5,
      timeout: 60000,
    });

    // Notification services
    this.cbFactory.create({
      name: 'firebase-push',
      failureThreshold: 5,
      timeout: 60000,
    });

    this.cbFactory.create({
      name: 'sendgrid-email',
      failureThreshold: 5,
      timeout: 60000,
    });

    // Tracking services
    this.cbFactory.create({
      name: 'location-tracking',
      failureThreshold: 5,
      timeout: 30000,
    });
  }
}
```

## Target External Services

### 1. Payment Service (Stripe)

**File**: `payment-service/src/infrastructure/gateways/stripe.gateway.ts`

**Criticality**: 🔴 CRITICAL

**Implementation**:

```typescript
@Injectable()
export class StripeGateway {
  @WithCircuitBreaker({
    failureThreshold: 3,
    timeout: 30000,
    fallbackFunction: async (error) => {
      // Queue payment for retry
      await this.queuePayment();
      return { pending: true, retryAfter: 60 };
    },
  })
  async createPaymentIntent(
    amount: number,
    currency: string
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create({
      amount,
      currency,
    });
  }

  @WithCircuitBreaker({
    failureThreshold: 3,
    timeout: 30000,
  })
  async confirmPaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.confirm(paymentIntentId);
  }
}
```

### 2. Firebase Push Notifications

**File**: `notifications-service/src/infrastructure/gateways/push-notification.gateway.ts`

**Criticality**: 🟡 IMPORTANT

**Implementation**:

```typescript
@Injectable()
export class PushNotificationGateway {
  @WithCircuitBreaker({
    failureThreshold: 5,
    timeout: 60000,
    fallbackFunction: async (error) => {
      // Queue for batch retry
      return { queued: true };
    },
  })
  async send(message: admin.messaging.Message): Promise<string> {
    return admin.messaging().send(message);
  }

  @WithCircuitBreaker({
    failureThreshold: 5,
    timeout: 60000,
  })
  async sendBatch(
    messages: admin.messaging.Message[]
  ): Promise<admin.messaging.BatchResponse> {
    return admin.messaging().sendAll(messages);
  }
}
```

### 3. Email Notifications (SendGrid)

**File**: `notifications-service/src/infrastructure/gateways/email-notification.gateway.ts`

**Criticality**: 🟡 IMPORTANT

**Implementation**:

```typescript
@Injectable()
export class EmailNotificationGateway {
  @WithCircuitBreaker({
    failureThreshold: 5,
    timeout: 60000,
    fallbackFunction: async (error) => {
      // Queue email for async retry
      return { queued: true };
    },
  })
  async send(email: EmailMessage): Promise<SendGridResponse> {
    return sgMail.send(email);
  }
}
```

### 4. SMS Notifications (Twilio)

**File**: `notifications-service/src/infrastructure/gateways/sms-notification.gateway.ts`

**Criticality**: 🟡 IMPORTANT

**Implementation**:

```typescript
@Injectable()
export class SmsNotificationGateway {
  @WithCircuitBreaker({
    failureThreshold: 5,
    timeout: 60000,
    fallbackFunction: async (error) => {
      // Queue SMS for batch send
      return { queued: true };
    },
  })
  async send(phoneNumber: string, message: string): Promise<TwilioResponse> {
    return this.twilioClient.messages.create({
      from: process.env.TWILIO_PHONE,
      to: phoneNumber,
      body: message,
    });
  }
}
```

### 5. WebSocket Gateway (Real-time Updates)

**File**: `transport-service/src/infrastructure/gateways/ride-dispatch.gateway.ts`

**Criticality**: 🟡 IMPORTANT

**Implementation**:

```typescript
@Injectable()
export class RideDispatchGateway {
  @WithCircuitBreaker({
    failureThreshold: 5,
    timeout: 30000,
  })
  async broadcastRideMatches(
    driverId: string,
    matches: RideMatch[]
  ): Promise<void> {
    this.io.to(driverId).emit('ride:matches', matches);
  }

  @WithCircuitBreaker({
    failureThreshold: 5,
    timeout: 30000,
  })
  async broadcastRideStatusUpdate(
    rideId: string,
    status: RideStatus
  ): Promise<void> {
    this.io.to(`ride:${rideId}`).emit('status:updated', status);
  }
}
```

### 6. Location Tracking Service

**File**: `tracking-service/src/infrastructure/gateways/location-tracking.gateway.ts`

**Criticality**: 🟡 IMPORTANT

**Implementation**:

```typescript
@Injectable()
export class LocationTrackingGateway {
  @WithCircuitBreaker({
    failureThreshold: 5,
    timeout: 30000,
  })
  async updateDriverLocation(
    driverId: string,
    location: Location
  ): Promise<void> {
    await this.redis.set(
      `driver:location:${driverId}`,
      JSON.stringify(location)
    );
  }

  @WithCircuitBreaker({
    failureThreshold: 5,
    timeout: 30000,
  })
  async getNearbyDrivers(
    latitude: number,
    longitude: number,
    radius: number
  ): Promise<Driver[]> {
    return this.redis.geosearch(`drivers`, {
      latitude,
      longitude,
      radius,
    });
  }
}
```

## Monitoring & Observability

### Health Check Endpoint

```typescript
@Controller('health')
export class HealthController {
  constructor(private cbFactory: CircuitBreakerFactory) {}

  @Get('circuit-breakers')
  getCircuitBreakerHealth() {
    return this.cbFactory.getHealth();
  }

  @Get('circuit-breakers/:name')
  getCircuitBreakerMetrics(@Param('name') name: string) {
    const breaker = this.cbFactory.get(name);
    if (!breaker) {
      throw new NotFoundException(`Circuit breaker ${name} not found`);
    }
    return breaker.getMetrics();
  }
}
```

### Prometheus Metrics

```typescript
import { Counter, Gauge, Histogram } from 'prom-client';

const circuitBreakerStateGauge = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
  labelNames: ['breaker_name'],
});

const circuitBreakerFailuresCounter = new Counter({
  name: 'circuit_breaker_failures_total',
  help: 'Total failures recorded by circuit breaker',
  labelNames: ['breaker_name'],
});

const circuitBreakerSuccessesCounter = new Counter({
  name: 'circuit_breaker_successes_total',
  help: 'Total successes recorded by circuit breaker',
  labelNames: ['breaker_name'],
});
```

### Logging Strategy

```typescript
// On state change
this.logger.warn(
  `[ALERT] Circuit breaker ${name} transitioned to ${newState}`,
  {
    previousState,
    failures: failureCount,
    timestamp: new Date(),
    lastError: lastErrorMessage,
  }
);

// On fallback execution
this.logger.info(`[FALLBACK] Executing fallback for ${name}`, {
  reason: error.message,
  fallbackFunction: typeof fallbackFunction,
});
```

## Testing Circuit Breakers

```typescript
describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      name: 'test-breaker',
      failureThreshold: 3,
      timeout: 1000,
    });
  });

  it('should trip circuit after failure threshold', async () => {
    let callCount = 0;
    const failingFn = async () => {
      callCount++;
      throw new Error('Service unavailable');
    };

    // First 3 calls fail
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(failingFn);
      } catch {
        // Expected
      }
    }

    expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);

    // Fourth call should fail immediately without calling function
    try {
      await breaker.execute(failingFn);
    } catch {
      // Expected
    }

    expect(callCount).toBe(3); // Function not called 4th time
  });

  it('should recover to CLOSED after successes in HALF_OPEN', async () => {
    // Move to OPEN
    const failingFn = async () => {
      throw new Error('Service down');
    };

    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(failingFn);
      } catch {}
    }

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Succeed twice
    const successFn = async () => 'success';
    await breaker.execute(successFn);
    await breaker.execute(successFn);

    expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
  });
});
```

## Deployment Checklist

- [ ] Circuit breakers configured for all 7 external services
- [ ] Fallback strategies implemented for each service
- [ ] Monitoring endpoints configured
- [ ] Prometheus metrics exported
- [ ] Alerting rules created for OPEN state
- [ ] Load testing with simulated failures
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Staging validation passed
- [ ] Production deployment plan reviewed

## Fallback Strategies

### Payment Service

```typescript
// Queue for retry
// Notify customer of delay
// Provide manual payment option
```

### Notification Service

```typescript
// Queue notifications
// Retry with exponential backoff
// Degrade to text-only if needed
```

### Tracking Service

```typescript
// Use cached location
// Gracefully degrade precision
// Log for offline processing
```

### WebSocket/Real-time

```typescript
// Degrade to polling
// Cache last known state
// Queue updates for sync
```

## Metrics to Monitor

| Metric          | Threshold | Action                     |
| --------------- | --------- | -------------------------- |
| Circuit OPEN    | Any       | Page on-call engineer      |
| Failure Rate    | >20%      | Review recent changes      |
| Recovery Time   | >5min     | Investigate service health |
| False Positives | >2/day    | Adjust thresholds          |

## Summary

| Component                   | Status      | Details                                   |
| --------------------------- | ----------- | ----------------------------------------- |
| **Circuit Breaker Service** | ✅ Complete | State machine, metrics, logging           |
| **Decorator Pattern**       | ✅ Complete | Easy integration with @WithCircuitBreaker |
| **Factory Service**         | ✅ Complete | Centralized management                    |
| **Stripe Gateway**          | 🔄 Ready    | Payment service protection                |
| **Firebase Gateway**        | 🔄 Ready    | Push notifications                        |
| **Email/SMS Gateways**      | 🔄 Ready    | Multi-channel notifications               |
| **Tracking Gateway**        | 🔄 Ready    | Location services                         |
| **WebSocket Gateway**       | 🔄 Ready    | Real-time updates                         |
| **Tests**                   | 🔄 Ready    | Unit + integration tests                  |
| **Monitoring**              | 🔄 Ready    | Health endpoints + metrics                |

---

**Next Steps**: Apply circuit breaker to all 7 external services, run load tests, deploy to staging.
