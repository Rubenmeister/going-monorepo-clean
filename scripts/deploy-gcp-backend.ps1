param(
    [string]$ProjectId = "going-prod", 
    [string]$Region = "us-central1",
    [string]$RepoName = "going-repo-prod"
)

$Services = @(
    "api-gateway",
    "user-auth-service",
    "transport-service",
    "parcel-service",
    "booking-service",
    "notifications-service",
    "host-service",
    "tours-service",
    "experience-service",
    "tracking-service",
    "payment-service",
    "migration-runner"
)

$RegistryUrl = "$Region-docker.pkg.dev/$ProjectId/$RepoName"
Write-Host "🚀 Starting GCP Backend Deployment to $RegistryUrl..." -ForegroundColor Cyan

# 1. Configure Docker Auth
Write-Host "🔑 Configuring Docker Auth for GCP..." -ForegroundColor Yellow
cmd /c "gcloud auth configure-docker $Region-docker.pkg.dev --quiet"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Falied to configure docker auth. Assuming it's already configured or you will do it manually." -ForegroundColor Yellow
}

# 2. Build and Push Loop
foreach ($Service in $Services) {
    Write-Host "`n📦 Processing Service: $Service" -ForegroundColor Green
    
    $ImageName = "$RegistryUrl/$Service`" + ":latest"
    
    # Build
    Write-Host "   🔨 Building..."
    
    if ($Service -eq "migration-runner") {
        docker build -f Dockerfile.migrations -t $ImageName .
    }
    else {
        docker build --build-arg SERVICE_NAME=$Service -f Dockerfile.prod -t $ImageName .
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed for $Service" -ForegroundColor Red
        exit 1
    }
    
    # Push
    Write-Host "   ⬆️  Pushing to Artifact Registry..."
    docker push $ImageName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Push failed for $Service" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   ✅ $Service deployed successfully to registry."
}

Write-Host "`n🎉 All backend services built and pushed!" -ForegroundColor Cyan
Write-Host "👉 Now you can run 'terraform apply' to deploy Cloud Run services."
