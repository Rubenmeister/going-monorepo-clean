# CD Pipeline Setup — Cloud Run

This guide walks you through setting up the GitHub Actions → GCP Cloud Run deployment pipeline defined in `.github/workflows/cd-cloud-run.yml`.

## Prerequisites

- Google Cloud SDK (`gcloud`) installed and authenticated
- Owner or Editor role on the GCP project
- Admin access to the GitHub repository

## 1. GCP Project

```
GCP_PROJECT_ID = going-5d1ae
```

Verify with:

```bash
gcloud projects describe going-5d1ae --format='value(projectId)'
```

## 2. Create the Service Account (`GCP_SERVICE_ACCOUNT`)

```bash
PROJECT=going-5d1ae

gcloud iam service-accounts create github-deployer \
  --display-name="GitHub Actions Cloud Run Deployer" \
  --project=$PROJECT

SA="github-deployer@${PROJECT}.iam.gserviceaccount.com"

# Cloud Run admin (deploy services)
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" --role="roles/run.admin"

# Push images to GCR
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" --role="roles/storage.admin"

# Act-as permission for Cloud Run revision identity
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" --role="roles/iam.serviceAccountUser"
```

**Secret value:** `github-deployer@going-5d1ae.iam.gserviceaccount.com`

## 3. Create the Workload Identity Federation (`GCP_WORKLOAD_IDENTITY_PROVIDER`)

This lets GitHub Actions authenticate to GCP without a JSON key.

```bash
PROJECT=going-5d1ae
PROJECT_NUMBER=$(gcloud projects describe $PROJECT --format='value(projectNumber)')

# Create the pool
gcloud iam workload-identity-pools create github-pool \
  --project=$PROJECT --location=global \
  --display-name="GitHub Actions Pool"

# Create the OIDC provider (locked to this repo only)
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --project=$PROJECT --location=global \
  --workload-identity-pool=github-pool \
  --display-name="GitHub OIDC provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='rubenmeister/going-monorepo-clean'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Allow GitHub to impersonate the service account
SA="github-deployer@${PROJECT}.iam.gserviceaccount.com"

gcloud iam service-accounts add-iam-policy-binding $SA \
  --project=$PROJECT \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/rubenmeister/going-monorepo-clean"
```

**Get the secret value:**

```bash
gcloud iam workload-identity-pools providers describe github-provider \
  --project=$PROJECT --location=global \
  --workload-identity-pool=github-pool \
  --format='value(name)'
```

It returns something like:
```
projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

That full string is your `GCP_WORKLOAD_IDENTITY_PROVIDER` secret.

## 4. Snyk Token (`SNYK_TOKEN`) — Optional

1. Sign up or log in at https://snyk.io
2. Go to **Account Settings → General → Auth Token**
3. Click "Click to show" and copy the token

> This step has `continue-on-error: true` in CI, so leaving it empty won't break builds.

## 5. Add Secrets to GitHub

Go to: **Repository → Settings → Secrets and variables → Actions → New repository secret**

| Secret name                        | Value                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `GCP_PROJECT_ID`                   | `going-5d1ae`                                                                               |
| `GCP_SERVICE_ACCOUNT`              | `github-deployer@going-5d1ae.iam.gserviceaccount.com`                                      |
| `GCP_WORKLOAD_IDENTITY_PROVIDER`   | `projects/<NUMBER>/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `SNYK_TOKEN`                       | *(from Snyk dashboard, optional)*                                                           |

## 6. Create GitHub Environments

Go to: **Repository → Settings → Environments → New environment**

1. **`staging`** — no protection rules needed (auto-deploy on push to main)
2. **`production`** — add **Required reviewers** (at least 1) so production deploys need manual approval

## 7. Verify

After setup, either:

- Push a commit to `main` — the pipeline auto-detects affected services and deploys to staging
- Or trigger manually: **Actions → CD — Build & Deploy to Cloud Run → Run workflow** → pick a service and environment

## Deployable Services

The pipeline knows about these services (defined in `cd-cloud-run.yml`):

| Service                 | Port |
| ----------------------- | ---- |
| api-gateway             | 3000 |
| user-auth-service       | 3009 |
| transport-service       | 3008 |
| payment-service         | 3001 |
| booking-service         | 3010 |
| tracking-service        | 3008 |
| notifications-service   | 3002 |
| billing-service         | 3003 |
| experiencias-service    | 3004 |
| tours-service           | 3005 |
| anfitriones-service     | 3006 |
| voice-service           | 3011 |
| analytics-service       | 3012 |
| ratings-service         | 3013 |
| envios-service          | 3007 |

## Troubleshooting

**"Permission denied" on deploy** — the service account is missing a role. Re-run the IAM binding commands in step 2.

**"Could not find workload identity pool"** — double-check the attribute condition matches your repo exactly (`rubenmeister/going-monorepo-clean`).

**Health check warnings in staging** — the service deployed but `/health` didn't return 200 within 50 seconds. Check Cloud Run logs: `gcloud run services logs read <service>-staging --region=us-central1`.
