# Phase 2: GCP Authentication & Staging Namespace Setup

## Overview

This guide covers setting up Google Cloud Platform (GCP) authentication and creating the staging namespace for the Going Platform. This is a critical step before deploying to GKE (Google Kubernetes Engine).

**Environment:** Staging
**Target:** Google Kubernetes Engine (GKE)
**Container Registry:** Google Container Registry (GCR)

---

## Prerequisites

### 1. GCP Account & Billing

- [ ] Google Cloud account created at https://console.cloud.google.com
- [ ] Billing enabled on account (required for GKE)
- [ ] Project created (note your `PROJECT_ID`)

### 2. Local Tools Installation

**macOS:**

```bash
# Install gcloud CLI
brew install --cask google-cloud-sdk

# Install kubectl
gcloud components install kubectl

# Install Docker
brew install docker

# Install Helm (optional but recommended)
brew install helm
```

**Linux (Ubuntu/Debian):**

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Install kubectl
gcloud components install kubectl

# Install Docker
sudo apt-get update && sudo apt-get install docker.io

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

**Windows:**

```powershell
# Option 1: Download installer
# https://cloud.google.com/sdk/docs/install

# Option 2: Use Chocolatey
choco install google-cloud-sdk
```

### 3. Verify Installation

```bash
gcloud --version
kubectl version --client
docker --version
helm version
```

---

## Step 1: Initialize GCP Project

### 1.1 Set Project ID

```bash
export GCP_PROJECT="your-project-id"
export GKE_CLUSTER="staging-cluster"
export GKE_ZONE="us-central1-a"
export GCP_REGION="us-central1"

# Verify project exists
gcloud projects list
```

### 1.2 Authenticate with GCP

```bash
# Login to your Google Cloud account
gcloud auth login

# Set default project
gcloud config set project $GCP_PROJECT

# Verify configuration
gcloud config list
```

### 1.3 Enable Required APIs

```bash
# Enable Kubernetes Engine API
gcloud services enable container.googleapis.com

# Enable Compute Engine API
gcloud services enable compute.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Enable Artifact Registry API (recommended)
gcloud services enable artifactregistry.googleapis.com

# Enable Cloud Logging API
gcloud services enable logging.googleapis.com

# Enable Cloud Monitoring API
gcloud services enable monitoring.googleapis.com

# Verify APIs enabled
gcloud services list --enabled
```

---

## Step 2: Create GKE Cluster

### 2.1 Create Staging Cluster (Option A - Recommended)

**Using the provided script:**

```bash
bash scripts/gcp-setup-cluster.sh
```

**Manual creation:**

```bash
gcloud container clusters create $GKE_CLUSTER \
  --zone=$GKE_ZONE \
  --num-nodes=3 \
  --machine-type=n1-standard-2 \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=5 \
  --enable-ip-alias \
  --enable-autorepair \
  --enable-autoupgrade \
  --enable-stackdriver-kubernetes \
  --enable-cloud-logging \
  --enable-cloud-monitoring \
  --addons=HorizontalPodAutoscaling,HttpLoadBalancing,GcePersistentDiskCsiDriver \
  --release-channel=regular \
  --enable-network-policy \
  --cluster-secondary-range-name=pods \
  --services-secondary-range-name=services
```

### 2.2 Verify Cluster Creation

```bash
# List clusters
gcloud container clusters list

# Get cluster details
gcloud container clusters describe $GKE_CLUSTER --zone=$GKE_ZONE

# Wait for cluster to be ready (takes ~10-15 minutes)
# Check status in Cloud Console
```

---

## Step 3: Configure kubectl Access

### 3.1 Get Cluster Credentials

```bash
# Get credentials for your cluster
gcloud container clusters get-credentials $GKE_CLUSTER \
  --zone=$GKE_ZONE \
  --project=$GCP_PROJECT

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### 3.2 Verify Cluster Access

```bash
# Check cluster info
kubectl cluster-info dump | head -20

