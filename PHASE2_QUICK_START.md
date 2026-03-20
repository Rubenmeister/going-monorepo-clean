# Phase 2: Quick Start Guide

## GCP Authentication & Staging Namespace Setup

This quick start guide provides step-by-step instructions for setting up Phase 2 of the Going Platform deployment.

---

## 🎯 Phase 2 Objectives

- ✅ Set up GCP project and authentication
- ✅ Create GKE staging cluster
- ✅ Configure kubectl access
- ✅ Create staging namespace with resource quotas
- ✅ Set up GCR (Google Container Registry)
- ✅ Create Kubernetes secrets and ConfigMaps
- ✅ Configure RBAC
- ✅ Build and push Docker images
- ✅ Deploy to staging environment

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] GCP account with billing enabled
- [ ] Google Cloud SDK installed (`gcloud`)
- [ ] kubectl installed
- [ ] Docker installed
- [ ] GCP project ID ready
- [ ] Clone of this repository

**Installation:**

```bash
# macOS
brew install --cask google-cloud-sdk
gcloud components install kubectl
brew install docker

# Ubuntu/Debian
curl https://sdk.cloud.google.com | bash
gcloud components install kubectl
sudo apt-get install docker.io
```

---

## 🚀 Phase 2 Setup (5 Steps)

### Step 1: Initialize GCP Project

**Time: 5 minutes**

```bash
# Set environment variables
export GCP_PROJECT="your-project-id"
export GKE_CLUSTER="staging-cluster"
export GKE_ZONE="us-central1-a"

# Login to GCP
gcloud auth login

# Set default project
gcloud config set project $GCP_PROJECT

# Enable required APIs
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

**Verify:**

```bash
gcloud config list
gcloud projects describe $GCP_PROJECT
```

---

### Step 2: Create GKE Cluster (or Use Existing)

**Time: 10-15 minutes**

**Option A: Create New Cluster**

```bash
gcloud container clusters create $GKE_CLUSTER \
  --zone=$GKE_ZONE \
  --num-nodes=3 \
  --machine-type=n1-standard-2 \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=5 \
  --enable-cloud-logging \
  --enable-cloud-monitoring
```

**Option B: Use Existing Cluster**

```bash
gcloud container clusters list
# Note your cluster name and zone
```

---

### Step 3: Configure kubectl and Create Namespace

**Time: 5 minutes**

```bash
# Get cluster credentials
gcloud container clusters get-credentials $GKE_CLUSTER --zone=$GKE_ZONE

# Verify connection
kubectl cluster-info
kubectl get nodes

# Run the automated setup script
bash scripts/gcp-setup-namespace.sh --project $GCP_PROJECT --cluster $GKE_CLUSTER --zone $GKE_ZONE
```

**What this does:**

- Creates staging namespace
- Sets up resource quotas
- Creates GCP service account
- Generates service account key
- Creates Kubernetes secrets for GCR
- Applies ConfigMaps and RBAC

**Verify:**

```bash
kubectl get namespace staging
kubectl get secrets -n staging
kubectl get configmaps -n staging
```

---

### Step 4: Build and Push Docker Images

**Time: 5-10 minutes**

```bash
# Build and push images to GCR
bash scripts/build-and-push-images.sh --project $GCP_PROJECT --tag v1.0.0
```

**What this does:**

- Configures Docker for GCR
- Builds API Gateway image
- Builds Corporate Portal image
- Pushes both images to GCR

**Verify:**

```bash
gcloud container images list --project=$GCP_PROJECT
gcloud container images describe gcr.io/$GCP_PROJECT/api-gateway:v1.0.0
```

---

### Step 5: Deploy to Staging

**Time: 5 minutes**

```bash
# Deploy applications to staging
bash scripts/deploy-staging.sh --project $GCP_PROJECT --tag v1.0.0
```

**What this does:**

- Applies Kubernetes manifests
- Deploys API Gateway
- Deploys Corporate Portal
- Creates LoadBalancer services

**Verify:**

```bash
kubectl get pods -n staging
kubectl get services -n staging
kubectl get deployments -n staging
```

---

## 📊 Verification & Validation

### Check Deployment Status

```bash
# Check if pods are running
kubectl get pods -n staging

# Check services
kubectl get svc -n staging

