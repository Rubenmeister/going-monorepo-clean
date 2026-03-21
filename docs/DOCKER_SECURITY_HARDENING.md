# Docker Compose Security Hardening

## Overview

This document describes the removal of weak default passwords from the Docker Compose configuration. Default credentials pose a critical security risk in production environments.

## Vulnerability: Weak Default Passwords

### Problem

The docker-compose.yml file contained hardcoded or weakly-defaulted credentials for:

1. **MongoDB**

   - Username: `going_user`
   - Password: `going_password`
   - Used by 12+ microservices

2. **Elasticsearch**

   - Default: `ElasticPassword123!`
   - Weak password pattern

3. **Grafana**

   - Default: `admin`
   - Default username: `admin`

4. **Redis**

   - No password authentication enabled
   - Open to unauthenticated access

5. **JWT_SECRET**
   - Default: `changeme_in_production`
   - Clearly indicates weak default

### Risks

- **Unauthorized Access**: Anyone with access to docker-compose.yml can connect to databases
- **Data Breach**: Malicious actors can access sensitive user data, ride information, payments
- **Privilege Escalation**: Weak credentials could be used to modify application behavior
- **Compliance Violations**: GDPR, PCI-DSS, SOC 2 require strong credentials
- **Lateral Movement**: Compromised database access enables pivot to other services

### Attack Scenario

```bash
# Attacker gets access to docker-compose.yml
cat docker-compose.yml

# Extract weak credentials
MONGODB_URI="mongodb://going_user:going_password@localhost:27017/going_platform"

# Connect directly to database
mongo "$MONGODB_URI"

# Query sensitive data
db.users.find()
db.payments.find()
```

## Solution: Environment-Based Credentials

### Implementation

All default passwords have been removed. Credentials are now environment-variable only:

```yaml
# Before (UNSAFE)
environment:
  MONGO_INITDB_ROOT_USERNAME: going_user
  MONGO_INITDB_ROOT_PASSWORD: going_password

# After (SAFE)
environment:
  MONGO_INITDB_ROOT_USERNAME: ${MONGODB_USERNAME:-}
  MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_PASSWORD:-}
```

### Updated Credentials

| Service       | Variable         | Default | Change               |
| ------------- | ---------------- | ------- | -------------------- |
| MongoDB       | MONGODB_USERNAME | (empty) | Removed weak default |
| MongoDB       | MONGODB_PASSWORD | (empty) | Removed weak default |
| Elasticsearch | ELASTIC_PASSWORD | (empty) | Removed weak default |
| Grafana       | GRAFANA_PASSWORD | (empty) | Removed weak default |
| Redis         | REDIS_PASSWORD   | (empty) | Removed default      |
| JWT           | JWT_SECRET       | (empty) | Removed weak default |

## Setup Instructions

### 1. Create .env.local File

```bash
# For local development
cat > .env.local <<'EOF'
# Database Credentials
MONGODB_USERNAME=dev_user
MONGODB_PASSWORD=SecurePassword123!Dev$(openssl rand -base64 16)

# Cache Credentials
REDIS_PASSWORD=$(openssl rand -base64 32)

# Logging Stack
ELASTIC_PASSWORD=$(openssl rand -base64 32)

# Monitoring
GRAFANA_PASSWORD=$(openssl rand -base64 32)

# Security
JWT_SECRET=$(openssl rand -base64 48)
EOF
```

### 2. Create .env.production File

```bash
# For production - use secrets manager
# DO NOT commit this file
# Use Kubernetes Secrets, AWS Secrets Manager, or HashiCorp Vault

cat > .env.production <<'EOF'
# Use strong, randomly generated passwords only
MONGODB_USERNAME=<from-secrets-manager>
MONGODB_PASSWORD=<from-secrets-manager>
REDIS_PASSWORD=<from-secrets-manager>
ELASTIC_PASSWORD=<from-secrets-manager>
GRAFANA_PASSWORD=<from-secrets-manager>
JWT_SECRET=<from-secrets-manager>
EOF
chmod 600 .env.production
```

