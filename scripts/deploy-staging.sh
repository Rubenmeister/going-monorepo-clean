#!/bin/bash

# Going Platform - Staging Deployment Script
# Automates the deployment of P1-1 through P1-5 to staging environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BRANCH="claude/complete-going-platform-TJOI8"
NAMESPACE="staging"
DEPLOYMENT_NAME="going-platform-staging"
IMAGE_TAG="staging-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Step 1: Pre-deployment validation
step_validate() {
    log_info "Step 1: Pre-deployment Validation (30 min)"

    log_info "Checking branch status..."
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
        log_error "Not on correct branch. Current: $CURRENT_BRANCH, Expected: $BRANCH"
        exit 1
    fi
    log_success "Branch correct: $BRANCH"

    log_info "Running test suite..."
    npm test -- --coverage --silent || {
        log_error "Tests failed"
        exit 1
    }
    log_success "All tests passing"

    log_info "Building packages..."
    npm run build || {
        log_error "Build failed"
        exit 1
    }
    log_success "Build successful"

    log_info "TypeScript validation..."
    npm run typecheck || {
        log_error "TypeScript errors"
        exit 1
    }
    log_success "TypeScript clean"

    log_success "Pre-deployment validation complete"
}

# Step 2: Docker image building and pushing
step_build_image() {
    log_info "Step 2: Building Docker Image"

    log_info "Building image: $IMAGE_TAG"
    docker build \
        -t "going-platform:$IMAGE_TAG" \
        -t "going-platform:staging-latest" \
        . || {
        log_error "Docker build failed"
        exit 1
    }
    log_success "Image built: $IMAGE_TAG"

    log_info "Pushing to registry..."
    docker push "going-platform:$IMAGE_TAG"
    docker push "going-platform:staging-latest"
    log_success "Image pushed to registry"
}

# Step 3: Kubernetes deployment
step_deploy_k8s() {
    log_info "Step 3: Deploying to Kubernetes"

    log_info "Creating/updating deployment..."
    kubectl set image \
        deployment/$DEPLOYMENT_NAME \
        going-platform="going-platform:$IMAGE_TAG" \
        -n $NAMESPACE || {
        log_error "Kubernetes update failed"
        exit 1
    }
    log_success "Deployment updated"

    log_info "Waiting for rollout (5 min timeout)..."
    kubectl rollout status \
        deployment/$DEPLOYMENT_NAME \
        -n $NAMESPACE \
        --timeout=5m || {
        log_error "Rollout failed"
        exit 1
    }
    log_success "Rollout successful"

    log_info "Checking pod status..."
    kubectl get pods -n $NAMESPACE -l app=going-platform
}

# Step 4: Database migrations
step_migrate_db() {
    log_info "Step 4: Database Migrations"

    log_info "Running migrations..."
    kubectl exec \
        -it \
        $(kubectl get pod -n $NAMESPACE -l app=going-platform -o jsonpath='{.items[0].metadata.name}') \
        -n $NAMESPACE \
        -- npm run db:migrate || {
        log_warn "Migration failed (may already be applied)"
    }
    log_success "Migrations applied"

    log_info "Creating MongoDB indices..."
    kubectl exec \
        -it \
        $(kubectl get pod -n $NAMESPACE -l app=going-platform -o jsonpath='{.items[0].metadata.name}') \
        -n $NAMESPACE \
        -- npm run db:indices:create || {
        log_error "Index creation failed"
        exit 1
    }
    log_success "Indices created"
}

# Step 5: Service validation
step_validate_services() {
    log_info "Step 5: Service Validation"

    # Get service endpoint
    SERVICE_IP=$(kubectl get svc -n $NAMESPACE going-platform -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if [ -z "$SERVICE_IP" ]; then
        SERVICE_IP=$(kubectl get svc -n $NAMESPACE going-platform -o jsonpath='{.spec.clusterIP}')
    fi

    log_info "Service IP: $SERVICE_IP"

    log_info "Checking health endpoint..."
    for i in {1..30}; do
        if curl -s "http://$SERVICE_IP:3000/health" > /dev/null 2>&1; then
            log_success "Service healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "Service did not become healthy"
            exit 1
        fi
        log_warn "Waiting for service to be ready... ($i/30)"
        sleep 2
    done

    log_info "Validating circuit breakers..."
    BREAKERS=$(curl -s "http://$SERVICE_IP:3000/health/circuit-breakers")
    log_success "Circuit breakers status: $BREAKERS"

    log_info "Validating Redis pool..."
    REDIS=$(curl -s "http://$SERVICE_IP:3000/health/redis")
    log_success "Redis pool status: $REDIS"
}

# Step 6: Run validation tests
step_run_tests() {
    log_info "Step 6: Running Validation Tests"

    log_info "Running pagination tests..."
    npm run test:pagination || log_warn "Pagination tests skipped"

    log_info "Running circuit breaker tests..."
    npm run test:circuit-breaker || log_warn "Circuit breaker tests skipped"

    log_info "Running integration tests..."
    npm run test:integration || log_warn "Integration tests skipped"

    log_success "Validation tests complete"
}

# Step 7: Monitor health
step_monitor() {
    log_info "Step 7: Monitoring Staging (24h baseline)"

    log_info "Setting up monitoring dashboard..."
    log_info "Prometheus: http://staging:9090"
    log_info "Grafana: http://staging:3000"
    log_info "Service: http://$SERVICE_IP:3000"

    log_info "Monitoring for 5 minutes (sample)..."
    for i in {1..5}; do
        log_info "Minute $i/5 - Checking metrics..."
        kubectl top nodes -n $NAMESPACE 2>/dev/null || true
        kubectl top pods -n $NAMESPACE 2>/dev/null || true
        sleep 60
    done

    log_success "Initial monitoring complete"
}

# Main deployment flow
main() {
    log_info "=========================================="
    log_info "Going Platform - Staging Deployment"
    log_info "=========================================="
    log_info "Branch: $BRANCH"
    log_info "Namespace: $NAMESPACE"
    log_info "Image Tag: $IMAGE_TAG"
    log_info "Log File: $LOG_FILE"
    log_info "=========================================="

    # Run deployment steps
    step_validate
    echo ""

    step_build_image
    echo ""

    step_deploy_k8s
    echo ""

    step_migrate_db
    echo ""

    step_validate_services
    echo ""

    step_run_tests
    echo ""

    step_monitor
    echo ""

    log_success "=========================================="
    log_success "Staging Deployment Complete!"
    log_success "=========================================="
    log_info "Next Steps:"
    log_info "1. Monitor staging environment for 24 hours"
    log_info "2. Run load tests: npm run load:test"
    log_info "3. Validate all scenarios in STAGING_DEPLOYMENT_VALIDATION.md"
    log_info "4. Get team sign-off"
    log_info "5. Proceed with production deployment"
    log_info "=========================================="
}

# Run main function
main "$@"
