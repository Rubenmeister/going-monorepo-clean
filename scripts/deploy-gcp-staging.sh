#!/bin/bash

# 🚀 GCP STAGING DEPLOYMENT SCRIPT
# Deploys Going Platform to Google Kubernetes Engine (GKE)
# Uses Google Container Registry (GCR) for images

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GCP_PROJECT=${GCP_PROJECT:-"your-project-id"}
GKE_CLUSTER=${GKE_CLUSTER:-"staging-cluster"}
GKE_ZONE=${GKE_ZONE:-"us-central1-a"}
GCR_REGISTRY=${GCR_REGISTRY:-"gcr.io"}
IMAGE_TAG=${IMAGE_TAG:-"v1.0.0"}
K8S_NAMESPACE="staging"

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 GOING PLATFORM - GCP STAGING DEPLOYMENT${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  GCP Project: $GCP_PROJECT"
echo "  GKE Cluster: $GKE_CLUSTER"
echo "  Zone: $GKE_ZONE"
echo "  Registry: $GCR_REGISTRY/$GCP_PROJECT"
echo "  Image Tag: $IMAGE_TAG"
echo ""

# Step 1: Verify GCP setup
echo -e "${BLUE}📋 Step 1: Verifying GCP Setup${NC}"
echo "  Checking gcloud CLI..."
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi
echo -e "${GREEN}✅ gcloud CLI found${NC}"

echo "  Checking kubectl..."
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found. Install from: https://kubernetes.io/docs/tasks/tools/install-kubectl/${NC}"
    exit 1
fi
echo -e "${GREEN}✅ kubectl found${NC}"

# Step 2: Configure GCP and GKE access
echo ""
echo -e "${BLUE}📋 Step 2: Configuring GCP & GKE Access${NC}"
echo "  Setting GCP project..."
gcloud config set project $GCP_PROJECT
echo -e "${GREEN}✅ GCP project configured${NC}"

echo "  Getting GKE credentials..."
gcloud container clusters get-credentials $GKE_CLUSTER --zone=$GKE_ZONE
echo -e "${GREEN}✅ GKE credentials configured${NC}"

# Step 3: Verify cluster access
echo ""
echo -e "${BLUE}📋 Step 3: Verifying Cluster Access${NC}"
echo "  Current context:"
kubectl config current-context
echo "  Cluster nodes:"
kubectl get nodes
echo -e "${GREEN}✅ Cluster access verified${NC}"

# Step 4: Create namespace
echo ""
echo -e "${BLUE}📋 Step 4: Creating Namespace${NC}"
kubectl create namespace $K8S_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✅ Namespace '$K8S_NAMESPACE' ready${NC}"

# Step 5: Configure GCR access
echo ""
echo -e "${BLUE}📋 Step 5: Configuring GCR Access${NC}"
echo "  Creating docker-registry secret..."
kubectl create secret docker-registry gcr-secret \
  --docker-server=$GCR_REGISTRY \
  --docker-username=_json_key \
  --docker-password="$(cat ~/.config/gcloud/application_default_credentials.json)" \
  -n $K8S_NAMESPACE \
  --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✅ GCR secret configured${NC}"

# Step 6: Build and push Docker images
echo ""
echo -e "${BLUE}📋 Step 6: Building Docker Images${NC}"
echo "  Building API Gateway image..."
docker build -t $GCR_REGISTRY/$GCP_PROJECT/api-gateway:$IMAGE_TAG .
echo -e "${GREEN}✅ API Gateway built${NC}"

echo "  Building Frontend image..."
docker build -f apps/corporate-portal/Dockerfile \
  -t $GCR_REGISTRY/$GCP_PROJECT/corporate-portal:$IMAGE_TAG \
  apps/corporate-portal/
echo -e "${GREEN}✅ Corporate Portal built${NC}"

# Step 7: Push images to GCR
echo ""
echo -e "${BLUE}📋 Step 7: Pushing Images to GCR${NC}"
echo "  Configuring docker for GCR..."
gcloud auth configure-docker $GCR_REGISTRY

echo "  Pushing API Gateway..."
docker push $GCR_REGISTRY/$GCP_PROJECT/api-gateway:$IMAGE_TAG
echo -e "${GREEN}✅ API Gateway pushed${NC}"

echo "  Pushing Corporate Portal..."
docker push $GCR_REGISTRY/$GCP_PROJECT/corporate-portal:$IMAGE_TAG
echo -e "${GREEN}✅ Corporate Portal pushed${NC}"

# Step 8: Create ConfigMaps and Secrets
echo ""
echo -e "${BLUE}📋 Step 8: Creating ConfigMaps & Secrets${NC}"
echo "  Creating ConfigMap from .env.example..."
kubectl create configmap app-config \
  --from-file=.env.example \
  -n $K8S_NAMESPACE \
  --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✅ ConfigMap created${NC}"

# Step 9: Deploy to GKE
echo ""
echo -e "${BLUE}📋 Step 9: Deploying to GKE${NC}"
echo "  Updating image references in K8s manifests..."

# Create temporary directory for modified manifests
mkdir -p /tmp/going-k8s

# Copy and modify manifests
cp -r k8s/staging/* /tmp/going-k8s/

# Replace image references
sed -i "s|IMAGE_TAG|$IMAGE_TAG|g" /tmp/going-k8s/*.yaml
sed -i "s|GCP_PROJECT|$GCP_PROJECT|g" /tmp/going-k8s/*.yaml

echo "  Applying Kubernetes manifests..."
kubectl apply -f /tmp/going-k8s/ -n $K8S_NAMESPACE
echo -e "${GREEN}✅ Manifests applied${NC}"

# Step 10: Wait for deployment
echo ""
echo -e "${BLUE}📋 Step 10: Waiting for Deployment${NC}"
echo "  Waiting for API Gateway to be ready..."
kubectl rollout status deployment/api-gateway -n $K8S_NAMESPACE --timeout=5m
echo -e "${GREEN}✅ API Gateway ready${NC}"

echo "  Waiting for Corporate Portal to be ready..."
kubectl rollout status deployment/corporate-portal -n $K8S_NAMESPACE --timeout=5m
echo -e "${GREEN}✅ Corporate Portal ready${NC}"

# Step 11: Get service endpoints
echo ""
echo -e "${BLUE}📋 Step 11: Service Endpoints${NC}"
echo "  Getting services..."
kubectl get svc -n $K8S_NAMESPACE
echo ""
kubectl get svc -n $K8S_NAMESPACE -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.loadBalancer.ingress[0].ip}{"\n"}{end}'
echo ""

# Step 12: Verify deployment
echo ""
echo -e "${BLUE}📋 Step 12: Verifying Deployment${NC}"
echo "  Pod status:"
kubectl get pods -n $K8S_NAMESPACE
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"

# Final instructions
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1️⃣  Get API Gateway IP:"
echo "   kubectl get svc api-gateway -n $K8S_NAMESPACE"
echo ""
echo "2️⃣  Test health endpoint:"
echo "   curl http://API_GATEWAY_IP:3000/health"
echo ""
echo "3️⃣  View logs:"
echo "   kubectl logs -f deployment/api-gateway -n $K8S_NAMESPACE"
echo ""
echo "4️⃣  Port forward for local testing:"
echo "   kubectl port-forward svc/api-gateway 3000:3000 -n $K8S_NAMESPACE"
echo ""
echo "5️⃣  Run validation tests:"
echo "   See STAGING_VALIDATION_REPORT.md"
echo ""
echo "6️⃣  Monitor resources:"
echo "   kubectl top pods -n $K8S_NAMESPACE"
echo ""

