# going-monorepo-clean
🏖️ Going Tourism Platform - Monorepo
Una plataforma completa de turismo construida con arquitectura de microservicios usando NX.

📋 Tabla de Contenidos
Arquitectura
Servicios
Instalación
Desarrollo
Deployment
API Documentation
Testing
Contribución
🏗️ Arquitectura
┌─────────────────┐    ┌──────────────────┐
│  Admin Dashboard│    │   Mobile App     │
│    (Next.js)    │    │ (React Native)   │
└─────────┬───────┘    └────────┬─────────┘
          │                     │
          └─────────┬───────────┘
                    │
            ┌───────▼────────┐
            │  API Gateway   │
            │   (NestJS)     │
            └───────┬────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼───┐    ┌─────▼─────┐    ┌───▼────┐
│ Auth  │    │ Booking   │    │ Tours  │
│Service│    │ Service   │    │Service │
└───────┘    └───────────┘    └────────┘
    │               │               │
    └───────────────┼───────────────┘
                    │
            ┌───────▼────────┐
            │   PostgreSQL   │
            │     Redis      │
            └────────────────┘
🔧 Servicios
Frontend
admin-dashboard: Panel de administración (Next.js + Tailwind)
Backend Services
api-gateway: Gateway principal y enrutamiento
user-auth-service: Autenticación y autorización
booking-service: Gestión de reservas
tours-service: Gestión de tours y experiencias
payment-service: Procesamiento de pagos
anfitriones-service: Gestión de anfitriones/hosts
experiencias-service: Catálogo de experiencias
transport-service: Servicios de transporte
notifications-service: Sistema de notificaciones
tracking-service: Seguimiento de servicios
envios-service: Gestión de envíos
🚀 Instalación
Prerrequisitos
Node.js 18+
npm/yarn/pnpm
Docker & Docker Compose
PostgreSQL 14+
Redis 6+
Setup Local
bash 
# Clonar repositorio
git clone https://github.com/Rubenmeister/going-monorepo-clean.git
cd going-monorepo-clean

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar base de datos
docker-compose up -d postgres redis

# Ejecutar migraciones
nx run-many --target=migrate --all

# Iniciar servicios en desarrollo
nx serve api-gateway
nx serve admin-dashboard
💻 Desarrollo
Comandos Principales
bash 
# Desarrollo
nx serve <service-name>              # Iniciar servicio específico
nx serve-many --all                  # Iniciar todos los servicios

# Testing
nx test <service-name>               # Test unitarios
nx e2e <service-name>-e2e           # Tests E2E
nx run-many --target=test --all     # Todos los tests

# Build
nx build <service-name>              # Build específico
nx run-many --target=build --all    # Build todos

# Linting
nx lint <service-name>               # Lint específico
nx run-many --target=lint --all     # Lint todos
Estructura de Proyecto
├── apps/
│   ├── admin-dashboard/           # Frontend admin
│   ├── api-gateway/              # Gateway principal
│   ├── user-auth-service/        # Servicio de auth
│   └── ...                       # Otros servicios
├── libs/                         # Librerías compartidas
│   ├── shared/                   # Utilidades comunes
│   ├── database/                 # Modelos de DB
│   └── types/                    # Tipos TypeScript
├── tools/                        # Scripts y herramientas
├── docker-compose.yml            # Orquestación local
└── nx.json                       # Configuración NX
🌐 API Documentation
Endpoints Principales
Authentication Service
POST   /auth/login              # Login usuario
POST   /auth/register           # Registro usuario
POST   /auth/refresh            # Refresh token
DELETE /auth/logout             # Logout
Booking Service
GET    /bookings               # Listar reservas
POST   /bookings               # Crear reserva
GET    /bookings/:id           # Obtener reserva
PUT    /bookings/:id           # Actualizar reserva
DELETE /bookings/:id           # Cancelar reserva
Tours Service
GET    /tours                  # Listar tours
POST   /tours                  # Crear tour
GET    /tours/:id              # Obtener tour
PUT    /tours/:id              # Actualizar tour
DELETE /tours/:id              # Eliminar tour
Autenticación
Todos los endpoints (excepto login/register) requieren JWT token:

Authorization: Bearer <jwt-token>
🧪 Testing
Estrategia de Testing
Unit Tests: Jest + Testing Library
Integration Tests: Supertest
E2E Tests: Playwright
Coverage: >80% requerido
bash 
# Ejecutar todos los tests
npm run test

# Tests con coverage
npm run test:coverage

# Tests E2E
npm run test:e2e

# Tests en modo watch
npm run test:watch
🚀 Deployment
Desarrollo
bash 
docker-compose up -d
Staging/Producción
bash 
# Build para producción
nx run-many --target=build --all --prod

# Deploy con Docker
docker-compose -f docker-compose.prod.yml up -d

# O usando Kubernetes
kubectl apply -f k8s/
Variables de Entorno
Requeridas
env 
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/going_tourism
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# External APIs
STRIPE_SECRET_KEY=sk_test_...
SENDGRID_API_KEY=SG...
📊 Monitoring
Health Checks
Cada servicio expone:

GET /health - Health check básico
GET /health/detailed - Health check detallado
Métricas
Prometheus metrics en /metrics
Logs estructurados con Winston
Error tracking con Sentry
🤝 Contribución
Workflow
Fork del repositorio
Crear feature branch: git checkout -b feature/nueva-funcionalidad
Commit cambios: git commit -m 'Add: nueva funcionalidad'
Push branch: git push origin feature/nueva-funcionalidad
Crear Pull Request
Estándares
Commits: Conventional Commits
Code Style: ESLint + Prettier
Testing: Tests requeridos para nuevas features
Documentation: Actualizar docs relevantes
📝 Changelog
Ver CHANGELOG.md para historial de cambios.

📄 Licencia
Este proyecto está bajo la licencia MIT. Ver LICENSE para más detalles.

🆘 Soporte
Issues: GitHub Issues
Discussions: GitHub Discussions
Email: support@thorn.com
Desarrollado con ❤️ por el equipo de Going 