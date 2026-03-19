# 🚀 GCP Staging Deployment Guide

**Platform:** Google Cloud Platform (GCP)
**Kubernetes:** Google Kubernetes Engine (GKE)
**Registry:** Google Container Registry (GCR)
**Date:** Feb 23, 2026

---

## ✅ Prerequisites

### 1. Google Cloud Account

- [ ] GCP account created
- [ ] Billing enabled
- [ ] Project created (note your PROJECT_ID)

### 2. GCP Tools Installation

**macOS:**

```bash
# Install gcloud CLI
brew install --cask google-cloud-sdk

# Install kubectl
gcloud components install kubectl

# Install Docker
brew install docker
```

**Linux:**

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Install kubectl
gcloud components install kubectl

# Install Docker
sudo apt-get install docker.io
```

**Windows:**

```bash
# Download from: https://cloud.google.com/sdk/docs/install-sdk
# Or use: choco install google-cloud-sdk
```

### 3. Verify Installation

```bash
gcloud --version
kubectl version --client
docker --version
```

---

## 📋 Step 1: Configure GCP & GKE Access

### 1.1 Authenticate with GCP

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
export GCP_PROJECT="your-project-id"
gcloud config set project $GCP_PROJECT

# Verify
gcloud config list
```

### 1.2 Create or Connect to GKE Cluster

**Option A: Use Existing Cluster**

```bash
# List existing clusters
gcloud container clusters list

# Get credentials
export GKE_CLUSTER="staging-cluster"
export GKE_ZONE="us-central1-a"

gcloud container clusters get-credentials $GKE_CLUSTER --zone=$GKE_ZONE

# Verify connection
kubectl cluster-info
kubectl get nodes
```

**Option B: Create New GKE Cluster**

```bash
# Create cluster (takes ~10 minutes)
gcloud container clusters create staging-cluster \
  --zone=us-central1-a \
  --num-nodes=3 \
  --machine-type=n1-standard-2 \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=5 \
  --enable-ip-alias \
  --enable-autorepair \
  --enable-autoupgrade

# Get credentials
gcloud container clusters get-credentials staging-cluster --zone=us-central1-a

# Verify
kubectl get nodes
```

### 1.3 Verify Cluster Access

```bash
kubectl cluster-info
kubectl get nodes
kubectl get namespaces
```

✅ **Expected Output:**

```
NAME                                    STATUS   ROLES    AGE   VERSION
gke-staging-cluster-pool-abc123         Ready    <none>   2d    v1.28.3
gke-staging-cluster-pool-def456         Ready    <none>   2d    v1.28.3
gke-staging-cluster-pool-ghi789         Ready    <none>   2d    v1.28.3
```

---

## 📦 Step 2: Build & Push Docker Images to GCR

### 2.1 Configure Docker for GCR

```bash
# Configure docker authentication
gcloud auth configure-docker gcr.io

# Verify
docker ps  # Should not show permission errors
```

### 2.2 Build Docker Images

```bash
export IMAGE_TAG="v1.0.0"
export GCP_PROJECT="your-project-id"
export GCR_REGISTRY="gcr.io"

# Build API Gateway
docker build \
  -t $GCR_REGISTRY/$GCP_PROJECT/api-gateway:$IMAGE_TAG \
  .

# Build Frontend
docker build \
  -f apps/corporate-portal/Dockerfile \
  -t $GCR_REGISTRY/$GCP_PROJECT/corporate-portal:$IMAGE_TAG \
  apps/corporate-portal/

# Verify builds
docker images | grep going
```

✅ **Expected Output:**

```
gcr.io/your-project-id/api-gateway         v1.0.0    abc123...   1.2GB
gcr.io/your-project-id/corporate-portal    v1.0.0    def456...   800MB
```

### 2.3 Push Images to GCR

```bash
# Push API Gateway
docker push gcr.io/$GCP_PROJECT/api-gateway:$IMAGE_TAG

# Push Frontend
docker push gcr.io/$GCP_PROJECT/corporate-portal:$IMAGE_TAG

# Verify
gcloud container images list --project=$GCP_PROJECT
```

