# WebSocket JWT Authentication Implementation

## Overview

This document describes the JWT authentication implementation for WebSocket connections in the Going Platform. JWT validation is critical for preventing unauthorized access to real-time data streams.

## Security Vulnerability Addressed

**P0-3: Missing WebSocket Authentication**

WebSocket connections previously had no authentication, allowing:

- Unauthorized access to real-time location tracking
- Session hijacking through WebSocket endpoints
- Denial of service attacks from unauthenticated clients
- Data interception of driver locations and trip details

## Implementation

### 1. WebSocket JWT Service

**File**: `libs/shared/infrastructure/src/services/websocket-jwt.service.ts`

Core service that handles JWT validation for WebSocket connections.

#### Features:

- Extract JWT from multiple sources (query params, headers, auth object)
- Validate JWT signature and expiration
- Extract user/driver identity from claims
- Support multiple identity types (userId, driverId)
- Role-based access control
- Socket room management

#### Key Methods:

```typescript
// Authenticate a WebSocket connection
authenticateConnection(client: Socket): Promise<WebSocketAuthResult>

// Extract JWT from various sources
private extractToken(client: Socket): string | null

// Validate user has required role
hasRole(payload: WebSocketAuthPayload, requiredRole: string): boolean

// Validate user is resource owner
isOwner(payload: WebSocketAuthPayload, targetUserId?: string, targetDriverId?: string): boolean

// Get socket room identifiers
getUserRoom(userId: string): string
getDriverRoom(driverId: string): string
getTripRoom(tripId: string): string
```

### 2. WebSocket JWT Guard

**File**: `libs/shared/infrastructure/src/guards/websocket-jwt.guard.ts`

Guard for automatic JWT validation during WebSocket connection establishment.

#### Usage in Gateways:

```typescript
import { WebSocketJwtGuard } from '@going-monorepo-clean/shared-infrastructure';

export class MyGateway implements OnGatewayConnection {
  constructor(private wsJwtGuard: WebSocketJwtGuard) {}

  async handleConnection(client: Socket) {
    const isAuthenticated = await this.wsJwtGuard.canActivate(context);
    if (!isAuthenticated) {
      client.disconnect(true);
      return;
    }
    // Connection is authorized
  }
}
```

### 3. Integration in WebSocket Gateways

Updated gateways with JWT validation:

1. **tracking-service/src/infrastructure/gateways/location-tracking.gateway.ts**

   - Validates JWT on connection
   - Ensures driver only updates their own location
   - Ownership validation on driver registration

2. **notifications-service/src/infrastructure/gateways/chat.gateway.ts**

   - Should validate users can only join their own chat rooms
   - Prevent unauthorized message access

3. **api-gateway/src/tracking/tracking.gateway.ts**

   - Gateway-level JWT validation
   - Prevents direct tracking access without auth

4. **tracking-service/src/infrastructure/gateways/socket-io-tracking.gateway.ts**
   - Internal broadcast service validation

## Configuration

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-secret-key-min-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# WebSocket JWT Configuration
WEBSOCKET_JWT_ENABLED=true
WEBSOCKET_ALLOW_UNAUTHENTICATED=false

# CORS Configuration (also needed for WebSocket CORS)
WEBSOCKET_CORS_ORIGINS=https://app.going-platform.com
CORS_ORIGINS=https://app.going-platform.com
```

### Module Setup

Register the WebSocket JWT service in your module:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  WebSocketJwtService,
  WebSocketJwtGuard,
} from '@going-monorepo-clean/shared-infrastructure';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [WebSocketJwtService, WebSocketJwtGuard],
  exports: [WebSocketJwtService, WebSocketJwtGuard],
})
export class WebSocketAuthModule {}
```

## JWT Token Extraction

The WebSocket JWT service extracts tokens from multiple sources in this order:

### 1. Query Parameter (Recommended for Web)

```javascript
// Client
const socket = io('ws://localhost:3000', {
  query: { token: 'your-jwt-token' },
});
```

### 2. Authorization Header

