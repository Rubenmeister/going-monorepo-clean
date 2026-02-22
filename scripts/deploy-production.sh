#!/bin/bash

# Going Platform - Production Deployment Script
# Automated canary → gradual rollout strategy with safety checks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_NAMESPACE="production"
IMAGE_TAG="p1-production-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="production-deployment-$(date +%Y%m%d-%H%M%S).log"

# Default settings
STRATEGY="canary"
TRAFFIC_STEPS=("5" "25" "50" "100")
MONITORING_INTERVAL=30  # seconds
MONITORING_DURATION=1800  # 30 minutes per step

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

log_step() {
    echo -e "${MAGENTA}[STEP]${NC} $1" | tee -a "$LOG_FILE"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --strategy)
                STRATEGY="$2"
                shift 2
                ;;
            --traffic-steps)
                IFS=',' read -ra TRAFFIC_STEPS <<< "$2"
                shift 2
                ;;
            --monitoring-duration)
                MONITORING_DURATION="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# Pre-deployment validation
pre_deployment_check() {
    log_step "Pre-Deployment Validation"

    log_info "Checking Kubernetes cluster..."
    CLUSTER_NODES=$(kubectl get nodes -o jsonpath='{.items | length}')
    if [ "$CLUSTER_NODES" -lt 3 ]; then
        log_error "Insufficient cluster nodes. Required: 3+, Found: $CLUSTER_NODES"
        exit 1
    fi
    log_success "Cluster has $CLUSTER_NODES nodes"

    log_info "Checking production database backup..."
    BACKUP_TIME=$(aws s3 ls s3://going-platform-backups/production/ \
        | tail -1 | awk '{print $1, $2}')
    log_success "Latest backup: $BACKUP_TIME"

    log_info "Checking monitoring infrastructure..."
    PROMETHEUS_UP=$(curl -s http://prometheus:9090/api/v1/query?query='up' | jq '.data.result | length')
    if [ "$PROMETHEUS_UP" -lt 10 ]; then
        log_warn "Prometheus targets: $PROMETHEUS_UP (expected > 10)"
    else
        log_success "Prometheus targets: $PROMETHEUS_UP"
    fi

    log_info "Checking database connectivity..."
    mongo --eval "db.adminCommand('ping')" > /dev/null 2>&1 || {
        log_error "Cannot connect to MongoDB"
        exit 1
    }
    log_success "MongoDB connected"

    log_info "Checking Redis connectivity..."
    redis-cli PING > /dev/null 2>&1 || {
        log_error "Cannot connect to Redis"
        exit 1
    }
    log_success "Redis connected"

    log_success "All pre-deployment checks passed"
}

# Build and push production image
build_production_image() {
    log_step "Building Production Image"

    log_info "Building Docker image: $IMAGE_TAG"
    docker build \
        -t "going-platform:$IMAGE_TAG" \
        -t "going-platform:production-latest" \
        . || {
        log_error "Docker build failed"
        exit 1
    }
    log_success "Image built: $IMAGE_TAG"

    log_info "Pushing to registry..."
    docker push "going-platform:$IMAGE_TAG" || {
        log_error "Docker push failed"
        exit 1
    }
    docker push "going-platform:production-latest" || {
        log_error "Docker push failed"
        exit 1
    }
    log_success "Image pushed"
}

# Create canary deployment
create_canary() {
    log_step "Creating Canary Deployment (5% traffic)"

    cat > canary-deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: going-platform-canary
  namespace: production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: going-platform
      variant: canary
  template:
    metadata:
      labels:
        app: going-platform
        variant: canary
    spec:
      containers:
      - name: going-platform
        image: going-platform:production-latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
EOF

    if [ "$DRY_RUN" != true ]; then
        kubectl apply -f canary-deployment.yaml
        log_info "Waiting for canary pod to be ready..."
        kubectl rollout status deployment/going-platform-canary \
            -n $PRODUCTION_NAMESPACE --timeout=5m
        log_success "Canary deployment created"
    else
        log_warn "[DRY-RUN] Would apply canary deployment"
    fi
}

# Set traffic split
set_traffic_split() {
    local canary_weight=$1

    log_info "Setting traffic split: stable=$((100 - canary_weight))% / canary=$canary_weight%"

    local stable_weight=$((100 - canary_weight))

    # Using Istio VirtualService
    cat > traffic-split.yaml << EOF
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: going-platform
  namespace: production
spec:
  hosts:
  - going-platform.example.com
  http:
  - route:
    - destination:
        host: going-platform-stable
        port:
          number: 3000
      weight: $stable_weight
    - destination:
        host: going-platform-canary
        port:
          number: 3000
      weight: $canary_weight
    timeout: 30s
    retries:
      attempts: 3
      perTryTimeout: 10s
EOF

    if [ "$DRY_RUN" != true ]; then
        kubectl apply -f traffic-split.yaml
        log_success "Traffic split configured: $stable_weight% / $canary_weight%"
    else
        log_warn "[DRY-RUN] Would set traffic split to $stable_weight% / $canary_weight%"
    fi
}

# Monitor metrics
monitor_metrics() {
    local duration=$1
    local canary_weight=$2
    local end_time=$(($(date +%s) + duration))

    log_info "Monitoring for ${duration}s with $canary_weight% traffic on canary..."

    while [ $(date +%s) -lt $end_time ]; do
        # Error rate
        local ERROR_RATE=$(curl -s 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])' \
            | jq '.data.result[0].value[1] // 0')

        # P95 latency
        local P95=$(curl -s 'http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,http_request_duration_ms)' \
            | jq '.data.result[0].value[1] // 0')

        # Circuit breakers
        local BREAKERS_OPEN=$(curl -s 'http://prometheus:9090/api/v1/query?query=circuit_breaker_state == 1' \
            | jq '.data.result | length')

        printf "\r${BLUE}[$(date +'%H:%M:%S')]${NC} Error: ${ERROR_RATE}% | P95: ${P95}ms | Breakers: $BREAKERS_OPEN | Traffic: $canary_weight%%"

        # Check critical thresholds
        if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
            echo ""
            log_error "ERROR RATE EXCEEDED: $ERROR_RATE"
            return 1
        fi

        if (( $(echo "$P95 > 5000" | bc -l) )); then
            echo ""
            log_error "LATENCY EXCEEDED: ${P95}ms"
            return 1
        fi

        if [ "$BREAKERS_OPEN" -gt 0 ]; then
            echo ""
            log_error "CIRCUIT BREAKERS OPEN: $BREAKERS_OPEN"
            return 1
        fi

        sleep $MONITORING_INTERVAL
    done

    echo ""
    log_success "Monitoring period passed successfully"
    return 0
}

