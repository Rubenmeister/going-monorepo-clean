$services = @(
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
    "payment-service"
)

$registry = "us-central1-docker.pkg.dev/going-5d1ae/going-repo-prod"

foreach ($s in $services) {
    $tag = "$registry/$s" + ":latest"
    Write-Host "Building and Pushing $tag..."
    docker build --build-arg "SERVICE_NAME=$s" -f Dockerfile.prod -t $tag .
    docker push $tag
}

Write-Host "Building and Pushing migration-runner..."
docker build -f Dockerfile.migrations -t "$registry/migration-runner:latest" .
docker push "$registry/migration-runner:latest"

Write-Host "All backend images built and pushed."
