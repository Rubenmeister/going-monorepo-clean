param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("mobile-user-app", "mobile-driver-app")]
    [string]$AppName,

    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = "https://api-gateway-prod-780842550857.us-central1.run.app",

    [Parameter(Mandatory=$false)]
    [switch]$Release
)

$ErrorActionPreference = "Stop"

Write-Host ">>> Starting build for $AppName" -ForegroundColor Cyan

$AppDir = Join-Path $PSScriptRoot "../apps/$AppName"
$EnvFile = Join-Path $AppDir ".env"
$GoogleServicesFile = Join-Path $AppDir "android/app/google-services.json"

# 1. Validate Firebase Configuration
if (-not (Test-Path $GoogleServicesFile)) {
    Write-Host "WARNING: $GoogleServicesFile not found!" -ForegroundColor Yellow
    Write-Host "Firebase features (Auth, Messaging) will NOT work without this file." -ForegroundColor Yellow
    $Confirm = Read-Host "Proceed anyway? (y/n)"
    if ($Confirm -ne "y") { exit 1 }
}

# 2. Inject Environment Variables
Write-Host ">>> Injecting VITE_API_URL=$ApiUrl into $EnvFile" -ForegroundColor Cyan
"VITE_API_URL=$ApiUrl" | Out-File -FilePath $EnvFile -Encoding utf8

# 3. Determine Build Target
$Target = "build-android"
if ($Release) {
    Write-Host ">>> Production Release Build requested" -ForegroundColor Magenta
    # We use nx build-android, but we can also pass flags if defined in project.json
}

# 4. Trigger Build via Nx
Write-Host ">>> Executing: npx nx $Target $AppName" -ForegroundColor Cyan
npx nx $Target $AppName

if ($LASTEXITCODE -eq 0) {
    Write-Host ">>> Build successful for $AppName!" -ForegroundColor Green
} else {
    Write-Host ">>> Build failed for $AppName." -ForegroundColor Red
    exit $LASTEXITCODE
}
