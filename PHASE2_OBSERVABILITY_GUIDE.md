# Phase 2: Observability + E2E Tests + CD Pipeline

## Overview

Phase 2 focuses on three critical areas:

1. **Observability** - Comprehensive logging, metrics, and health checks
2. **E2E Tests** - Expanded automated test coverage
3. **Continuous Deployment** - Complete deployment pipeline to Kubernetes

## Part 1: Observability Implementation

### What's Been Set Up

#### 1.1 ELK Stack (Elasticsearch, Logstash, Kibana)

**Docker Compose**: Added to `docker-compose.yml`

- **Elasticsearch** (9200): Log storage and full-text search
- **Kibana** (5601): Log visualization and analysis
- **Logstash** (5000): Log processing and enrichment

**Kubernetes**: Manifests in `k8s/base/`

- `elasticsearch.yaml` - StatefulSet with persistent storage
- `kibana.yaml` - Deployment with Ingress
- Secure authentication with elastic/password

#### 1.2 Prometheus + Grafana

**Docker Compose**: Added to `docker-compose.yml`

- **Prometheus** (9090): Metrics collection and storage
- **Grafana** (3100): Metrics visualization and alerting

**Kubernetes**: Manifests in `k8s/base/`

- `prometheus.yaml` - Deployment with RBAC for auto-discovery
- `grafana.yaml` - Deployment with datasource provisioning

#### 1.3 Observability Library

**Location**: `libs/shared/observability/`

Core components:

- **Winston Logger**: Structured logging with multiple transports
- **Prometheus Metrics**: Standard metrics for all services
- **Health Checks**: Standardized health endpoints

### Implementation Steps

#### Step 1: Start Local Development

```bash
# Start all services including ELK and Prometheus
docker-compose up -d

# Verify services are running
docker ps | grep going

# Check logs
docker logs going-elasticsearch
docker logs going-kibana
docker logs going-prometheus
docker logs going-grafana
```

#### Step 2: Integrate Observability in Each Service

For each NestJS service (booking-service, payment-service, etc.):

**2.1 Update `app.module.ts`**

```typescript
import { Module, NestMiddleware, MiddlewareConsumer } from '@nestjs/common';
import {
  ObservabilityModule,
  HttpMetricsMiddleware,
} from '@going-platform/shared-observability';

@Module({
  imports: [
    // ... other imports
    ObservabilityModule.forRoot({
      logger: {
        serviceName: 'booking-service',
        environment: process.env.NODE_ENV,
        logLevel: process.env.LOG_LEVEL,
      },
      metrics: {
        serviceName: 'booking-service',
      },
      enableHealthCheck: true,
      healthChecks: {
        mongodb: HealthCheckFactory.mongooseCheck(mongooseConnection),
        redis: HealthCheckFactory.redisCheck(redisClient),
      },
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpMetricsMiddleware).forRoutes('*');
  }
}
```

**2.2 Use Logger in Services**

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { StructuredLogger } from '@going-platform/shared-observability';

@Injectable()
export class BookingService {
  constructor(
    @Inject('STRUCTURED_LOGGER')
    private logger: StructuredLogger,
    @Inject('PROMETHEUS_METRICS')
    private metrics: PrometheusMetrics
  ) {}

  async createBooking(data: CreateBookingDto) {
    this.logger.info('Creating booking', { userId: data.userId });

    const startTime = Date.now();
    try {
      const booking = await this.bookingRepository.create(data);
      const duration = (Date.now() - startTime) / 1000;

      this.metrics.recordDatabaseQuery('bookings', 'create', duration, true);
      this.logger.info('Booking created', { bookingId: booking.id });

      return booking;
    } catch (error) {
      this.logger.error('Failed to create booking', error, {
        userId: data.userId,
      });
      throw error;
    }
  }
}
```

**2.3 Expose Metrics Endpoint**

```typescript
import { Controller, Get, Inject } from '@nestjs/common';
import { PrometheusMetrics } from '@going-platform/shared-observability';

@Controller('metrics')
export class MetricsController {
  constructor(
    @Inject('PROMETHEUS_METRICS')
    private metrics: PrometheusMetrics
  ) {}

