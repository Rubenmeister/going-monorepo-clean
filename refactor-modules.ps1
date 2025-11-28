# refactor-modules.ps1
Write-Host "🚀 Iniciando refactorización masiva de AppModules..." -ForegroundColor Cyan

# Lista de tus microservicios
$services = @(
    "user-auth-service",
    "booking-service",
    "payment-service",
    "transport-service",
    "tours-service",
    "notifications-service",
    "tracking-service",
    "envios-service",
    "anfitriones-service",
    "experiencias-service",
    "api-gateway" 
)

# El contenido plantilla para cada app.module.ts
# Nota: Usamos una ruta relativa estándar para llegar a libs/shared
$template = @"
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../libs/shared/src';

@Module({
  imports: [
    DatabaseModule,
    // Aquí importarás luego los módulos específicos de este servicio
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
"@

# Contenido especial para API Gateway (suele ser diferente, pero por ahora lo estandarizamos)
# Si tu API Gateway no usa base de datos directa, podrías excluirlo, 
# pero incluirlo no hace daño si la conexión está bien configurada.

foreach ($service in $services) {
    $path = ".\$service\src\app\app.module.ts"
    
    if (Test-Path $path) {
        Set-Content -Path $path -Value $template
        Write-Host "✅ Actualizado: $service" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No encontrado: $path (Saltando...)" -ForegroundColor Yellow
    }
}

Write-Host "------------------------------------------------"
Write-Host "🎉 ¡Listo! Todos los servicios están conectados a la BD compartida." -ForegroundColor Cyan