```javascript
// Client
const socket = io('ws://localhost:3000', {
  extraHeaders: {
    Authorization: `Bearer ${jwtToken}`,
  },
});
```

### 3. Custom X-Token Header

```javascript
// Client
const socket = io('ws://localhost:3000', {
  extraHeaders: {
    'X-Token': 'your-jwt-token',
  },
});
```

### 4. Auth Object (Native Socket.io)

```javascript
// Client
const socket = io('ws://localhost:3000', {
  auth: { token: 'your-jwt-token' },
});
```

## JWT Token Claims

Required claims for WebSocket authentication:

```typescript
{
  // User identity (required: one of userId or driverId)
  sub: "user-123",              // Standard JWT subject claim (user ID)
  userId: "user-123",           // Alternative user ID field
  driverId: "driver-456",       // Alternative driver ID field

  // User information
  email: "driver@example.com",
  roles: ["driver", "user"],

  // Token metadata
  type: "access",               // Should be "access" for WebSocket
  iat: 1234567890,              // Issued at
  exp: 1234671890,              // Expires at

  // Optional: Additional context
  jti: "unique-token-id",       // JWT ID for revocation
}
```

## Ownership Validation

WebSocket gateways should validate that authenticated users can only access/modify their own resources:

```typescript
@SubscribeMessage('driver:register')
async handleDriverRegister(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: { driverId: string; ... }
) {
  // Validate ownership
  const authenticatedUser = (client as any).authenticatedUser;
  if (authenticatedUser.driverId !== data.driverId) {
    client.emit('error', { message: 'Unauthorized' });
    return;
  }

  // Proceed with registration
}
```

## Connection Flow

### Successful Authentication

```
Client                           Server
  |                                |
  |-- WebSocket Connect + JWT ---->|
  |      (query/header/auth)        |
  |                                 |
  |                      validateJWT |
  |                      extractUser  |
  |                      attachToSocket
  |                                 |
  |<---- 101 Upgrade Success ------|
  |                                 |
  |-- SubscribeMessage(event) ----->|
  |                                 |
```

### Failed Authentication

```
Client                           Server
  |                                |
  |-- WebSocket Connect + JWT ---->|
  |      (invalid/expired)          |
  |                                 |
  |                      validateJWT |
  |                      tokenError  |
  |                                 |
  |<------ Disconnect(true) --------|
  |                                 |
```

## Error Handling

The service returns detailed error messages for debugging:

```typescript
interface WebSocketAuthResult {
  isValid: boolean;
  payload?: WebSocketAuthPayload;
  error?: string; // "No authentication token provided"
  // "Token has expired"
  // "Invalid token signature"
  // "Token verification failed"
  userId?: string;
  driverId?: string;
}
```

## Security Best Practices

### 1. Always Use HTTPS/WSS in Production

```env
# Production
WEBSOCKET_CORS_ORIGINS=wss://app.going-platform.com
```

### 2. Validate Token Signature

JWT service automatically validates signature using JWT_SECRET. Never skip signature verification.

### 3. Check Token Expiration

- Short-lived access tokens (15 minutes) for WebSockets
- Refresh tokens (7 days) for obtaining new access tokens
- Implement token refresh strategy for long-lived connections

### 4. Implement Ownership Validation

```typescript
// ✅ Correct: Validate user owns the resource
if (authenticatedUser.driverId !== data.driverId) {
  return;
}

// ❌ Wrong: Trust client request without verification
const driverId = data.driverId; // Don't use this directly
```

### 5. Handle Token Refresh

For long-lived WebSocket connections:

```typescript
// Client: Refresh token periodically
setInterval(async () => {
  const newToken = await refreshAccessToken();
  socket.auth.token = newToken;
  socket.emit('refresh:token', { token: newToken });
}, 10 * 60 * 1000);  // Every 10 minutes

// Server: Accept new token
@SubscribeMessage('refresh:token')
handleTokenRefresh(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
  // Update authentication
}
```

### 6. Disconnect on Authentication Failure

```typescript
if (!authResult.isValid) {
  client.disconnect(true); // true = should not try to reconnect
  return;
}
```