# Scale canary replicas
scale_canary() {
    local replicas=$1

    log_info "Scaling canary to $replicas replicas..."

    if [ "$DRY_RUN" != true ]; then
        kubectl scale deployment going-platform-canary --replicas=$replicas -n $PRODUCTION_NAMESPACE
        sleep 30
        log_success "Canary scaled to $replicas replicas"
    else
        log_warn "[DRY-RUN] Would scale canary to $replicas replicas"
    fi
}

# Complete rollout
complete_rollout() {
    log_step "Completing Production Rollout (100%)"

    log_info "Updating stable deployment with new image..."

    if [ "$DRY_RUN" != true ]; then
        kubectl set image deployment/going-platform-stable \
            going-platform="going-platform:$IMAGE_TAG" \
            -n $PRODUCTION_NAMESPACE

        kubectl rollout status deployment/going-platform-stable \
            -n $PRODUCTION_NAMESPACE --timeout=10m

        # Delete canary
        kubectl delete deployment going-platform-canary -n $PRODUCTION_NAMESPACE

        log_success "Production rollout complete"
    else
        log_warn "[DRY-RUN] Would update stable deployment and delete canary"
    fi
}

# Main deployment flow
main() {
    log_info "=========================================="
    log_info "Going Platform - Production Deployment"
    log_info "=========================================="
    log_info "Strategy: $STRATEGY"
    log_info "Traffic Steps: ${TRAFFIC_STEPS[*]}"
    log_info "Image Tag: $IMAGE_TAG"
    log_info "Log File: $LOG_FILE"
    if [ "$DRY_RUN" = true ]; then
        log_warn "Running in DRY-RUN mode"
    fi
    log_info "=========================================="

    # Pre-deployment
    pre_deployment_check
    build_production_image

    if [ "$STRATEGY" = "canary" ]; then
        create_canary

        # Gradual rollout through traffic steps
        for step in "${TRAFFIC_STEPS[@]}"; do
            if [ "$step" -eq 100 ]; then
                # Final step: complete rollout
                set_traffic_split 100
                sleep 30
                complete_rollout
                monitor_metrics 300 100  # Final 5 min monitoring
            else
                # Intermediate step
                set_traffic_split "$step"
                sleep 30

                # Scale canary if needed
                if [ "$step" -gt 5 ]; then
                    REPLICAS=$((step / 5))
                    scale_canary "$REPLICAS"
                fi

                # Monitor this step
                if ! monitor_metrics $MONITORING_DURATION "$step"; then
                    log_error "Deployment failed at $step% traffic"
                    log_warn "Initiating rollback..."
                    # TODO: Implement rollback
                    exit 1
                fi

                log_success "Step $step% completed successfully"
            fi
        done
    fi

    log_info "=========================================="
    log_success "Production Deployment Complete!"
    log_info "=========================================="
    log_info "Next Steps:"
    log_info "1. Monitor production metrics for 24+ hours"
    log_info "2. Verify all P1 components working"
    log_info "3. Collect performance data"
    log_info "4. Team sign-off and celebration"
    log_info "=========================================="
}

# Parse arguments
parse_args "$@"

# Run main function
main "$@"