✅ **Expected Output:**

```
gcr.io/your-project-id/api-gateway
gcr.io/your-project-id/corporate-portal
```

---

## 🏗️ Step 3: Create Kubernetes Resources

### 3.1 Create Namespace

```bash
kubectl create namespace staging

# Verify
kubectl get namespaces
```

### 3.2 Create GCR Secret

```bash
# Configure GCR access for Kubernetes
kubectl create secret docker-registry gcr-secret \
  --docker-server=gcr.io \
  --docker-username=_json_key \
  --docker-password="$(cat ~/.config/gcloud/application_default_credentials.json)" \
  -n staging

# Verify
kubectl get secrets -n staging
```

### 3.3 Create ConfigMap

```bash
# From environment variables
kubectl create configmap app-config \
  --from-file=.env.example \
  -n staging

# Verify
kubectl describe configmap app-config -n staging
```

---

## 🚀 Step 4: Deploy to GKE

### 4.1 Prepare Kubernetes Manifests

Update `k8s/staging/` manifests with your image:

```yaml
# k8s/staging/api-gateway-deployment.yaml
spec:
  containers:
    - name: api-gateway
      image: gcr.io/YOUR_PROJECT_ID/api-gateway:v1.0.0 # ← Update this
      imagePullPolicy: Always
      imagePullSecrets:
        - name: gcr-secret
```

### 4.2 Apply Manifests

```bash
# Deploy all resources
kubectl apply -f k8s/staging/ -n staging

# Verify deployments
kubectl get deployments -n staging
kubectl get services -n staging
kubectl get pods -n staging
```

### 4.3 Wait for Rollout

```bash
# Wait for API Gateway
kubectl rollout status deployment/api-gateway -n staging --timeout=5m

# Wait for Corporate Portal
kubectl rollout status deployment/corporate-portal -n staging --timeout=5m

# Check pod status
kubectl get pods -n staging
```

✅ **Expected Output:**

```
NAME                                    READY   STATUS    RESTARTS   AGE
api-gateway-abc123-def456               1/1     Running   0          2m
corporate-portal-ghi789-jkl012          1/1     Running   0          2m
mongodb-mno345-pqr678                   1/1     Running   0          5m
redis-stu901-vwx234                     1/1     Running   0          5m
```

---

## ✅ Step 5: Validation Testing (8 Checks)

### 5.1 Get Service IPs

```bash
kubectl get svc -n staging -o wide

# Example output:
# NAME                TYPE           CLUSTER-IP       EXTERNAL-IP    PORT(S)
# api-gateway         LoadBalancer   10.0.1.100       35.192.1.50    3000:31234/TCP
# corporate-portal    LoadBalancer   10.0.1.101       35.192.1.51    80:31235/TCP
```

### 5.2 Run 8 Validation Tests

**1. Health Check ✅**

```bash
API_IP="35.192.1.50"
curl -X GET http://$API_IP:3000/health
# Expected: {"status":"ok","timestamp":"..."}
```

**2. Swagger Docs ✅**

```bash
curl -X GET http://$API_IP:3000/docs
# Expected: HTML page with Swagger UI
```

**3. Login/JWT ✅**

```bash
curl -X POST http://$API_IP:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
# Expected: {"accessToken":"eyJhbGc...","refreshToken":"..."}
```

**4. CORS ✅**

```bash
curl -X OPTIONS http://$API_IP:3000/auth/login \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  -v
# Expected: Access-Control headers in response
```

**5. WebSocket ✅**

```bash
# Test from browser console:
const socket = io('http://35.192.1.50:3000', {
  auth: { token: 'your-jwt-token' }
});
socket.on('connect', () => {
  console.log('Connected!', socket.id);
});
```

**6. Database ✅**

```bash
# Check health endpoint (includes DB query)
curl http://$API_IP:3000/health
```

**7. Logging ✅**

```bash
kubectl logs -f deployment/api-gateway -n staging
# Should show request logs
```

