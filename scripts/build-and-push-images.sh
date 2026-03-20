#!/bin/bash

# 🐳 BUILD AND PUSH DOCKER IMAGES TO GCR
# Builds Docker images and pushes them to Google Container Registry
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
GCR_REGISTRY=${GCR_REGISTRY:-"gcr.io"}

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

print_header "🐳 BUILD AND PUSH DOCKER IMAGES TO GCR"

# Validate inputs
if [ -z "$GCP_PROJECT" ]; then
  print_error "GCP_PROJECT is not set"
  echo ""
  echo "Usage: bash scripts/build-and-push-images.sh --project YOUR_PROJECT_ID [--tag IMAGE_TAG]"
  echo ""
  echo "Examples:"
  echo "  bash scripts/build-and-push-images.sh --project my-project"
  echo "  bash scripts/build-and-push-images.sh --project my-project --tag v1.2.0"
  exit 1
fi

echo -e "${YELLOW}Configuration:${NC}"
echo "  GCP Project: $GCP_PROJECT"
echo "  Image Tag: $IMAGE_TAG"
echo "  GCR Registry: $GCR_REGISTRY"
echo ""

# Step 1: Verify Docker
print_step "Step 1: Verifying Docker"

if ! command -v docker &> /dev/null; then
  print_error "Docker not found"
  echo "Install from: https://docs.docker.com/get-docker/"
  exit 1
fi
print_success "Docker found"

if ! docker ps &> /dev/null; then
  print_error "Docker daemon is not running"
  echo "Start Docker and try again"
  exit 1
fi
print_success "Docker daemon running"

echo ""

# Step 2: Configure Docker for GCR
print_step "Step 2: Configuring Docker for GCR"

echo "  Configuring docker authentication for GCR..."
gcloud auth configure-docker $GCR_REGISTRY

print_success "Docker configured for GCR"

echo ""

# Step 3: Build API Gateway Image
print_step "Step 3: Building API Gateway Image"

echo "  Building image: $GCR_REGISTRY/$GCP_PROJECT/api-gateway:$IMAGE_TAG"
docker build \
  --tag $GCR_REGISTRY/$GCP_PROJECT/api-gateway:$IMAGE_TAG \
  --tag $GCR_REGISTRY/$GCP_PROJECT/api-gateway:latest \
  .

print_success "API Gateway image built"

echo ""

# Step 4: Build Corporate Portal Image
print_step "Step 4: Building Corporate Portal Image"

if [ -f "apps/corporate-portal/Dockerfile" ]; then
  echo "  Building image: $GCR_REGISTRY/$GCP_PROJECT/corporate-portal:$IMAGE_TAG"
  docker build \
    --file apps/corporate-portal/Dockerfile \
    --tag $GCR_REGISTRY/$GCP_PROJECT/corporate-portal:$IMAGE_TAG \
    --tag $GCR_REGISTRY/$GCP_PROJECT/corporate-portal:latest \
    apps/corporate-portal/

  print_success "Corporate Portal image built"
else
  echo "  Dockerfile not found at apps/corporate-portal/Dockerfile"
  echo "  Skipping Corporate Portal build"
fi

echo ""

# Step 5: Verify Built Images
print_step "Step 5: Verifying Built Images"

echo "  Local Docker images:"
docker images | grep "$GCP_PROJECT" || true
print_success "Images built successfully"

echo ""

# Step 6: Push API Gateway to GCR
print_step "Step 6: Pushing API Gateway to GCR"

echo "  Pushing: $GCR_REGISTRY/$GCP_PROJECT/api-gateway:$IMAGE_TAG"
docker push $GCR_REGISTRY/$GCP_PROJECT/api-gateway:$IMAGE_TAG

echo "  Pushing: $GCR_REGISTRY/$GCP_PROJECT/api-gateway:latest"
docker push $GCR_REGISTRY/$GCP_PROJECT/api-gateway:latest

print_success "API Gateway pushed to GCR"

echo ""

# Step 7: Push Corporate Portal to GCR
print_step "Step 7: Pushing Corporate Portal to GCR"

if docker image inspect $GCR_REGISTRY/$GCP_PROJECT/corporate-portal:$IMAGE_TAG &> /dev/null; then
  echo "  Pushing: $GCR_REGISTRY/$GCP_PROJECT/corporate-portal:$IMAGE_TAG"
  docker push $GCR_REGISTRY/$GCP_PROJECT/corporate-portal:$IMAGE_TAG

  echo "  Pushing: $GCR_REGISTRY/$GCP_PROJECT/corporate-portal:latest"
  docker push $GCR_REGISTRY/$GCP_PROJECT/corporate-portal:latest

  print_success "Corporate Portal pushed to GCR"
else
  echo "  Corporate Portal image not found, skipping push"
fi

echo ""

# Step 8: Verify Images in GCR
print_step "Step 8: Verifying Images in GCR"

echo "  Listing images in GCR:"
gcloud container images list --project=$GCP_PROJECT

print_success "Images verified in GCR"

echo ""

# Step 9: Display Image Information
print_step "Step 9: Image Information"

echo ""
echo -e "${YELLOW}Pushed Images:${NC}"
echo ""

# API Gateway
if gcloud container images describe $GCR_REGISTRY/$GCP_PROJECT/api-gateway:$IMAGE_TAG &> /dev/null; then
  echo "  API Gateway:"
  echo "    URI: $GCR_REGISTRY/$GCP_PROJECT/api-gateway:$IMAGE_TAG"
  gcloud container images describe $GCR_REGISTRY/$GCP_PROJECT/api-gateway:$IMAGE_TAG \
    --format="value(image_summary.digest)" | xargs echo "    Digest:"
  echo ""
fi

# Corporate Portal
if gcloud container images describe $GCR_REGISTRY/$GCP_PROJECT/corporate-portal:$IMAGE_TAG &> /dev/null; then
  echo "  Corporate Portal:"
  echo "    URI: $GCR_REGISTRY/$GCP_PROJECT/corporate-portal:$IMAGE_TAG"
  gcloud container images describe $GCR_REGISTRY/$GCP_PROJECT/corporate-portal:$IMAGE_TAG \
    --format="value(image_summary.digest)" | xargs echo "    Digest:"
  echo ""
fi

# Final Summary
print_header "✅ DOCKER IMAGES PUSHED TO GCR!"

echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1️⃣  Update k8s/staging/ manifests with image URIs:"
echo "   sed -i 's|gcr.io/GCP_PROJECT|$GCR_REGISTRY/$GCP_PROJECT|g' k8s/staging/*.yaml"
echo "   sed -i 's|IMAGE_TAG|$IMAGE_TAG|g' k8s/staging/*.yaml"
echo ""
echo "2️⃣  Deploy to staging:"
echo "   bash scripts/deploy-staging.sh"
echo ""
echo "3️⃣  Verify deployment:"
echo "   kubectl get pods -n staging"
echo ""

print_success "Image build and push completed!"
echo ""
