# WebSocket CORS Security Configuration

## Vulnerability: Wildcard CORS Origin

### Problem

WebSocket gateways were configured with `cors: { origin: '*' }` which allows any origin to connect to the WebSocket server. This is a critical security vulnerability that enables:

- **Cross-Site WebSocket Hijacking (CSWSH)**: Malicious websites can establish WebSocket connections on behalf of authenticated users
- **Session Hijacking**: Attackers can intercept and manipulate real-time location tracking data
- **Data Exfiltration**: Sensitive driver location and ride information can be exposed
- **Denial of Service**: Attackers can flood WebSocket connections from any origin

### Affected Files

1. `api-gateway/src/tracking/tracking.gateway.ts` - Line 15
2. `tracking-service/src/infrastructure/gateways/socket-io-tracking.gateway.ts` - Line 9

### Files Already Fixed

- `tracking-service/src/api/tracking.gateway.ts` - Already uses environment-configurable CORS origins

---

## Solution: Whitelist Specific Origins

### Implementation

Replace wildcard CORS configuration with environment-configurable origin whitelisting:

```typescript
@WebSocketGateway({
  cors: {
    origin: (process.env.WEBSOCKET_CORS_ORIGINS || process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(','),
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
})
```

### Configuration

#### Environment Variables

```env
# Primary WebSocket CORS origins (comma-separated)
WEBSOCKET_CORS_ORIGINS=https://app.going-platform.com,https://admin.going-platform.com

# Fallback CORS origins (used if WEBSOCKET_CORS_ORIGINS not set)
CORS_ORIGINS=https://app.going-platform.com,https://admin.going-platform.com

# Enable credentials (cookies, auth headers) in WebSocket requests
WEBSOCKET_CORS_CREDENTIALS=true
```

### Environment-Specific Examples

**Development**

```env
WEBSOCKET_CORS_ORIGINS=http://localhost:3000,http://localhost:3001
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Staging**

```env
WEBSOCKET_CORS_ORIGINS=https://staging-app.going-platform.com,https://staging-admin.going-platform.com
CORS_ORIGINS=https://staging-app.going-platform.com,https://staging-admin.going-platform.com
```

**Production**

```env
WEBSOCKET_CORS_ORIGINS=https://app.going-platform.com
CORS_ORIGINS=https://app.going-platform.com
```

---

## Security Best Practices

### 1. Origins Should Be Explicit

✅ **Correct** - Specific origins only

```env
WEBSOCKET_CORS_ORIGINS=https://app.going-platform.com,https://admin.going-platform.com
```

❌ **Incorrect** - Using wildcard

```env
WEBSOCKET_CORS_ORIGINS=*
```

### 2. Use HTTPS in Production

✅ **Correct** - Secure scheme

```env
WEBSOCKET_CORS_ORIGINS=https://app.going-platform.com
```

❌ **Incorrect** - Insecure scheme

```env
WEBSOCKET_CORS_ORIGINS=http://app.going-platform.com
```

### 3. Validate Origin During Handshake

Implement server-side validation for additional security:

```typescript
handleConnection(client: Socket) {
  const origin = client.request.headers.origin;
  const allowedOrigins = (process.env.WEBSOCKET_CORS_ORIGINS || 'http://localhost:3000').split(',');

  if (!allowedOrigins.includes(origin)) {
    this.logger.warn(`Rejected connection from unauthorized origin: ${origin}`);
    client.disconnect();
    return;
  }

  this.logger.log(`Client connected from origin: ${origin}`);
}
```

### 4. Credentials Configuration

Ensure credentials are only enabled when necessary:

```typescript
cors: {
  origin: [...],
  credentials: true,  // Only if you need to send cookies/auth headers
  methods: ['GET', 'POST'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}
```

---

## Testing CORS Configuration

### Test 1: Valid Origin Should Connect

```bash
# From allowed origin
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Origin: https://app.going-platform.com" \
  http://localhost:3000/socket.io/?transport=websocket
```

Expected: HTTP 101 (Upgrade successful)

### Test 2: Invalid Origin Should Reject

```bash
# From disallowed origin
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Origin: https://malicious-site.com" \
  http://localhost:3000/socket.io/?transport=websocket
```

Expected: HTTP 403 (Forbidden) or CORS error

### Test 3: Verify CORS Headers

```bash
curl -i -X OPTIONS \
  -H "Origin: https://app.going-platform.com" \
  -H "Access-Control-Request-Method: GET" \
  http://localhost:3000/socket.io/
```

Expected: Response includes `Access-Control-Allow-Origin: https://app.going-platform.com`

---

## Verification Checklist

- [ ] Both WebSocket gateway files use environment-configurable origins
- [ ] `.env.example` documents `WEBSOCKET_CORS_ORIGINS` and `CORS_ORIGINS`
- [ ] Environment-specific `.env.*` files have correct origins for each environment
- [ ] `credentials: true` is set when authentication is used
- [ ] `methods: ['GET', 'POST']` restricts allowed HTTP methods
- [ ] `allowedHeaders: ['Authorization', 'Content-Type']` specifies required headers
- [ ] Production origins use HTTPS scheme
- [ ] No wildcard (`*`) origins in production
- [ ] CORS validation tests pass
- [ ] Load tests verify WebSocket connections work with new configuration

---

## Related Security Fixes

This is part of **P0-2: Fix CORS vulnerabilities** in the critical security remediation:

- **P0-1**: ✅ Remove hardcoded secrets (COMPLETED)
- **P0-2**: 🔄 Fix WebSocket CORS configuration (THIS FIX)
- **P0-3**: ⏳ Add JWT validation to WebSocket handshakes
- **P0-4**: ⏳ Replace eval() with safe alternatives
- **P0-5**: ⏳ Fix Docker Compose default passwords
- **P0-6**: ⏳ Implement account lockout Redis operations

---

## References

- [Socket.io CORS Documentation](https://socket.io/docs/v4/handling-cors/)
- [OWASP Cross-Site WebSocket Hijacking](<https://owasp.org/www-community/attacks/csrf/CSRF_-_Cross-Site_WebSocket_Hijacking_(CSWSH)>)
- [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [NestJS WebSocket Documentation](https://docs.nestjs.com/websockets/gateway)

---

**Status**: ✅ IMPLEMENTED
**Date**: 2026-02-22
**Reviewer**: Security Team
**Impact**: CRITICAL - Prevents Cross-Site WebSocket Hijacking attacks
