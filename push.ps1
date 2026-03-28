# push.ps1 — Going Ecuador
# Uso: .\push.ps1 "mensaje del commit"
# Ejemplo: .\push.ps1 "fix: correcciones UI home page"

param(
    [string]$msg = "chore: update"
)

# 1. Eliminar index.lock si existe
$lock = ".git\index.lock"
if (Test-Path $lock) {
    Remove-Item $lock -Force
    Write-Host "🔓 index.lock eliminado" -ForegroundColor Yellow
}

# 2. Stagear frontend-webapp, admin-dashboard y apps móviles
#    (evita subir cambios de servicios de backend)
git add frontend-webapp/src/ `
        frontend-webapp/public/ `
        admin-dashboard/src/ `
        mobile-user-app/src/ `
        mobile-driver-app/src/ `
        apps/corporate-portal/ `
        financial-agent/src/ `
        financial-agent/cloudbuild.yaml `
        financial-agent/Dockerfile `
        financial-agent/.gcloudignore `
        going-agent/src/ `
        going-agent/cloudbuild.yaml `
        going-agent/Dockerfile `
        going-agent/.gcloudignore `
        marketing-agent/src/ `
        marketing-agent/cloudbuild.yaml `
        marketing-agent/Dockerfile `
        marketing-agent/.gcloudignore `
        ops-agent/src/ `
        ops-agent/cloudbuild.yaml `
        ops-agent/Dockerfile `
        ops-agent/.gcloudignore `
        push.ps1 `
        2>&1

# 3. Verificar si hay algo para commitear
$status = git status --porcelain | Where-Object { $_ -match "^[AMDR]" }
if (-not $status) {
    Write-Host "✅ Nada nuevo para commitear." -ForegroundColor Green
    exit 0
}

# 4. Commit y push
git commit -m $msg
git push

Write-Host "✅ Push completado." -ForegroundColor Green
