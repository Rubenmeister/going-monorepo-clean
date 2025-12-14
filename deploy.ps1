# Deploy Script for Windows (PowerShell)
# Usage: ./deploy.ps1

Write-Host "🚀 Starting Production Deployment..." -ForegroundColor Green

# 1. Pull latest changes (Opcional, si se corre en servidor)
# Write-Host "Checking for updates..."
# git pull origin main

# 2. Build Docker Images
Write-Host "🏗️  Building Docker Images (This may take a while)..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# 3. Stop existing services
Write-Host "🛑 Stopping old services..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml down

# 4. Start new services
Write-Host "🚀 Starting new services..." -ForegroundColor Green
docker compose -f docker-compose.prod.yml up -d

Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:80"
Write-Host "   Admin:    http://localhost:4201"
Write-Host "   Gateway:  http://localhost:3000"
