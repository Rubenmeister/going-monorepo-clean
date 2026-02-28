#!/bin/bash

# 🚀 GCP STAGING NAMESPACE SETUP SCRIPT
# Sets up GCP authentication and creates the staging namespace for Going Platform
# Phase 2: GCP Authentication & Staging Namespace Setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
GCP_PROJECT=${GCP_PROJECT:-""}
GKE_CLUSTER=${GKE_CLUSTER:-"staging-cluster"}
GKE_ZONE=${GKE_ZONE:-"us-central1-a"}
GCP_REGION=${GCP_REGION:-"us-central1"}
K8S_NAMESPACE="staging"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --project)
      GCP_PROJECT="$2"
      shift 2
      ;;
    --cluster)
      GKE_CLUSTER="$2"
      shift 2
      ;;
    --zone)
      GKE_ZONE="$2"
      shift 2
      ;;
    --region)
      GCP_REGION="$2"
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

# Main script
print_header "🚀 GOING PLATFORM - GCP STAGING NAMESPACE SETUP"

# Validate project ID
if [ -z "$GCP_PROJECT" ]; then
  print_error "GCP_PROJECT is not set"
  echo ""
  echo "Usage: bash scripts/gcp-setup-namespace.sh --project YOUR_PROJECT_ID [--cluster CLUSTER_NAME] [--zone ZONE]"
  echo ""
  echo "Examples:"
  echo "  bash scripts/gcp-setup-namespace.sh --project my-project"
  echo "  bash scripts/gcp-setup-namespace.sh --project my-project --cluster prod-cluster --zone us-west1-a"
  exit 1
fi

echo -e "${YELLOW}Configuration:${NC}"
echo "  GCP Project: $GCP_PROJECT"
echo "  GKE Cluster: $GKE_CLUSTER"
echo "  Zone: $GKE_ZONE"
echo "  Region: $GCP_REGION"
echo "  Namespace: $K8S_NAMESPACE"
echo ""

# Step 1: Verify GCP Setup
print_step "Step 1: Verifying GCP Setup"

if ! command -v gcloud &> /dev/null; then
  print_error "gcloud CLI not found"
  echo "Install from: https://cloud.google.com/sdk/docs/install"
  exit 1
fi
print_success "gcloud CLI found"

if ! command -v kubectl &> /dev/null; then
  print_error "kubectl not found"
  echo "Install with: gcloud components install kubectl"
  exit 1
fi
print_success "kubectl found"

if ! command -v docker &> /dev/null; then
  print_error "docker not found"
  echo "Install from: https://docs.docker.com/get-docker/"
  exit 1
fi
print_success "docker found"

echo ""

# Step 2: Configure GCP
print_step "Step 2: Configuring GCP Project"

echo "  Setting GCP project..."
gcloud config set project $GCP_PROJECT
print_success "GCP project configured"

echo "  Verifying project..."
if ! gcloud projects describe $GCP_PROJECT &> /dev/null; then
  print_error "GCP Project not found: $GCP_PROJECT"
  echo "  Please create the project first: https://console.cloud.google.com/projectcreate"
  exit 1
fi
print_success "GCP project verified"

echo ""

# Step 3: Enable Required APIs
print_step "Step 3: Enabling Required APIs"

apis_to_enable=(
  "container.googleapis.com"
  "compute.googleapis.com"
  "containerregistry.googleapis.com"
  "artifactregistry.googleapis.com"
  "logging.googleapis.com"
  "monitoring.googleapis.com"
)

for api in "${apis_to_enable[@]}"; do
  echo "  Enabling $api..."
  gcloud services enable $api --project=$GCP_PROJECT 2>&1 | grep -v "already enabled" || true
done

print_success "APIs enabled"

echo ""

# Step 4: Authenticate with GCP
print_step "Step 4: Authenticating with GCP"

# Check if already authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
  echo "  No active authentication found. Starting login..."
  gcloud auth login
fi

current_user=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
echo "  Authenticated as: $current_user"
print_success "GCP authentication configured"

echo ""

# Step 5: Check/Create GKE Cluster
print_step "Step 5: Checking GKE Cluster"

if gcloud container clusters describe $GKE_CLUSTER --zone=$GKE_ZONE &> /dev/null; then
  print_success "GKE cluster exists: $GKE_CLUSTER"
else
  print_error "GKE cluster not found: $GKE_CLUSTER"
  echo "  Create cluster with:"
  echo "    gcloud container clusters create $GKE_CLUSTER \\"
  echo "      --zone=$GKE_ZONE \\"
  echo "      --num-nodes=3 \\"
  echo "      --machine-type=n1-standard-2"
  exit 1
fi

echo ""

# Step 6: Get Cluster Credentials
print_step "Step 6: Configuring kubectl Access"

echo "  Getting GKE credentials..."
gcloud container clusters get-credentials $GKE_CLUSTER --zone=$GKE_ZONE --project=$GCP_PROJECT
print_success "GKE credentials configured"

echo "  Verifying cluster access..."
if ! kubectl cluster-info &> /dev/null; then
  print_error "Cannot connect to cluster"
  exit 1
fi
print_success "Cluster access verified"

echo ""

# Step 7: Create Staging Namespace
print_step "Step 7: Creating Staging Namespace"

echo "  Applying namespace configuration..."
kubectl apply -f k8s/staging/namespace.yaml

