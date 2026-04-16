$PROJECT_ID = "going-5d1ae"
$REGION     = "us-central1"
$REGISTRY   = "gcr.io/$PROJECT_ID"

$services = @(
    "voice-service",
    "iot-service",
    "ml-service",
    "security-service",
    "social-service",
    "supply-chain-service",
    "notification-service",
    "billing-service"
)

foreach ($svc in $services) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Deploying: $svc" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    $image = "${REGISTRY}/${svc}:latest"

    $deployArgs = @(
        "run", "deploy", $svc,
        "--image", $image,
        "--region", $REGION,
        "--platform", "managed",
        "--allow-unauthenticated",
        "--memory", "512Mi",
        "--cpu", "1",
        "--timeout", "300",
        "--concurrency", "80",
        "--min-instances", "0",
        "--max-instances", "5",
        "--set-env-vars", "NODE_ENV=production",
        "--port", "8080"
    )
    & gcloud @deployArgs

    if ($LASTEXITCODE -ne 0) {
        Write-Host "DEPLOY FAILED for $svc" -ForegroundColor Red
    } else {
        Write-Host "OK: $svc deployed" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Health endpoints:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

foreach ($svc in $services) {
    $url = & gcloud run services describe $svc --region $REGION --format "value(status.url)" 2>$null
    if ($url) {
        Write-Host "${svc}: ${url}/health"
    }
}