### 3. Generate Secure Passwords

```bash
#!/bin/bash
# Generate secure credentials

# Generate random passwords (32+ characters)
MONGODB_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
ELASTIC_PASSWORD=$(openssl rand -base64 32)
GRAFANA_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 48)

echo "Generated secure credentials:"
echo "MONGODB_PASSWORD=$MONGODB_PASSWORD"
echo "REDIS_PASSWORD=$REDIS_PASSWORD"
echo "ELASTIC_PASSWORD=$ELASTIC_PASSWORD"
echo "GRAFANA_PASSWORD=$GRAFANA_PASSWORD"
echo "JWT_SECRET=$JWT_SECRET"
```

### 4. Load Environment Variables

```bash
# Load from .env.local
export $(cat .env.local | xargs)

# Start containers
docker-compose up -d
```

### 5. Verify Credentials Are Set

```bash
# Check that variables are loaded
docker-compose config | grep -E "MONGODB_PASSWORD|REDIS_PASSWORD|ELASTIC_PASSWORD"

# Verify no defaults are used
docker-compose config | grep -E "going_password|ElasticPassword|admin|changeme"
```

## Password Requirements

### MongoDB

- **Minimum Length**: 16 characters
- **Character Set**: Uppercase + Lowercase + Numbers + Symbols
- **Format**: `mongodb://${USERNAME}:${PASSWORD}@host:27017`
- **Example**: `openssl rand -base64 32`

### Redis

- **Minimum Length**: 32 characters
- **Character Set**: Cryptographically random
- **Format**: `redis://:${PASSWORD}@host:6379`
- **Example**: `openssl rand -base64 32`

### Elasticsearch

- **Minimum Length**: 24 characters
- **Complexity**: Mixed case + numbers + symbols
- **Example**: `openssl rand -base64 24`

### Grafana

- **Minimum Length**: 12 characters
- **Complexity**: Mixed case + numbers
- **Example**: `openssl rand -base64 16`

### JWT_SECRET

- **Minimum Length**: 48 characters
- **Requirements**: Highly random, base64-encoded
- **Example**: `openssl rand -base64 48`

## Docker Compose Changes

### Modified Services

All services updated to use environment variables instead of hardcoded credentials:

1. **MongoDB**

   - Credentials now from `MONGODB_USERNAME` and `MONGODB_PASSWORD`
   - All 12+ services updated with new connection format

2. **Redis**

   - Added password requirement via `--requirepass` command
   - Updated all services with new Redis URL format
   - Added password to healthcheck

3. **Elasticsearch**

   - `ELASTIC_PASSWORD` now required (no weak default)

4. **Grafana**

   - `GRAFANA_PASSWORD` now required (no weak default)

5. **JWT_SECRET**
   - Removed weak `changeme_in_production` default

## Security Best Practices

### ✅ DO

- ✅ Use strong, randomly generated passwords (32+ characters)
- ✅ Store credentials in secrets manager (Vault, AWS Secrets Manager, K8s Secrets)
- ✅ Rotate credentials every 90 days
- ✅ Use different credentials for each environment
- ✅ Use TLS/SSL for all database connections
- ✅ Implement role-based access control (RBAC)
- ✅ Enable audit logging for all data access
- ✅ Use environment variables loaded at runtime
- ✅ Restrict database access by IP address (firewall rules)
- ✅ Implement database-level encryption

### ❌ DON'T

- ❌ Never commit passwords to git
- ❌ Never use default passwords in any environment
- ❌ Never use weak patterns like `password123` or `changeme`
- ❌ Never share credentials via email or chat
- ❌ Never hardcode credentials in application code
- ❌ Never use same password across environments
- ❌ Never use simple sequential passwords
- ❌ Never expose ports without authentication
- ❌ Never disable security features for "convenience"

## Production Deployment

### Using Kubernetes Secrets