# List nodes
kubectl get nodes -o wide

# Check system pods
kubectl get pods -n kube-system
```

**Expected Output:**

```
NAME                                    STATUS   ROLES    AGE   VERSION
gke-staging-cluster-pool-abc123-0       Ready    <none>   5m    v1.28.3
gke-staging-cluster-pool-abc123-1       Ready    <none>   5m    v1.28.3
gke-staging-cluster-pool-abc123-2       Ready    <none>   5m    v1.28.3
```

---

## Step 4: Create Staging Namespace

### 4.1 Apply Namespace Configuration

```bash
# Apply namespace, resource quotas, and limit ranges
kubectl apply -f k8s/staging/namespace.yaml

# Verify namespace creation
kubectl get namespace staging
kubectl describe namespace staging
```

### 4.2 Verify Namespace Resources

```bash
# Check ResourceQuota
kubectl describe resourcequota staging-quota -n staging

# Check LimitRange
kubectl describe limitrange staging-limits -n staging
```

---

## Step 5: Configure GCR Authentication

### 5.1 Create Service Account

```bash
# Create GCP service account for GCR access
gcloud iam service-accounts create going-platform-sa \
  --display-name="Going Platform Service Account" \
  --project=$GCP_PROJECT

# Get service account email
export SA_EMAIL=$(gcloud iam service-accounts list \
  --filter="displayName:Going Platform" \
  --format='value(email)' \
  --project=$GCP_PROJECT)

echo "Service Account: $SA_EMAIL"
```

### 5.2 Create Service Account Key

```bash
# Create key for service account
gcloud iam service-accounts keys create \
  /tmp/going-platform-key.json \
  --iam-account=$SA_EMAIL \
  --project=$GCP_PROJECT

# Store key securely (we'll use it later)
cat /tmp/going-platform-key.json
```

### 5.3 Grant Permissions

```bash
# Grant storage.objectViewer for pulling images from GCR
gcloud projects add-iam-policy-binding $GCP_PROJECT \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.objectViewer"

# Grant container registry service agent role
gcloud projects add-iam-policy-binding $GCP_PROJECT \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/container.serviceAgent"
```

### 5.4 Create Kubernetes Secret for GCR

```bash
# Encode the service account key to base64
GCR_AUTH=$(cat /tmp/going-platform-key.json | base64 -w 0)

# Create the docker-registry secret
kubectl create secret docker-registry gcr-secret \
  --docker-server=gcr.io \
  --docker-username=_json_key \
  --docker-password="$(cat /tmp/going-platform-key.json)" \
  --docker-email=$SA_EMAIL \
  -n staging

# Verify secret
kubectl get secret gcr-secret -n staging
kubectl describe secret gcr-secret -n staging
```

---

## Step 6: Create Application Secrets

### 6.1 Update Secret Values

Before applying secrets, update the values in `k8s/staging/staging-secrets.yaml`:

```yaml
# Generate new JWT secret
JWT_SECRET: $(openssl rand -base64 32)

# Update MongoDB URI if using external service
MONGODB_URI: 'mongodb://username:password@host:27017/going-staging'

# Update GCP credentials
gcp-sa-key.json: |
  {paste content of /tmp/going-platform-key.json}
```

### 6.2 Apply Application Secrets

```bash
# Review the file first
cat k8s/staging/staging-secrets.yaml

# Apply secrets
kubectl apply -f k8s/staging/staging-secrets.yaml

# Verify
kubectl get secrets -n staging
kubectl describe secret app-secrets -n staging
```

---

## Step 7: Create ConfigMaps

### 7.1 Apply ConfigMaps

```bash
# Apply staging configuration
kubectl apply -f k8s/staging/staging-configmap.yaml

# Verify
kubectl get configmaps -n staging
kubectl describe configmap app-config -n staging
```

---

## Step 8: Configure GCR Access for Docker

### 8.1 Configure Docker Authentication

```bash
# Authenticate Docker with GCR
gcloud auth configure-docker gcr.io