# Expected output should show:
# - 2 API Gateway pods (running)
# - 2 Corporate Portal pods (running)
# - 2 LoadBalancer services
```

### Test API Gateway

```bash
# Get the external IP
API_IP=$(kubectl get svc api-gateway -n staging -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test health endpoint
curl http://$API_IP:3000/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### View Logs

```bash
# API Gateway logs
kubectl logs -f deployment/api-gateway -n staging

# Corporate Portal logs
kubectl logs -f deployment/corporate-portal -n staging

# Specific pod logs
kubectl logs <pod-name> -n staging
```

### Port Forward for Local Testing

```bash
# Forward API Gateway
kubectl port-forward svc/api-gateway 3000:80 -n staging

# In another terminal, test locally:
curl http://localhost:3000/health
```

---

## 🔧 Useful Commands

### Monitor Deployments

```bash
# Watch pod status
kubectl get pods -n staging --watch

# Get detailed pod info
kubectl describe pod <pod-name> -n staging

# View events
kubectl get events -n staging --sort-by='.lastTimestamp'
```

### Check Resource Usage

```bash
# CPU and memory usage
kubectl top pods -n staging
kubectl top nodes

# Get pod details
kubectl describe deployment api-gateway -n staging
```

### Manage Deployments

```bash
# Rollout status
kubectl rollout status deployment/api-gateway -n staging

# Rollback to previous version
kubectl rollout undo deployment/api-gateway -n staging

# Restart deployment
kubectl rollout restart deployment/api-gateway -n staging
```

### Update Environment Variables

```bash
# Edit ConfigMap
kubectl edit configmap app-config -n staging

# Edit secrets
kubectl edit secret app-secrets -n staging

# Restart pods to pick up changes
kubectl rollout restart deployment/api-gateway -n staging
```

---

## 🐛 Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n staging

# Check logs
kubectl logs <pod-name> -n staging

# Common issues:
# - Image pull errors: Check GCR secret
# - Insufficient resources: Check node capacity
# - Configuration missing: Check ConfigMap/Secret
```

### Image Pull Errors

```bash
# Verify GCR secret
kubectl get secret gcr-secret -n staging

# Recreate if needed
kubectl delete secret gcr-secret -n staging
kubectl create secret docker-registry gcr-secret \
  --docker-server=gcr.io \
  --docker-username=_json_key \
  --docker-password="$(cat /tmp/going-platform-key.json)" \
  -n staging
```

### Service Has No External IP

```bash
# Check service type
kubectl get svc api-gateway -n staging

# Should be LoadBalancer (not ClusterIP)
# If not, patch it:
kubectl patch svc api-gateway -n staging -p '{"spec":{"type":"LoadBalancer"}}'

# Wait a few minutes for IP to be assigned
kubectl get svc api-gateway -n staging --watch
```

---

## 📝 Next Steps (Phase 3+)

After successfully deploying to staging:

1. **Phase 3: Observability Setup**

   - Deploy ELK stack (Elasticsearch, Kibana, Logstash)
   - Deploy Prometheus + Grafana
   - Set up logging and monitoring

2. **Phase 4: Expand E2E Tests**

   - Add visual regression tests
   - Add performance tests
   - Improve test coverage

3. **Production Deployment**
   - Create production namespace
   - Set up backup and disaster recovery
   - Configure SSL/TLS
   - Set up CI/CD pipeline

---

## 📚 Reference Guides

- **Detailed Setup:** See [PHASE2_GCP_SETUP.md](./PHASE2_GCP_SETUP.md)
- **Kubernetes Docs:** https://kubernetes.io/docs
- **GKE Docs:** https://cloud.google.com/kubernetes-engine/docs
- **GCR Docs:** https://cloud.google.com/container-registry/docs

---

## ✅ Phase 2 Completion Checklist

- [ ] GCP project created and configured
- [ ] GKE cluster created
- [ ] kubectl configured and verified
- [ ] Staging namespace created with quotas
- [ ] GCR authentication configured
- [ ] Docker images built and pushed
- [ ] Applications deployed to staging
- [ ] Services have external IPs
- [ ] API health endpoint responds
- [ ] Logs appearing in Cloud Logging
- [ ] Resource usage within quotas
- [ ] All pods running successfully

---

## 🆘 Need Help?

1. Check the **Troubleshooting** section above
2. Review [PHASE2_GCP_SETUP.md](./PHASE2_GCP_SETUP.md) for detailed information
3. Check [GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)
4. View Cloud Console: https://console.cloud.google.com

---

**Phase 2: GCP Authentication & Staging Namespace Setup - Complete!** 🎉