  @Get()
  async getMetrics() {
    return this.metrics.getMetrics();
  }
}
```

#### Step 3: View Logs and Metrics

**Access Kibana for Logs**:

1. Open http://localhost:5601
2. Click "Menu" → "Management" → "Dev Tools"
3. Check Index Patterns: `going-logs-*`
4. View logs in Analytics/Discover

**Access Grafana for Metrics**:

1. Open http://localhost:3100
2. Login: admin / admin
3. Go to Dashboards → Create New Dashboard
4. Add Prometheus data source
5. Create visualizations for key metrics

#### Step 4: Environment Variables

Add to your `.env` file:

```env
# Observability
LOG_LEVEL=info
LOGSTASH_URL=logstash:5000
ELASTICSEARCH_NODE=http://elasticsearch:9200
ELASTIC_PASSWORD=ElasticPassword123!
ELASTICSEARCH_USERNAME=elastic

# Service
SERVICE_NAME=booking-service
NODE_ENV=production
```

## Part 2: E2E Test Expansion

### Current E2E Tests

Located in `cypress/e2e/`:

- `passenger-complete-ride.cy.ts` - User booking flow
- `driver-accept-complete-ride.cy.ts` - Driver acceptance flow
- `admin-dashboard.cy.ts` - Admin dashboard

### Expansion Tasks

#### 2.1 Add Critical Workflows

Create new test files for:

```typescript
// cypress/e2e/booking-payment-flow.cy.ts
describe('Booking + Payment Flow', () => {
  it('should complete full booking with payment', () => {
    // Login
    cy.login('user@example.com', 'password');

    // Create booking
    cy.visit('/bookings/new');
    cy.get('[data-cy=from-location]').type('123 Main St');
    cy.get('[data-cy=to-location]').type('456 Oak Ave');
    cy.get('[data-cy=create-booking-btn]').click();

    // Verify booking created
    cy.contains('Booking created successfully').should('be.visible');

    // Payment flow
    cy.get('[data-cy=payment-btn]').click();
    cy.get('[data-cy=card-number]').type('4111 1111 1111 1111');
    cy.get('[data-cy=pay-now-btn]').click();

    // Verify payment
    cy.contains('Payment successful').should('be.visible');
  });
});
```

#### 2.2 Add Performance Testing

```typescript
// cypress/e2e/performance.cy.ts
describe('Performance Tests', () => {
  it('should load homepage in <2s', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.performance.mark('start');
      },
      onLoad: (win) => {
        win.performance.mark('end');
        win.performance.measure('pageLoad', 'start', 'end');
        const duration =
          win.performance.getEntriesByName('pageLoad')[0].duration;
        expect(duration).to.be.lessThan(2000);
      },
    });
  });
});
```

#### 2.3 Add Visual Regression Testing

```bash
npm install --save-dev @percy/cli @percy/cypress
```

```typescript
// cypress/e2e/visual-regression.cy.ts
describe('Visual Regression', () => {
  it('should match homepage screenshot', () => {
    cy.visit('/');
    cy.percySnapshot('homepage');
  });

  it('should match booking page screenshot', () => {
    cy.visit('/bookings/new');
    cy.percySnapshot('booking-form');
  });
});
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test
npm run test:e2e:passenger

# Run in watch mode
npm run test:e2e:watch

# Run with specific browser
npm run cypress:run:chrome

# Run with recordings for debugging
npm run cypress:run -- --record
```

## Part 3: CD Pipeline to Kubernetes

### Prerequisites

- Kubernetes cluster (minikube, EKS, GKE, or AKS)
- kubectl configured
- Docker registry credentials
- Helm (optional but recommended)

### Kubernetes Manifests

Created in `k8s/base/`:

- `deployment.yaml` - Service deployments
- `service.yaml` - Service definitions
- `ingress.yaml` - Ingress routing
- `configmap.yaml` - Configuration
- `secrets.yaml` - Sensitive data
- `hpa.yaml` - Horizontal Pod Autoscaling
- `elasticsearch.yaml` - ELK deployment
- `kibana.yaml` - Kibana deployment
- `prometheus.yaml` - Prometheus deployment
- `grafana.yaml` - Grafana deployment

### Deployment Steps

#### 3.1 Prepare Kubernetes Environment

```bash
# Create namespace
kubectl create namespace going

# Create secrets for Docker registry
kubectl create secret docker-registry regcred \
  --docker-server=<registry-url> \
  --docker-username=<username> \
  --docker-password=<password> \
  -n going

# Create secrets for application
kubectl create secret generic app-secrets \
  --from-literal=ELASTIC_PASSWORD=ElasticPassword123! \
  --from-literal=JWT_SECRET=your-secret-key \
  -n going
