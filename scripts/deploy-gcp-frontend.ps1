param(
    [string]$ProjectId = "going-prod", 
    [string]$Region = "us-central1",
    [string]$RepoName = "going-repo-prod",
    [string]$ApiUrl = "https://api-gateway-prod-lw44cnhdeq-uc.a.run.app"
)

$RegistryUrl = "$Region-docker.pkg.dev/$ProjectId/$RepoName"
Write-Host "🚀 Starting GCP Frontend Deployment to $RegistryUrl..." -ForegroundColor Cyan

# 1. Admin Dashboard (Next.js -> Dockerfile.frontend)
$AdminService = "admin-dashboard"
$AdminImage = "$RegistryUrl/${AdminService}:latest"

Write-Host "`n📦 Processing: $AdminService (Next.js)" -ForegroundColor Green
Write-Host "   🔨 Building..."
docker build --build-arg APP_NAME=$AdminService --build-arg NEXT_PUBLIC_API_URL=$ApiUrl -f Dockerfile.frontend -t $AdminImage --no-cache .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed for $AdminService" -ForegroundColor Red
    exit 1
}

Write-Host "   ⬆️  Pushing..."
docker push $AdminImage
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Push failed"; exit 1 }
Write-Host "   ✅ $AdminService deployed."


# 2. Frontend Webapp (Vite SPA -> Dockerfile.spa)
$WebAppService = "frontend-webapp"
$WebAppImage = "$RegistryUrl/${WebAppService}:latest"

Write-Host "`n📦 Processing: $WebAppService (Vite SPA)" -ForegroundColor Green
Write-Host "   🔨 Building..."
docker build --build-arg APP_NAME=$WebAppService --build-arg VITE_API_URL=$ApiUrl -f Dockerfile.spa -t $WebAppImage --no-cache .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed for $WebAppService" -ForegroundColor Red
    exit 1
}

Write-Host "   ⬆️  Pushing..."
docker push $WebAppImage
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Push failed"; exit 1 }
Write-Host "   ✅ $WebAppService deployed."

# 3. Enterprise Portal (Vite SPA -> Dockerfile.spa)
$EnterpriseService = "enterprise-portal"
$EnterpriseImage = "$RegistryUrl/${EnterpriseService}:latest"

Write-Host "`n📦 Processing: $EnterpriseService (Vite SPA)" -ForegroundColor Green
Write-Host "   🔨 Building..."
docker build --build-arg APP_NAME=$EnterpriseService --build-arg VITE_API_URL=$ApiUrl -f Dockerfile.spa -t $EnterpriseImage --no-cache .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed for $EnterpriseService" -ForegroundColor Red
    exit 1
}

Write-Host "   ⬆️  Pushing..."
docker push $EnterpriseImage
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Push failed"; exit 1 }
Write-Host "   ✅ $EnterpriseService deployed."

Write-Host "`n🎉 All frontends built and pushed!" -ForegroundColor Cyan