**8. Frontend ✅**

```bash
# Get frontend IP
FRONTEND_IP="35.192.1.51"
curl http://$FRONTEND_IP
# Expected: HTML page with React app
```

---

## 📊 Step 6: Monitor & Debug

### 6.1 View Logs

```bash
# Real-time logs
kubectl logs -f deployment/api-gateway -n staging

# Previous logs
kubectl logs deployment/api-gateway -n staging --previous

# All pod logs
kubectl logs -l app=api-gateway -n staging
```

### 6.2 Port Forwarding (for local testing)

```bash
# Forward API Gateway
kubectl port-forward svc/api-gateway 3000:3000 -n staging

# In another terminal:
curl http://localhost:3000/health
```

### 6.3 Describe Resources

```bash
# Get pod details
kubectl describe pod <POD_NAME> -n staging

# Get service details
kubectl get svc api-gateway -n staging -o yaml

# Get deployment details
kubectl describe deployment api-gateway -n staging
```

### 6.4 Resource Monitoring

```bash
# CPU & Memory usage
kubectl top pods -n staging
kubectl top nodes

# Events
kubectl get events -n staging --sort-by='.lastTimestamp'
```

---

## 🔧 Troubleshooting

### Issue: Pods not starting

**Check pod status:**

```bash
kubectl describe pod <POD_NAME> -n staging
```

**Common causes:**

```
1. Image pull errors
   → Verify GCR secret is configured
   → Verify image exists in GCR

2. Insufficient resources
   → kubectl top nodes
   → Scale cluster: gcloud container clusters resize $GKE_CLUSTER --num-nodes=5

3. Configuration missing
   → Check ConfigMap: kubectl get cm -n staging
   → Check Secrets: kubectl get secrets -n staging
```

### Issue: Service has no external IP

**Check service type:**

```bash
kubectl get svc api-gateway -n staging
# If TYPE is ClusterIP instead of LoadBalancer, update manifest

kubectl patch svc api-gateway -n staging \
  -p '{"spec":{"type":"LoadBalancer"}}'
```

### Issue: Database connection failed

**Check MongoDB pod:**

```bash
kubectl logs deployment/mongodb -n staging
kubectl exec -it <MONGODB_POD> -- mongosh
```

**Check connectivity:**

```bash
kubectl exec -it <API_POD> -- \
  curl http://mongodb:27017
```

---

## 📈 Production Readiness Checklist

- [ ] All 8 validation tests passing
- [ ] Logs appearing in Cloud Logging
- [ ] Metrics visible in Cloud Monitoring
- [ ] No error events in Kubernetes
- [ ] Load test passed (100+ req/s)
- [ ] Database backups configured
- [ ] SSL/TLS certificates installed
- [ ] Domain DNS configured
- [ ] Team review & approval completed
- [ ] Runbooks documented

---

## 🎯 Next Steps

### 24-Hour Monitoring Period

```bash
# Monitor metrics
gcloud compute instances list
gcloud container clusters describe $GKE_CLUSTER --zone=$GKE_ZONE

# Check Cloud Logging
gcloud logging read \
  "resource.type=k8s_cluster AND resource.labels.cluster_name=$GKE_CLUSTER" \
  --limit 50 \
  --format json
```

### After 24-Hour Validation

1. ✅ All tests passing
2. ✅ No errors in logs
3. ✅ Performance metrics acceptable
4. ✅ Database backups working
5. ✅ Team approval obtained

### Proceed to Production Deployment

See: `PRODUCTION_DEPLOYMENT.md`

---

## 📚 Additional Resources

- [GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)
- [GCR Documentation](https://cloud.google.com/container-registry/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs)
- [Cloud Logging](https://cloud.google.com/logging/docs)
- [Cloud Monitoring](https://cloud.google.com/monitoring/docs)

---

## ✅ Deployment Complete!

Your Going Platform is now deployed to GCP staging environment.

**Next:** Follow [STAGING_VALIDATION_REPORT.md](./STAGING_VALIDATION_REPORT.md) for detailed validation.