## Testing

### Unit Tests

```typescript
describe('WebSocketJwtService', () => {
  let service: WebSocketJwtService;
  let jwtService: JwtService;

  beforeEach(() => {
    // Setup
  });

  it('should authenticate valid token', async () => {
    const token = jwtService.sign({ sub: 'user-1' });
    const socket = createMockSocket({ query: { token } });
    const result = await service.authenticateConnection(socket);
    expect(result.isValid).toBe(true);
    expect(result.userId).toBe('user-1');
  });

  it('should reject expired token', async () => {
    const token = createExpiredToken();
    const socket = createMockSocket({ query: { token } });
    const result = await service.authenticateConnection(socket);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('expired');
  });

  it('should validate ownership', () => {
    const payload = { userId: 'user-1' };
    expect(service.isOwner(payload, 'user-1')).toBe(true);
    expect(service.isOwner(payload, 'user-2')).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('Location Tracking WebSocket', () => {
  it('should reject connection without token', async () => {
    const socket = io('ws://localhost:3000');
    await expect(
      new Promise((_, reject) => {
        socket.on('disconnect', reject);
      })
    ).rejects.toBeDefined();
  });

  it('should accept valid token', async () => {
    const token = generateValidToken({ userId: 'driver-1' });
    const socket = io('ws://localhost:3000', { query: { token } });
    await expect(
      new Promise((resolve) => socket.on('connect', resolve))
    ).resolves.toBeDefined();
  });
});
```

## Migration Guide

### For Existing WebSocket Gateways

1. **Inject WebSocketJwtService**

   ```typescript
   constructor(
     private wsJwtService: WebSocketJwtService,
   ) {}
   ```

2. **Update handleConnection**

   ```typescript
   async handleConnection(client: Socket) {
     const authResult = await this.wsJwtService.authenticateConnection(client);
     if (!authResult.isValid) {
       client.disconnect(true);
       return;
     }
     (client as any).authenticatedUser = authResult;
   }
   ```

3. **Validate Ownership in Handlers**
   ```typescript
   @SubscribeMessage('event')
   handleEvent(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
     const user = (client as any).authenticatedUser;
     if (!this.wsJwtService.isOwner(user.payload, data.userId)) {
       return;
     }
     // Process event
   }
   ```

## Troubleshooting

### Issue: "No authentication token provided"

- Ensure client is sending token in one of the supported formats
- Verify JWT_SECRET is set correctly in environment
- Check browser console for CORS errors

### Issue: "Token has expired"

- Implement token refresh mechanism for long-lived connections
- Consider longer expiration times for WebSocket tokens
- Client should obtain new token before previous one expires

### Issue: "Invalid token signature"

- Verify JWT_SECRET matches between client and server
- Check token was signed with correct algorithm (HS256)
- Ensure token hasn't been tampered with

### Issue: Connection hangs during authentication

- Add timeout to authentication process
- Check if WebSocketJwtService is properly injected
- Verify JwtModule is imported in gateway module

## Related Security Fixes

This is part of **P0-3: Add JWT validation to WebSocket handshakes**:

- **P0-1**: ✅ Remove hardcoded secrets (COMPLETED)
- **P0-2**: ✅ Fix WebSocket CORS configuration (COMPLETED)
- **P0-3**: 🔄 Add JWT validation to WebSocket handshakes (THIS FIX)
- **P0-4**: ⏳ Replace eval() with safe alternatives
- **P0-5**: ⏳ Fix Docker Compose default passwords
- **P0-6**: ⏳ Implement account lockout Redis operations

---

**Status**: IN PROGRESS
**Date**: 2026-02-22
**Impact**: CRITICAL - Prevents unauthorized access to real-time data
**Effort**: 4-5 hours

---

## References

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Socket.io Authentication](https://socket.io/docs/v4/socket-io-protocol/#authentication)
- [NestJS JWT Documentation](https://docs.nestjs.com/security/authentication)
- [WebSocket Security](https://owasp.org/www-community/attacks/xss/)