```bash
# Create MongoDB secret
kubectl create secret generic mongodb-credentials \
  --from-literal=username=$(openssl rand -base64 8) \
  --from-literal=password=$(openssl rand -base64 32)

# Deploy with secrets
kubectl apply -f docker-compose-k8s.yaml

# Verify (secret value is not visible)
kubectl get secret mongodb-credentials
```

### Using Docker Secrets

```bash
# Create secrets in Docker Swarm
docker secret create mongodb_password <(openssl rand -base64 32)
docker secret create redis_password <(openssl rand -base64 32)

# Reference in compose file
services:
  mongodb:
    environment:
      MONGO_INITDB_ROOT_PASSWORD_FILE: /run/secrets/mongodb_password
```

### Using AWS Secrets Manager

```bash
# Store credentials in AWS Secrets Manager
aws secretsmanager create-secret \
  --name going-platform/mongodb-password \
  --secret-string "$(openssl rand -base64 32)"

# Retrieve in Docker Compose
version: '3.8'
services:
  mongodb:
    image: mongo:5.0
    environment:
      MONGO_INITDB_ROOT_PASSWORD: !Sub '{{resolve:secretsmanager:going-platform/mongodb-password}}'
```

## Verification Checklist

- [ ] All passwords removed from docker-compose.yml
- [ ] No hardcoded credentials in any source files
- [ ] Environment variables required for all services
- [ ] Passwords follow minimum length requirements
- [ ] Passwords use strong random generation
- [ ] .env files are in .gitignore
- [ ] Documentation updated with new setup process
- [ ] Local development uses strong credentials
- [ ] Staging uses different credentials than production
- [ ] Production uses secrets manager
- [ ] All developers trained on credential handling
- [ ] Regular credential rotation scheduled
- [ ] Access logs enabled on all databases

## Testing Password Changes

### Test MongoDB Connection

```bash
# With new credentials
docker-compose exec mongodb mongosh \
  --authenticationDatabase admin \
  -u "$MONGODB_USERNAME" \
  -p "$MONGODB_PASSWORD"
```

### Test Redis Connection

```bash
# With new credentials
docker-compose exec redis redis-cli -a "$REDIS_PASSWORD" ping
# Expected output: PONG
```

### Test Elasticsearch Connection

```bash
# With new credentials
curl -u elastic:"$ELASTIC_PASSWORD" http://localhost:9200/_cluster/health
```

### Test Grafana Access

```bash
# Login with new password
curl -X POST http://localhost:3100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user":"admin","password":"'$GRAFANA_PASSWORD'"}'
```

## Migration from Old Credentials

If you have existing containers with old credentials:

```bash
# 1. Stop containers
docker-compose down

# 2. Set new credentials
export $(cat .env.local | xargs)

# 3. Update database credentials
# For MongoDB: Manually update users or use fresh database

# 4. Remove old volumes (if safe to do so)
docker volume rm $(docker volume ls -q)

# 5. Start with new credentials
docker-compose up -d
```

## References

- [OWASP: Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)
- [Elasticsearch Security](https://www.elastic.co/guide/en/elasticsearch/reference/current/security-overview.html)
- [CWE-798: Hard-Coded Credentials](https://cwe.mitre.org/data/definitions/798.html)

## Related Security Fixes

This is part of **P0-5: Remove weak default passwords from docker-compose.yml**:

- **P0-1**: ✅ Remove hardcoded secrets (COMPLETED)
- **P0-2**: ✅ Fix WebSocket CORS configuration (COMPLETED)
- **P0-3**: ✅ Add JWT validation to WebSocket handshakes (COMPLETED)
- **P0-4**: ✅ Replace eval() with safe alternatives (COMPLETED)
- **P0-5**: 🔄 Remove weak default passwords (THIS FIX)
- **P0-6**: ⏳ Implement account lockout Redis operations

---

**Status**: ✅ IMPLEMENTED
**Date**: 2026-02-22
**Impact**: CRITICAL - Prevents unauthorized database access
**Effort**: 1.5 hours
