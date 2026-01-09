---
description: Deploy Going Superapp to Google Cloud Platform
---

# GCP Production Deployment Workflow

// turbo-all

## Prerequisites

1. Install [Terraform](https://terraform.io) >= 1.5.0
2. Install [gcloud CLI](https://cloud.google.com/sdk)
3. Install [Docker Desktop](https://docker.com)
4. Have your GCP project ID ready

## Step 1: Authenticate to GCP

```powershell
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

## Step 2: Enable Required APIs

```powershell
gcloud services enable run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com vpcaccess.googleapis.com redis.googleapis.com servicenetworking.googleapis.com
```

## Step 3: Configure Terraform Variables

```powershell
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

## Step 4: Initialize and Apply Terraform

```powershell
cd terraform
terraform init
terraform plan
terraform apply
```

## Step 5: Configure Docker Auth

```powershell
gcloud auth configure-docker us-central1-docker.pkg.dev
```

## Step 6: Build and Push Backend Services

```powershell
cd ..
./scripts/deploy-gcp-backend.ps1 -ProjectId "YOUR_PROJECT_ID"
```

## Step 7: Build and Push Frontend Apps

```powershell
./scripts/deploy-gcp-frontend.ps1 -ProjectId "YOUR_PROJECT_ID"
```

## Step 8: Run Database Migrations

```powershell
gcloud run jobs execute migration-job-prod --region=us-central1 --wait
```

## Step 9: Verify Deployment

```powershell
# Get service URLs
cd terraform
terraform output

# Test API Gateway health
curl $(terraform output -raw api_gateway_url)/health
```

## Rollback (if needed)

```powershell
# Rollback to previous revision
gcloud run services update-traffic api-gateway-prod --to-revisions=PREVIOUS_REVISION=100 --region=us-central1
```
