# Windows Deployment Recovery & Execution Guide

**Status**: Code ready on branch `claude/complete-going-platform-TJOI8`
**Issues Found**: Unfinished merge, dependency version mismatch, partial pnpm install
**Solution**: Complete recovery with proper sequencing

---

## 🔧 Step-by-Step Recovery Plan

### Step 1: Resolve Unfinished Merge (on Windows)

```powershell
cd C:\Users\USER1\going-monorepo-clean

# Check merge status
git status

# If you see "MERGE_HEAD exists", abort the merge:
git merge --abort

# Verify clean state
git status
# Expected: "nothing to commit, working tree clean"
```

### Step 2: Clean Local Environment

```powershell
# Delete old node_modules (causes pnpm conflicts)
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force pnpm-lock.yaml

# Or use:
# rm -r node_modules
# rm pnpm-lock.yaml
```

### Step 3: Update to Latest Code

```powershell
# Ensure you're on correct branch
git checkout claude/complete-going-platform-TJOI8

# Pull latest changes (includes the fixed anfitriones-service)
git pull origin claude/complete-going-platform-TJOI8
```

### Step 4: Install with pnpm (Correct Way)

```powershell
# Install globally if not already done
npm install -g pnpm

# Verify pnpm installation
pnpm --version
# Expected: 9.x.x or later

# Install all dependencies
pnpm install
# Expected: No errors, shows workspace projects

# Verify install worked
pnpm list | head -20
```

### Step 5: Run Pre-Deployment Validation

#### 5A: Build All Packages

```powershell
# Build individual apps (correct command)
pnpm run build:webapp
pnpm run build:admin

# Or build all in sequence
pnpm run build:all
```

#### 5B: Run Tests

```powershell
# Run all tests with coverage
pnpm test:all
# Expected: 115+ tests passing

# Or run specific tests:
pnpm test:unit          # Unit tests only
pnpm test:integration   # Integration tests only
```

#### 5C: Type Check (TypeScript Validation)

```powershell
# Use npx tsc directly (typecheck script not available at root)
npx tsc --noEmit
# Expected: No errors
```

#### 5D: Lint Code

```powershell
# Lint affected files
pnpm lint
# Expected: No errors

# Or lint everything
pnpm run lint:all
```

### Step 6: Verify Pre-Deployment Checklist

Create a file `DEPLOYMENT_CHECKLIST_LOCAL.md` and verify:

- [ ] Branch: `claude/complete-going-platform-TJOI8`
- [ ] All tests passing: `pnpm test:all`
- [ ] Build successful: `pnpm run build:all`
- [ ] TypeScript clean: `npx tsc --noEmit`
- [ ] Lint passing: `pnpm lint`
- [ ] No merge conflicts: `git status`
- [ ] All commits pushed: `git log origin/HEAD...HEAD` (should be empty)

---

## 🚀 Next Steps: GCP Deployment

Once local validation passes, proceed with:

### Step 1: Setup GCP (if not done)

```powershell
# Install Google Cloud SDK
# Download from: https://cloud.google.com/sdk/docs/install-sdk
# Or use: choco install google-cloud-sdk

# Verify installation
gcloud --version
kubectl version --client
docker --version

# Login to Google Cloud
gcloud auth login

# Set project
$env:GCP_PROJECT = "your-project-id"
gcloud config set project $env:GCP_PROJECT

# Create GKE cluster
gcloud container clusters create staging-cluster `
  --zone=us-central1-a `
  --num-nodes=3 `
  --machine-type=n1-standard-2 `
  --enable-autoscaling --min-nodes=2 --max-nodes=5

# Get credentials
gcloud container clusters get-credentials staging-cluster --zone=us-central1-a

# Verify
kubectl cluster-info
kubectl get nodes
```

### Step 2: Build & Push Docker Image

```powershell
# Configure Docker for GCR
gcloud auth configure-docker gcr.io

# Build image
docker build -t gcr.io/$env:GCP_PROJECT/going-platform:staging-latest .

# Push to GCR
docker push gcr.io/$env:GCP_PROJECT/going-platform:staging-latest

# Verify
docker images | grep going-platform
```

