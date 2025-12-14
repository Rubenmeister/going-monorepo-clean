# fix-all-services.ps1
$ErrorActionPreference = "Stop"

# Mapa de Servicios a Dominios
$services = @{
    "payment-service"       = "payment"
    "anfitriones-service"   = "anfitriones"
    "experiencias-service"  = "experiencias"
    "transport-service"     = "transport"
    "notifications-service" = "notifications"
    "tracking-service"      = "tracking"
    "envios-service"        = "envios"
}

Write-Host "🚀 Iniciando Reparación Masiva de Servicios..." -ForegroundColor Cyan

foreach ($serviceName in $services.Keys) {
    $domainName = $services[$serviceName]
    Write-Host "🛠️  Procesando: $serviceName (Dominio: $domainName)" -ForegroundColor Yellow

    # ---------------------------------------------------------
    # 1. ARREGLAR CONFIGURACIÓN DEL SERVICIO (project.json / tsconfig)
    # ---------------------------------------------------------
    
    # Arreglar project.json
    $projectJsonPath = "$serviceName/project.json"
    if (Test-Path $projectJsonPath) {
        $json = Get-Content $projectJsonPath -Raw | ConvertFrom-Json
        
        # Configuración Webpack Dockerizada
        $buildConfig = @{
            executor = "@nx/webpack:webpack"
            outputs = @("{options.outputPath}")
            defaultConfiguration = "production"
            options = @{
                target = "node"
                compiler = "tsc"
                outputPath = "dist/$serviceName"
                main = "$serviceName/src/main.ts"
                tsConfig = "$serviceName/tsconfig.app.json"
                assets = @("$serviceName/src/assets")
                generatePackageJson = $true # CRÍTICO
                isolatedConfig = $true
                webpackConfig = "$serviceName/webpack.config.js"
            }
            configurations = @{
                development = @{ mode = "development" }
                production = @{ mode = "production"; optimization = $true; extractLicenses = $true; inspect = $false }
            }
        }

        if ($json.targets.PSObject.Properties["build"]) {
            $json.targets.build = $buildConfig
            $json | ConvertTo-Json -Depth 10 | Set-Content $projectJsonPath
            Write-Host "   ✅ project.json actualizado" -ForegroundColor Gray
        }
    }

    # Arreglar tsconfig.app.json
    $tsconfigPath = "$serviceName/tsconfig.app.json"
    $tsConfigContent = @"
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": { "outDir": "../dist/out-tsc", "types": ["node"] },
  "files": ["src/main.ts"],
  "include": ["src/**/*.ts"],
  "exclude": ["jest.config.ts", "src/**/*.spec.ts", "src/**/*.test.ts"]
}
"@
    Set-Content -Path $tsconfigPath -Value $tsConfigContent
    Write-Host "   ✅ tsconfig.app.json corregido" -ForegroundColor Gray

    # ---------------------------------------------------------
    # 2. GENERAR ESTRUCTURA DE LIBRERÍAS (Core & Application)
    # ---------------------------------------------------------
    $CorePath = "libs/domains/$domainName/core/src"
    $AppPath = "libs/domains/$domainName/application/src"

    # Crear carpetas
    $folders = @(
        "$CorePath/lib/entities",
        "$CorePath/lib/ports",
        "$CorePath/lib/value-objects",
        "$AppPath/lib/use-cases"
    )
    foreach ($f in $folders) {
        if (-not (Test-Path $f)) { New-Item -ItemType Directory -Force -Path $f | Out-Null }
    }

    # --- ARCHIVOS CORE ---
    
    # Entity
    $entityFile = "$CorePath/lib/entities/$domainName.entity.ts"
    if (-not (Test-Path $entityFile)) {
        Set-Content -Path $entityFile -Value "export class $(Get-Culture).TextInfo.ToTitleCase($domainName) { id: string; name: string; createdAt: Date; }"
    }

    # Repository Interface (con Symbol)
    $repoName = "I$($domainName.Substring(0,1).ToUpper())$($domainName.Substring(1))Repository"
    $repoFile = "$CorePath/lib/ports/i$domainName.repository.ts"
    if (-not (Test-Path $repoFile)) {
        Set-Content -Path $repoFile -Value @"
import { $(Get-Culture).TextInfo.ToTitleCase($domainName) } from '../entities/$domainName.entity';
export const $repoName = Symbol('$repoName');
export interface $repoName {
  save(item: $(Get-Culture).TextInfo.ToTitleCase($domainName)): Promise<void>;
  findAll(): Promise<$(Get-Culture).TextInfo.ToTitleCase($domainName)[]>;
}
"@
    }

    # Index Core
    $coreIndex = "$CorePath/index.ts"
    if (-not (Test-Path $coreIndex)) {
        Set-Content -Path $coreIndex -Value @"
export * from './lib/entities/$domainName.entity';
export * from './lib/ports/i$domainName.repository';
"@
        Write-Host "   ✅ Librería Core generada" -ForegroundColor Gray
    }

    # --- ARCHIVOS APPLICATION ---

    # Use Case Mock
    $ucFile = "$AppPath/lib/use-cases/create-$domainName.use-case.ts"
    if (-not (Test-Path $ucFile)) {
        Set-Content -Path $ucFile -Value @"
export class Create$(Get-Culture).TextInfo.ToTitleCase($domainName)UseCase {
  execute(dto: any) { return '$domainName created'; }
}
"@
    }

    # Index Application
    $appIndex = "$AppPath/index.ts"
    if (-not (Test-Path $appIndex)) {
        Set-Content -Path $appIndex -Value "export * from './lib/use-cases/create-$domainName.use-case';"
        Write-Host "   ✅ Librería Application generada" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🎉 ¡TODO LISTO! Todos los servicios han sido reparados." -ForegroundColor Green
Write-Host "👉 Ahora ejecuta: npx nx reset" -ForegroundColor Cyan
Write-Host "👉 Y luego: docker-compose up -d --build" -ForegroundColor Cyan