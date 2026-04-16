# Going Platform - Security Policy

## Overview

This document outlines security practices and vulnerability reporting for the Going Platform.

## Security Features Implemented

### Authentication & Authorization
- ✅ JWT-based authentication on all protected endpoints
- ✅ Bcrypt password hashing (10 salt rounds)
- ✅ JWT token expiration enforcement
- ✅ Bearer token validation via Passport.js
- ✅ Per-service database user credentials

### Transport Security
- ✅ CORS protection (restricted to specific origins)
- ✅ Helmet security headers enabled
  - X-Frame-Options: deny
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security (HSTS)
  - Content-Security-Policy
  - Referrer-Policy

### Input Validation
- ✅ Global ValidationPipe on all services
- ✅ Class-validator DTOs for all endpoints
- ✅ Whitelist mode to strip unknown properties
- ✅ Type coercion and transformation

### Rate Limiting
- ✅ API Gateway rate limiting (100 req/60s)
- ✅ WebSocket CORS restrictions
- ✅ Configurable per-route limits

### Database Security
- ✅ MongoDB authentication enabled
- ✅ Per-service database users with minimal privileges
- ✅ Connection string authentication
- ✅ Admin user for initial setup only

### Secrets Management
- ✅ Environment variable validation schema
- ✅ JWT secrets (32+ character minimum)
- ✅ Kubernetes Secrets integration
- ✅ Docker Compose secrets support

## Known Limitations & Future Improvements

### Current Gaps
- ⚠️ No token refresh mechanism (tokens valid for 24h)
- ⚠️ No token revocation/blacklist
- ⚠️ No 2FA/MFA implementation
- ⚠️ No request signing (vulnerable to replay attacks)
- ⚠️ WebSocket messages not encrypted
- ⚠️ No API request logging for audit trail
- ⚠️ No account lockout after failed logins
- ⚠️ HTTPS enforcement optional (not forced)

### Security Enhancements (Roadmap)
1. **Token Management**
   - Implement refresh tokens
   - Add token revocation/blacklist
   - Shorter token expiration (15 min) + refresh tokens

2. **Advanced Authentication**
   - 2FA/MFA support (TOTP, SMS)
   - OAuth2/OIDC integration
   - API key authentication

3. **Request Security**
   - Request signing for inter-service calls
   - Encrypted WebSocket communication
   - HTTPS enforcement middleware

4. **Audit & Monitoring**
   - Comprehensive audit logging
   - Security event alerting
   - Rate limiting per API key/IP
   - Anomaly detection

5. **Infrastructure**
   - Network policies (Kubernetes)
   - Pod security policies
   - RBAC (Role-Based Access Control)
   - Service mesh mTLS (Istio)

## Reporting Security Vulnerabilities

### Do Not Report Publicly
❌ Do NOT open public GitHub issues for security vulnerabilities
❌ Do NOT post in public forums or social media
❌ Do NOT share vulnerability details publicly

### Report To
✅ Email: security@going.com
✅ Subject: "Security Vulnerability Report"
✅ Include:
   - Detailed description
   - Steps to reproduce
   - Potential impact
   - Your contact information

### Response Timeline
- **Initial Response**: 24 hours
- **Acknowledgment**: 72 hours
- **Fix Timeline**: Severity-dependent
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: 30 days

## Security Best Practices

### For Developers

1. **Never commit secrets**
   ```bash
   # .env files are git ignored
   echo ".env" >> .gitignore
   ```

2. **Use environment variables**
   ```typescript
   const secret = process.env.JWT_SECRET;
   // NOT: const secret = 'hardcoded-value';
   ```

3. **Validate input**
   ```typescript
   export class CreateUserDto {
     @IsEmail()
     email: string;

     @MinLength(8)
     password: string;
   }
   ```

4. **Use HTTPS in production**
   - Configure TLS certificates
   - Use cert-manager on Kubernetes
   - Enforce HTTPS redirects

5. **Implement rate limiting**
   - Per-endpoint limits
   - Per-IP limits
   - Per-user limits (after auth)

6. **Log security events**
   - Authentication attempts
   - Failed validations
   - Rate limit breaches
   - Suspicious patterns

### For DevOps

1. **Secure Kubernetes Deployment**
   ```yaml
   # Use Pod Security Policies
   securityContext:
     runAsNonRoot: true
     readOnlyRootFilesystem: true
     allowPrivilegeEscalation: false
   ```

2. **Network Policies**
   ```bash
   # Restrict inter-pod communication
   kubectl apply -f network-policies.yaml
   ```

3. **RBAC Configuration**
   ```bash
   # Minimal permissions per service
   kubectl create rolebinding user-service-rb \
     --clusterrole=view \
     --serviceaccount=going:user-service
   ```

4. **Secrets Management**
   ```bash
   # Use HashiCorp Vault or cloud provider
   kubectl create secret generic api-secrets \
     --from-literal=jwt-secret='...'
   ```

5. **Image Scanning**
   ```bash
   # Scan for vulnerabilities before deployment
   docker scan api-gateway:v1.0
   ```

## Compliance

### GDPR Compliance
- ✅ User data stored with access controls
- ✅ Password hashing (no plaintext storage)
- ⚠️ TODO: Data export functionality
- ⚠️ TODO: User deletion (right to be forgotten)
- ⚠️ TODO: Data retention policies

### PCI DSS Compliance (if storing payment cards)
- ⚠️ Currently: Only payment intent IDs stored
- ⚠️ TODO: Full PCI compliance if card storage needed
- ⚠️ TODO: Annual security audit requirement

### SOC 2 Compliance
- ⚠️ TODO: Security policies documentation
- ⚠️ TODO: Audit logging and monitoring
- ⚠️ TODO: Access control review
- ⚠️ TODO: Annual SOC 2 assessment

## Security Testing

### Running Security Tests

```bash
# Dependency vulnerability check
npm audit

# SAST (Static Application Security Testing)
npm run lint:security

# Container image scanning
docker scan api-gateway:v1.0

# Kubernetes security audit
kubectl auth can-i --list
```

### Manual Security Testing

1. **SQL/NoSQL Injection**
   ```bash
   curl -X POST http://localhost:3000/api/users \
     -d 'email=test@example.com" OR "1"="1'
   ```

2. **XSS (Cross-Site Scripting)**
   ```bash
   curl -X POST http://localhost:3000/api/update \
     -d 'body=<script>alert("xss")</script>'
   ```

3. **CORS Bypass**
   ```bash
   curl -X GET http://localhost:3000/api/admin \
     -H "Origin: http://attacker.com"
   ```

4. **Authentication Bypass**
   ```bash
   curl -X GET http://localhost:3000/api/protected \
     -H "Authorization: Bearer invalid-token"
   ```

## Incident Response

### If a Vulnerability is Discovered

1. **Immediate Actions** (first 30 minutes)
   - Assess severity
   - Notify security team
   - Prepare communication

2. **Short-term** (first 24 hours)
   - Develop fix
   - Create patch release
   - Update documentation
   - Notify affected users

3. **Long-term** (ongoing)
   - Add regression tests
   - Post-incident review
   - Policy updates
   - Team training

### Public Disclosure
- Minor fixes: Include in next release notes
- Security patches: Publish advisory
- Critical: Coordinated disclosure with users

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)
- [Kubernetes Security](https://kubernetes.io/docs/concepts/security/)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)