# Verify authentication
docker ps  # Should not show permission errors
```

### 8.2 Test Image Push (Optional)

```bash
# Test pushing a small image
docker pull alpine:latest
docker tag alpine:latest gcr.io/$GCP_PROJECT/test-image:v1.0.0
docker push gcr.io/$GCP_PROJECT/test-image:v1.0.0

# Verify image in GCR
gcloud container images list --project=$GCP_PROJECT
gcloud container images describe gcr.io/$GCP_PROJECT/test-image:v1.0.0
```

---

## Step 9: Apply RBAC and Network Policies

### 9.1 Apply RBAC Configuration

```bash
# Apply roles and bindings
kubectl apply -f k8s/staging/rbac.yaml

# Verify
kubectl get roles -n staging
kubectl get rolebindings -n staging
kubectl get clusterroles | grep staging
```

### 9.2 Apply Pod Disruption Budgets

```bash
# Already included in rbac.yaml
kubectl get pdb -n staging
```

---

## Step 10: Verify Staging Namespace Setup

### 10.1 Check All Resources

```bash
# Check namespace
kubectl get namespace staging

# Check secrets
kubectl get secrets -n staging

# Check configmaps
kubectl get configmaps -n staging

# Check service accounts
kubectl get serviceaccounts -n staging

# Check roles and bindings
kubectl get roles,rolebindings -n staging

# Check resource quotas and limits
kubectl describe resourcequota -n staging
kubectl describe limitrange -n staging
```

### 10.2 Validate Configuration

```bash
# Validate that GCR secret can access images
kubectl run test-image-pull \
  --image=gcr.io/$GCP_PROJECT/test-image:v1.0.0 \
  --overrides='{"spec":{"serviceAccount":"going-platform","imagePullSecrets":[{"name":"gcr-secret"}]}}' \
  -n staging \
  --rm -it \
  --restart=Never \
  -- echo "Image pull successful"
```

---

## Step 11: Setup Cloud Logging and Monitoring

### 11.1 Enable Cloud Logging

```bash
# Cloud Logging should be enabled already from cluster creation
# Verify the setting
gcloud container clusters describe $GKE_CLUSTER \
  --zone=$GKE_ZONE \
  --format="value(loggingService)"

# If not enabled, update cluster
gcloud container clusters update $GKE_CLUSTER \
  --zone=$GKE_ZONE \
  --enable-cloud-logging
```

### 11.2 View Logs

```bash
# View cluster logs
gcloud logging read \
  "resource.type=k8s_cluster AND resource.labels.cluster_name=$GKE_CLUSTER" \
  --limit 50 \
  --format json

# View pod logs
kubectl logs -f deployment/api-gateway -n staging
```

---

## Step 12: Network Configuration

### 12.1 Create Static IP Address (Optional)

```bash
# Create static IP for API Gateway
gcloud compute addresses create going-staging-ip \
  --region=$GCP_REGION \
  --project=$GCP_PROJECT

# Get the IP address
gcloud compute addresses describe going-staging-ip \
  --region=$GCP_REGION \
  --format="value(address)"
```

### 12.2 Configure Firewall Rules

```bash
# Create firewall rule for staging cluster
gcloud compute firewall-rules create allow-staging-ingress \
  --allow=tcp:80,tcp:443 \
  --target-tags=gke-staging-cluster \
  --project=$GCP_PROJECT

# Verify
gcloud compute firewall-rules list --filter="name:*staging*"
```

---

## Next Steps

After completing this setup:

1. **Build and Push Docker Images:**

   ```bash
   bash scripts/build-and-push-images.sh
   ```

2. **Deploy Applications:**

   ```bash
   bash scripts/deploy-staging.sh
   ```

3. **Run Validation Tests:**

   ```bash
   bash scripts/validate-staging.sh
   ```

4. **Monitor Staging:**
   ```bash
   kubectl get pods -n staging
   kubectl logs -f deployment/api-gateway -n staging
   ```

---

## Troubleshooting

### Issue: `gcloud` command not found

**Solution:**

```bash
# Ensure gcloud is in PATH
export PATH="$PATH:$HOME/google-cloud-sdk/bin"