```

#### 3.2 Deploy Observability Stack

```bash
# Deploy Elasticsearch
kubectl apply -f k8s/base/elasticsearch.yaml -n going
kubectl wait --for=condition=ready pod -l app=elasticsearch -n going --timeout=300s

# Deploy Kibana
kubectl apply -f k8s/base/kibana.yaml -n going

# Deploy Prometheus
kubectl apply -f k8s/base/prometheus.yaml -n going

# Deploy Grafana
kubectl apply -f k8s/base/grafana.yaml -n going

# Verify all pods are running
kubectl get pods -n going
```

#### 3.3 Deploy Application Services

```bash
# Apply all manifests
kubectl apply -f k8s/base/ -n going

# Check status
kubectl get deployments -n going
kubectl get services -n going
kubectl get pods -n going

# View logs
kubectl logs -f deployment/api-gateway -n going
kubectl logs -f deployment/booking-service -n going

# Get service URLs
kubectl port-forward svc/api-gateway 3000:3000 -n going
kubectl port-forward svc/kibana 5601:5601 -n going
kubectl port-forward svc/grafana 3000:3000 -n going
```

#### 3.4 Setup Ingress

If using Ingress (recommended):

```bash
# Install ingress-nginx (if not already installed)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Add to /etc/hosts (for local testing)
127.0.0.1 api.going.local
127.0.0.1 kibana.going.local
127.0.0.1 grafana.going.local
127.0.0.1 prometheus.going.local

# Access services
curl http://api.going.local
```

### Scaling and High Availability

#### 3.1 Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: going
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

#### 3.2 Pod Disruption Budgets

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-gateway-pdb
  namespace: going
spec:
  maxUnavailable: 1
  selector:
    matchLabels:
      app: api-gateway
```

## Monitoring and Alerting

### Key Metrics to Monitor

1. **HTTP Errors**: Track error rates, alert if >5%
2. **Response Time**: Monitor P50, P95, P99 latency
3. **Cache Hit Rate**: Should be >80% in production
4. **Database Connections**: Ensure connection pool is healthy
5. **Pod Memory**: Alert if >80% of limit
6. **Pod CPU**: Alert if >80% of request

### Create Grafana Dashboard

1. Open http://localhost:3100
2. Create new dashboard
3. Add panels for key metrics
4. Set up alerts with notification channels

### Create Prometheus Alerts

```yaml
groups:
  - name: going_platform
    rules:
      - alert: HighErrorRate
        expr: rate(http_errors_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: 'High error rate detected'

      - alert: HighResponseTime
        expr: histogram_quantile(0.99, http_request_duration_seconds) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High response time detected'
```

## CI/CD Pipeline Integration

The GitHub Actions workflows (`ci.yml` and `ci-cd.yml`) already include:

- ✅ Unit tests
- ✅ E2E tests
- ✅ Security scanning
- ✅ Docker image builds
- ✅ Staging deployment (placeholder)
- ✅ Production deployment (placeholder)

### Next Steps for CI/CD

1. Fill in actual Kubernetes deployment commands in CI/CD workflows
2. Add automated backup/recovery procedures
3. Implement blue-green or canary deployments
4. Add performance testing to pipeline
5. Setup automated rollback on deployment failure

## Troubleshooting

### Docker Compose Issues

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs elasticsearch
docker-compose logs kibana
docker-compose logs prometheus
docker-compose logs grafana

# Restart services
docker-compose restart elasticsearch

# Full restart
docker-compose down -v && docker-compose up -d
```

### Kubernetes Issues

```bash
# Check pod status
kubectl describe pod <pod-name> -n going

# View pod logs
kubectl logs <pod-name> -n going

# Get events
kubectl get events -n going

# Debug pod
kubectl debug <pod-name> -n going -it

# Port forward for testing
kubectl port-forward svc/<service> <local-port>:<service-port> -n going
```

### Connectivity Issues

```bash
# Test service discovery
kubectl run -it --rm debug --image=busybox --restart=Never -n going -- sh
# Inside container:
# wget http://elasticsearch:9200
# wget http://prometheus:9090
```

## Next Steps

1. ✅ Deploy observability stack
2. ✅ Integrate observability library into services
3. ✅ Expand E2E test coverage
4. ✅ Deploy to staging environment
5. ✅ Monitor metrics and logs
6. ✅ Optimize based on observed patterns
7. ✅ Deploy to production

## References

- [Elasticsearch Docs](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Kibana Docs](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)
- [Kubernetes Docs](https://kubernetes.io/docs/)
- [NestJS Docs](https://docs.nestjs.com/)
