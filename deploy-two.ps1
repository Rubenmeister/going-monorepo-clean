$PROJECT_ID = "going-5d1ae"
$REGION     = "us-central1"
$REGISTRY   = "gcr.io/$PROJECT_ID"

# !! Reemplaza TU_PASSWORD con tu password de MongoDB Atlas
$MONGO_URI = "mongodb+srv://rubenmeister_db_user:TU_PASSWORD@going-cluster.vy28mpj.mongodb.net/?retryWrites=true&w=majority&appName=GOING-CLUSTER"

$services = @("notification-service", "billing-service")

foreach ($svc in $services) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Building + Deploying: $svc" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    $image = "${REGISTRY}/${svc}:latest"

    $buildArgs = @("builds", "submit", ".\$svc", "--tag", $image, "--timeout=1200s")
    & gcloud @buildArgs

    if ($LASTEXITCODE -ne 0) {
        Write-Host "BUILD FAILED for $svc" -ForegroundColor Red
        continue
    }

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
        "--set-env-vars", "NODE_ENV=production,MONGODB_URI=$MONGO_URI",
        "--port", "8080"
    )
    & gcloud @deployArgs

    if ($LASTEXITCODE -ne 0) {
        Write-Host "DEPLOY FAILED for $svc" -ForegroundColor Red
    } else {
        Write-Host "OK: $svc deployed" -ForegroundColor Green
    }
}