# Or reinstall
curl https://sdk.cloud.google.com | bash
```

### Issue: Permission denied for GCP Project

**Solution:**

```bash
# Check current user
gcloud auth list

# Switch to correct account
gcloud auth login [your-email]

# Set correct project
gcloud config set project $GCP_PROJECT
```

### Issue: GKE Cluster stuck in creating state

**Solution:**

```bash
# Check cluster status
gcloud container clusters describe $GKE_CLUSTER --zone=$GKE_ZONE

# If stuck, delete and recreate
gcloud container clusters delete $GKE_CLUSTER --zone=$GKE_ZONE

# Check events
gcloud container operations list --project=$GCP_PROJECT
```

### Issue: kubectl can't connect to cluster

**Solution:**

```bash
# Reconfigure credentials
gcloud container clusters get-credentials $GKE_CLUSTER --zone=$GKE_ZONE

# Verify context
kubectl config current-context

# List available contexts
kubectl config get-contexts
```

### Issue: Image pull errors

**Solution:**

```bash
# Check secret exists
kubectl get secret gcr-secret -n staging

# Verify service account is linked
kubectl get serviceaccount api-gateway -n staging -o yaml

# Check pod events
kubectl describe pod <pod-name> -n staging

# Re-create secret if needed
kubectl delete secret gcr-secret -n staging
kubectl create secret docker-registry gcr-secret \
  --docker-server=gcr.io \
  --docker-username=_json_key \
  --docker-password="$(cat /tmp/going-platform-key.json)" \
  -n staging
```

---

## Security Best Practices

1. **Service Account Keys:**

   - [ ] Store key securely (not in version control)
   - [ ] Rotate keys regularly
   - [ ] Use Workload Identity when possible

2. **RBAC:**

   - [ ] Review role permissions regularly
   - [ ] Follow principle of least privilege
   - [ ] Audit role bindings

3. **Network Security:**

   - [ ] Enable network policies
   - [ ] Configure firewall rules
   - [ ] Use VPC for isolation

4. **Secrets Management:**
   - [ ] Never commit secrets to Git
   - [ ] Use encrypted secrets
   - [ ] Audit secret access

---

## Environment Variables Reference

```bash
# GCP Configuration
export GCP_PROJECT="your-project-id"
export GKE_CLUSTER="staging-cluster"
export GKE_ZONE="us-central1-a"
export GCP_REGION="us-central1"
export GCR_REGISTRY="gcr.io"

# Service Account
export SA_EMAIL="going-platform-sa@${GCP_PROJECT}.iam.gserviceaccount.com"

# Image Configuration
export IMAGE_TAG="v1.0.0"
export DOCKER_REGISTRY="gcr.io/$GCP_PROJECT"

# Kubernetes
export K8S_NAMESPACE="staging"
```

---

## Automated Setup Script

Use the provided script to automate most of these steps:

```bash
bash scripts/gcp-setup-namespace.sh \
  --project $GCP_PROJECT \
  --cluster $GKE_CLUSTER \
  --zone $GKE_ZONE
```

---

## References

- [GCP Console](https://console.cloud.google.com)
- [GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)
- [GCR Documentation](https://cloud.google.com/container-registry/docs)
- [kubectl Documentation](https://kubernetes.io/docs/reference/kubectl/)
- [Cloud SDK Documentation](https://cloud.google.com/sdk/docs)

---

## Support

For issues or questions:

1. Check the Troubleshooting section above
2. Review [GKE Docs](https://cloud.google.com/kubernetes-engine/docs)
3. Check [Cloud Console](https://console.cloud.google.com) for error messages
4. Run diagnostic commands to collect logs

---

**Phase 2 Setup Complete! Ready for deployment.**