### Step 3: Deploy to Kubernetes

```powershell
# Create staging namespace
kubectl create namespace staging

# Create image pull secret
kubectl create secret docker-registry gcr-secret `
  --docker-server=gcr.io `
  --docker-username=_json_key `
  --docker-password="$(Get-Content ~/gcp-key.json)" `
  -n staging

# Deploy
kubectl apply -f k8s/staging/ -n staging

# Wait for rollout
kubectl rollout status deployment/going-platform -n staging --timeout=5m

# Verify pods
kubectl get pods -n staging -l app=going-platform
```

### Step 4: Run Validation Tests

```powershell
# Get service IP
$SERVICE_IP = kubectl get svc -n staging going-platform -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Test 1: Health check
curl http://$SERVICE_IP:3000/health

# Test 2: Swagger docs
curl http://$SERVICE_IP:3000/docs

# Test 3: Login
curl -X POST http://$SERVICE_IP:3000/auth/login

# Test 4-8: See STAGING_DEPLOYMENT_VALIDATION.md
```

---

## 📋 Quick Reference Commands

### Installation & Validation

```powershell
# Full recovery sequence
git merge --abort  # If needed
rm -r node_modules pnpm-lock.yaml
git pull origin claude/complete-going-platform-TJOI8
pnpm install
pnpm run build:all
pnpm test:all
npx tsc --noEmit
pnpm lint
```

### Deployment

```powershell
# GCP setup
gcloud auth login
gcloud config set project $env:GCP_PROJECT
gcloud container clusters get-credentials staging-cluster --zone=us-central1-a

# Docker build
docker build -t gcr.io/$env:GCP_PROJECT/going-platform:staging-latest .
docker push gcr.io/$env:GCP_PROJECT/going-platform:staging-latest

# Kubernetes deploy
kubectl create namespace staging
kubectl apply -f k8s/staging/ -n staging
kubectl get pods -n staging
```

---

## 🆘 Troubleshooting

### Issue: "pnpm install" still fails with dependency errors

**Solution**: Check for other invalid versions in workspace packages

```powershell
# Search for invalid versions
findstr /R "@types.*\^[2-3]\." *.json */package.json

# Fix found versions to match root package.json
```

### Issue: "jest not found" after pnpm install

**Solution**: Reinstall with clean state

```powershell
# Clear pnpm cache and reinstall
pnpm store prune
pnpm install --no-frozen-lockfile
```

### Issue: "Build failed" with TypeScript errors

**Solution**: Clear build cache

```powershell
# Clean all build artifacts
pnpm run clean
# If clean script exists, or:
rm -r dist node_modules/.cache
pnpm install
pnpm run build:all
```

### Issue: Kubernetes deploy fails with image pull errors

**Solution**: Verify GCR access

```powershell
# Check image exists
gcloud container images list --project=$env:GCP_PROJECT

# Verify secret
kubectl get secret gcr-secret -n staging -o yaml

# Test image pull
docker pull gcr.io/$env:GCP_PROJECT/going-platform:staging-latest
```

---

## ✅ Success Criteria

You'll know deployment is successful when:

1. ✅ All 115+ tests pass
2. ✅ Build completes with no errors
3. ✅ TypeScript shows no errors
4. ✅ All pods in staging namespace are "Running"
5. ✅ Health check endpoint responds with 200 OK
6. ✅ All 8 validation tests pass
7. ✅ Team sign-off received
8. ✅ Ready for production deployment

---

## 📞 Support

For each phase, refer to:

- **Pre-deployment**: `STAGING_DEPLOYMENT_CHECKLIST.md`
- **GCP Setup**: `GCP_STAGING_DEPLOYMENT.md`
- **Testing**: `STAGING_DEPLOYMENT_VALIDATION.md`
- **Post-deployment**: Monitor for 24 hours per `PHASE5_PHASE6_DEPLOYMENT.md`