print_success "Staging namespace created"

echo "  Verifying namespace..."
kubectl get namespace $K8S_NAMESPACE
print_success "Namespace verified"

echo ""

# Step 8: Create Service Account for GCR
print_step "Step 8: Creating GCP Service Account for GCR"

sa_name="going-platform-sa"
if gcloud iam service-accounts describe ${sa_name}@${GCP_PROJECT}.iam.gserviceaccount.com &> /dev/null; then
  echo "  Service account already exists: $sa_name"
else
  echo "  Creating service account..."
  gcloud iam service-accounts create $sa_name \
    --display-name="Going Platform Service Account" \
    --project=$GCP_PROJECT
  print_success "Service account created"
fi

export SA_EMAIL="${sa_name}@${GCP_PROJECT}.iam.gserviceaccount.com"
echo "  Service Account: $SA_EMAIL"

echo ""

# Step 9: Create Service Account Key
print_step "Step 9: Creating Service Account Key"

key_file="/tmp/going-platform-key.json"
if [ ! -f "$key_file" ]; then
  echo "  Creating key..."
  gcloud iam service-accounts keys create $key_file \
    --iam-account=$SA_EMAIL \
    --project=$GCP_PROJECT
  print_success "Service account key created"
else
  echo "  Key already exists at: $key_file"
fi

echo "  Key location: $key_file"

echo ""

# Step 10: Grant IAM Permissions
print_step "Step 10: Granting IAM Permissions"

echo "  Granting storage.objectViewer role..."
gcloud projects add-iam-policy-binding $GCP_PROJECT \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.objectViewer" \
  --condition=None \
  2>&1 | grep -i "updated" || echo "  (Role already assigned)"

print_success "IAM permissions configured"

echo ""

# Step 11: Create Kubernetes Secret for GCR
print_step "Step 11: Creating Kubernetes GCR Secret"

echo "  Creating docker-registry secret..."
kubectl create secret docker-registry gcr-secret \
  --docker-server=gcr.io \
  --docker-username=_json_key \
  --docker-password="$(cat $key_file)" \
  --docker-email=$SA_EMAIL \
  -n $K8S_NAMESPACE \
  --dry-run=client -o yaml | kubectl apply -f -

print_success "GCR secret created"

echo "  Verifying secret..."
kubectl get secret gcr-secret -n $K8S_NAMESPACE
print_success "Secret verified"

echo ""

# Step 12: Update and Apply Secrets
print_step "Step 12: Creating Application Secrets"

echo "  Applying staging secrets..."
kubectl apply -f k8s/staging/staging-secrets.yaml -n $K8S_NAMESPACE

print_success "Application secrets created"

echo ""

# Step 13: Apply ConfigMaps
print_step "Step 13: Creating ConfigMaps"

echo "  Applying staging configuration..."
kubectl apply -f k8s/staging/staging-configmap.yaml -n $K8S_NAMESPACE

print_success "ConfigMaps created"

echo ""

# Step 14: Apply RBAC Configuration
print_step "Step 14: Configuring RBAC"

echo "  Applying RBAC rules..."
kubectl apply -f k8s/staging/rbac.yaml -n $K8S_NAMESPACE

print_success "RBAC configured"

echo ""

# Step 15: Configure Docker Authentication
print_step "Step 15: Configuring Docker Authentication"

echo "  Configuring docker for GCR..."
gcloud auth configure-docker gcr.io

print_success "Docker authentication configured"

echo ""

# Step 16: Verify Setup
print_step "Step 16: Verifying Namespace Setup"

echo ""
echo -e "${YELLOW}Resources in staging namespace:${NC}"

echo ""
echo "  Secrets:"
kubectl get secrets -n $K8S_NAMESPACE --no-headers | wc -l | xargs echo "    Count:"

echo ""
echo "  ConfigMaps:"
kubectl get configmaps -n $K8S_NAMESPACE --no-headers | wc -l | xargs echo "    Count:"

echo ""
echo "  Service Accounts:"
kubectl get serviceaccounts -n $K8S_NAMESPACE --no-headers | wc -l | xargs echo "    Count:"

echo ""
echo "  ResourceQuotas:"
kubectl get resourcequota -n $K8S_NAMESPACE --no-headers | wc -l | xargs echo "    Count:"

print_success "Namespace setup verified"

echo ""

# Final Summary
print_header "✅ STAGING NAMESPACE SETUP COMPLETE!"

echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1️⃣  Build and push Docker images:"
echo "   bash scripts/build-and-push-images.sh"
echo ""
echo "2️⃣  Deploy applications:"
echo "   bash scripts/deploy-staging.sh"
echo ""
echo "3️⃣  Verify deployment:"
echo "   kubectl get pods -n $K8S_NAMESPACE"
echo "   kubectl get services -n $K8S_NAMESPACE"
echo ""
echo "4️⃣  View logs:"
echo "   kubectl logs -f deployment/api-gateway -n $K8S_NAMESPACE"
echo ""
echo -e "${YELLOW}Environment Variables:${NC}"
echo ""
echo "export GCP_PROJECT=$GCP_PROJECT"
echo "export GKE_CLUSTER=$GKE_CLUSTER"
echo "export GKE_ZONE=$GKE_ZONE"
echo "export K8S_NAMESPACE=$K8S_NAMESPACE"
echo ""

print_success "Setup script completed successfully!"
echo ""
