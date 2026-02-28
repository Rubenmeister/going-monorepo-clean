#!/bin/bash

# 🚀 DEPLOY TO GKE STAGING ENVIRONMENT
# Deploys Going Platform to Google Kubernetes Engine staging namespace
# Part of Phase 2: GCP Setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GCP_PROJECT=${GCP_PROJECT:-""}
IMAGE_TAG=${IMAGE_TAG:-"v1.0.0"}
K8S_NAMESPACE="staging"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --project)
      GCP_PROJECT="$2"
      shift 2
      ;;
    --tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    --namespace)
      K8S_NAMESPACE="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Function to print header
print_header() {
  echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
  echo ""
}

# Function to print step
print_step() {
  echo -e "${YELLOW}📋 $1${NC}"
}

# Function to print success
print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_header "🚀 GOING PLATFORM - STAGING DEPLOYMENT"

# Validate inputs
if [ -z "$GCP_PROJECT" ]; then
  print_error "GCP_PROJECT is not set"
  echo ""
  echo "Usage: bash scripts/deploy-staging.sh --project YOUR_PROJECT_ID [--tag IMAGE_TAG]"
  exit 1
fi

echo -e "${YELLOW}Configuration:${NC}"
echo "  GCP Project: $GCP_PROJECT"
echo "  Image Tag: $IMAGE_TAG"
echo "  Namespace: $K8S_NAMESPACE"
echo ""

# Step 1: Verify kubectl
print_step "Step 1: Verifying kubectl"

if ! command -v kubectl &> /dev/null; then
  print_error "kubectl not found"
  exit 1
fi
print_success "kubectl found"

echo ""

# Step 2: Verify namespace exists
print_step "Step 2: Verifying Staging Namespace"

if ! kubectl get namespace $K8S_NAMESPACE &> /dev/null; then
  print_error "Namespace '$K8S_NAMESPACE' not found"
  echo "  Run: bash scripts/gcp-setup-namespace.sh --project $GCP_PROJECT"
  exit 1
fi
print_success "Namespace '$K8S_NAMESPACE' exists"

echo ""

# Step 3: Create temporary directory for manifests
print_step "Step 3: Preparing Manifests"

TEMP_DIR="/tmp/going-k8s-staging-$$"
mkdir -p $TEMP_DIR

echo "  Temp directory: $TEMP_DIR"
echo "  Copying manifests..."
cp -r k8s/staging/* $TEMP_DIR/

print_success "Manifests prepared"

echo ""

# Step 4: Update image references
print_step "Step 4: Updating Image References"

echo "  Updating image URIs..."
for file in $TEMP_DIR/*.yaml; do
  sed -i "s|gcr.io/GCP_PROJECT|gcr.io/$GCP_PROJECT|g" "$file"
  sed -i "s|IMAGE_TAG|$IMAGE_TAG|g" "$file"
done

print_success "Image references updated"

echo ""

# Step 5: Deploy manifests
print_step "Step 5: Deploying to GKE"

echo "  Applying Kubernetes manifests..."
kubectl apply -f $TEMP_DIR/ -n $K8S_NAMESPACE

print_success "Manifests applied"

echo ""

# Step 6: Wait for deployments
print_step "Step 6: Waiting for Deployments"

echo "  Waiting for API Gateway..."
if kubectl rollout status deployment/api-gateway -n $K8S_NAMESPACE --timeout=10m 2>/dev/null; then
  print_success "API Gateway deployment ready"
else
  echo "  Note: API Gateway still rolling out. You can monitor with:"
  echo "    kubectl rollout status deployment/api-gateway -n $K8S_NAMESPACE"
fi

echo ""
echo "  Waiting for Corporate Portal..."
if kubectl rollout status deployment/corporate-portal -n $K8S_NAMESPACE --timeout=10m 2>/dev/null; then
  print_success "Corporate Portal deployment ready"
else
  echo "  Note: Corporate Portal still rolling out. You can monitor with:"
  echo "    kubectl rollout status deployment/corporate-portal -n $K8S_NAMESPACE"
fi

echo ""

# Step 7: Verify deployment
print_step "Step 7: Verifying Deployment"

echo "  Deployments:"
kubectl get deployments -n $K8S_NAMESPACE

echo ""
echo "  Services:"
kubectl get services -n $K8S_NAMESPACE

echo ""
echo "  Pods:"
kubectl get pods -n $K8S_NAMESPACE

print_success "Deployment verified"

echo ""

# Step 8: Get service endpoints
print_step "Step 8: Service Endpoints"

echo ""
echo -e "${YELLOW}External IPs:${NC}"
echo ""

kubectl get svc -n $K8S_NAMESPACE -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.loadBalancer.ingress[0].ip}{"\n"}{end}' 2>/dev/null | while read service ip; do
  if [ -z "$ip" ]; then
    echo "  $service: <pending>"
  else
    echo "  $service: $ip"
  fi
done

echo ""
echo "  Note: LoadBalancer IPs may take a few minutes to appear"

echo ""

# Step 9: Cleanup
print_step "Step 9: Cleaning Up"

echo "  Removing temporary files..."
rm -rf $TEMP_DIR

print_success "Cleanup completed"

echo ""

# Final Summary
print_header "✅ STAGING DEPLOYMENT COMPLETED!"

echo -e "${YELLOW}Useful Commands:${NC}"
echo ""
echo "📊 Check pod status:"
echo "   kubectl get pods -n $K8S_NAMESPACE"
echo ""
echo "📝 View logs:"
echo "   kubectl logs -f deployment/api-gateway -n $K8S_NAMESPACE"
echo "   kubectl logs -f deployment/corporate-portal -n $K8S_NAMESPACE"
echo ""
echo "🔀 Port forward (for local testing):"
echo "   kubectl port-forward svc/api-gateway 3000:80 -n $K8S_NAMESPACE"
echo "   kubectl port-forward svc/corporate-portal 3001:80 -n $K8S_NAMESPACE"
echo ""
echo "🔍 Describe resource:"
echo "   kubectl describe deployment/api-gateway -n $K8S_NAMESPACE"
echo ""
echo "⚙️ Check resource usage:"
echo "   kubectl top pods -n $K8S_NAMESPACE"
echo ""
echo "🧪 Test API health:"
echo "   API_IP=\$(kubectl get svc api-gateway -n $K8S_NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
echo "   curl http://\$API_IP:3000/health"
echo ""

print_success "Deployment script completed!"
echo ""
