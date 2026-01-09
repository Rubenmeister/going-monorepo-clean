param(
    [string]$ProjectId = "going-prod", 
    [string]$Region = "us-central1",
    [string]$RepoName = "going-repo-prod"
)

$RegistryUrl = "$Region-docker.pkg.dev/$ProjectId/$RepoName"
Write-Host "🚀 Starting GCP Frontend Deployment to $RegistryUrl..." -ForegroundColor Cyan

# 1. Admin Dashboard (Next.js -> Dockerfile.frontend)
$AdminService = "admin-dashboard"
$AdminImage = "$RegistryUrl/$AdminService`" + ":latest"

Write-Host "`n📦 Processing: $AdminService (Next.js)" -ForegroundColor Green
Write-Host "   🔨 Building..."
docker build --build-arg APP_NAME=$AdminService -f Dockerfile.frontend -t $AdminImage .

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
$WebAppImage = "$RegistryUrl/$WebAppService`" + ":latest"

Write-Host "`n📦 Processing: $WebAppService (Vite SPA)" -ForegroundColor Green
Write-Host "   🔨 Building..."
docker build --build-arg APP_NAME=$WebAppService -f Dockerfile.spa -t $WebAppImage .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed for $WebAppService" -ForegroundColor Red
    exit 1
}

Write-Host "   ⬆️  Pushing..."
docker push $WebAppImage
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Push failed"; exit 1 }
Write-Host "   ✅ $WebAppService deployed."

Write-Host "`n🎉 All frontends built and pushed!" -ForegroundColor Cyan
