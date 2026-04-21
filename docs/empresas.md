# Going para Empresas - Documentación

**Versión:** Fase 1 - Consolidación  
**Fecha:** 2026-04-20  
**Estado:** En desarrollo  

## Descripción General

Going para Empresas es el canal B2B de Going que permite a empresas de todos los tamaños gestionar viajes corporativos de forma centralizada. El sistema consolida lo que era un `apps/corporate-portal/` independiente en el `frontend-webapp` principal bajo la ruta `/empresas`.

## Características Principales

### Tres Tipos de Cuenta

1. **Empresa Grande** (`grande`)
   - Crédito hasta 40 días
   - Aprobaciones multinivel
   - Wallet consolidada
   - Límites por departamento
   - Roles: admin, aprobador, solicitante, financiero

2. **Negocio/PyME** (`negocio`)
   - Pago por viaje (cash/tarjeta)
   - Factura al momento
   - Sin aprobaciones
   - Roles: admin, solicitante

3. **Agencia de Viajes** (`agencia`)
   - Comisión a 15 días
   - Reservas a nombre de terceros
   - Dashboard de desempeño
   - Roles: admin, agente, financiero

### Cinco Roles

- **admin:** Acceso total a la cuenta
- **aprobador:** Aprueba viajes (ex "manager")
- **solicitante:** Solicita viajes (ex "employee")
- **financiero:** Gestiona facturación y reportes
- **agente:** Solo agencias, reserva a nombre de terceros

## Estructura de Directorios

```
frontend-webapp/src/
├── app/
│   ├── empresas/
│   │   ├── page.tsx                    # Landing pública
│   │   ├── solicitud/page.tsx          # Formulario de solicitud
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── callback/page.tsx
│   │   └── (panel)/
│   │       ├── layout.tsx               # Sidebar + nav compartida
│   │       ├── page.tsx                 # Dashboard
│   │       ├── viajes/page.tsx
│   │       ├── solicitar/page.tsx
│   │       ├── aprobaciones/page.tsx
│   │       ├── equipo/page.tsx
│   │       ├── facturacion/page.tsx
│   │       ├── reportes/page.tsx
│   │       └── configuracion/page.tsx
│   └── api/
│       └── v1/
│           └── empresas/
│               ├── solicitudes/route.ts
│               ├── bookings/route.ts   # TODO
│               └── [...]               # TODO
├── lib/
│   └── empresas/
│       ├── types.ts                     # TypeScript interfaces
│       ├── constants.ts                 # Enums, labels, config
│       ├── auth.ts                      # Auth hooks y funciones
│       ├── api.ts                       # API helpers
│       ├── hooks.ts                     # TODO: Custom hooks
│       └── schemas.ts                   # TODO: Zod validation
└── components/
    └── empresas/
        ├── BookingFormModal.tsx         # TODO: Migrar
        ├── EmpresasLayout.tsx           # TODO: Migrar
        └── [...]
```

## Modelos de Datos

### Company

```typescript
{
  _id: ObjectId,
  razonSocial: string,
  ruc: string,
  tipoCuenta: "grande" | "negocio" | "agencia",
  estadoCuenta: "prospect" | "activa" | "suspendida" | "cancelada",
  email: string,
  telefono?: string,
  ubicacion?: string,
  industria?: string,
  
  // Condicional por tipoCuenta
  creditoAutorizado?: number,
  plazoFacturacion?: number,
  comisionAgencia?: number,
  
  // Wallet (grande)
  walletConsolidada?: {
    saldo: number,
    movimientos: Array<{...}>
  },
  
  // Límites (grande)
  deptosConLimitesGasto?: Array<{...}>,
  
  creadaEn: Date,
  actualizadaEn: Date
}
```

### CorporateUser

```typescript
{
  _id: ObjectId,
  email: string,
  nombre: string,
  apellido?: string,
  companyId: string,
  roles: ("admin"|"aprobador"|"solicitante"|"financiero"|"agente")[],
  activo: boolean,
  ultimoAcceso?: Date,
  creadoEn: Date
}
```

### SolicitudEmpresa (NEW)

```typescript
{
  _id: ObjectId,
  tipoCuenta: "grande" | "negocio" | "agencia",
  estado: "prospect" | "evaluada" | "aprobada" | "rechazada",
  razonSocial: string,
  ruc: string,
  contactoEmail: string,
  contactoNombre: string,
  contactoTelefono: string,
  descripcionUso: string,
  empleadosEstimados: number,
  industria: string,
  ubicacion: string,
  notas?: string,
  creadaEn: Date,
  actualizadaEn: Date,
  asignadoA?: string
}
```

## Rutas Públicas y Autenticadas

### Públicas

- `GET /empresas` - Landing con 3 cards de tipos de cuenta
- `GET /empresas/solicitud` - Formulario de solicitud
- `POST /api/v1/empresas/solicitudes` - Crear solicitud
- `GET /empresas/auth/login` - Login
- `POST /api/v1/empresas/auth/login` - Autenticación (TODO)

### Autenticadas (bajo `/empresas/(panel)/`)

- `GET /empresas/panel` - Dashboard
- `GET /empresas/viajes` - Lista de viajes
- `POST /empresas/viajes` - Crear viaje (TODO)
- `GET /empresas/solicitar` - Formulario de solicitud de viaje
- `GET /empresas/aprobaciones` - Pendientes (solo aprobador)
- `PATCH /api/v1/empresas/bookings/:id/approve` - Aprobar viaje
- `GET /empresas/equipo` - Gestión de usuarios (solo admin)
- `GET /empresas/facturacion` - Facturas
- `GET /empresas/reportes` - Reportes
- `GET /empresas/reportes/tracking` - Tracking GPS (TODO)
- `GET /empresas/configuracion` - Settings (solo admin)

## Flujos de Autenticación

### Fase 1: Mock (Actual)
- `signIn()` usa JWT mock con localStorage
- Sin validación de backend
- Con TODO explícitos para integración real

### Fase 2: Backend Real
- Integrar con user-auth-service
- Validar JWT en cada request
- Refresh token logic
- SSO (Okta, Azure, Google)

### Fase 3: MFA/Seguridad
- MFA/2FA
- Session management
- Rate limiting

## Estado Actual (Fase 1)

### Completado
- ✓ Estructura de directorios `/empresas`
- ✓ Landing page con 3 cards
- ✓ Formulario de solicitud
- ✓ Sistema de tipos y constantes
- ✓ Auth hooks (mock)
- ✓ Layout y sidebar del panel
- ✓ Pages placeholders (panel, viajes, aprobaciones, etc.)
- ✓ API endpoint stub `/api/v1/empresas/solicitudes`
- ✓ Traducción al español Ecuador
- ✓ Documentación plan (EMPRESAS_FASE1_PLAN.md)

### En Desarrollo (Fase 1)
- [ ] Validación con Zod schemas
- [ ] Componentes reutilizables (BookingForm, etc.)
- [ ] Hooks custom (useCompanyInfo, useBookingData)
- [ ] Tests unitarios básicos
- [ ] Tests e2e smoke
- [ ] Cleanup: DEPRECATED.md en corporate-portal

### TODO: Fase 2 (Integración con Backend)
- [ ] Integración de auth con backend real
- [ ] Endpoints reales en Node.js (migrables a Go)
- [ ] MongoDB: migrar datos existentes
- [ ] SSO: Okta, Azure, Google
- [ ] Unificar auth global con frontend-webapp

### TODO: Fase 3 (Features Avanzadas)
- [ ] Bookings: crear, listar, editar, cancelar
- [ ] Aprobaciones: flujo multinivel
- [ ] Facturación: consolidada, descargas
- [ ] Reportes: gráficos, exportación
- [ ] Tracking: GPS, mapa en vivo
- [ ] Notificaciones: en tiempo real
- [ ] Integraciones: SAP, Salesforce, Jira

### TODO: Fase 4 (Go Migration)
- [ ] Backend en Go reemplaza Node.js
- [ ] API contracts `/api/v1/empresas/*`
- [ ] Rate limiting, circuit breaker
- [ ] Caching y revalidation

## Variables de Entorno

### Frontend

```env
NEXT_PUBLIC_API_BASE_URL=https://api-gateway-...
NEXT_PUBLIC_EMPRESAS_ENABLED=true
```

### Backend (TODO)

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
OKTA_CLIENT_ID=...
OKTA_CLIENT_SECRET=...
# etc.
```

## Decisiones Técnicas

### Auth Aislada en Fase 1
- `lib/empresas/auth.ts` funciona de forma standalone
- Usa localStorage + JWT mock
- TODO: Integración con sistema global en Fase 2
- Workaround: Separa la lógica de auth para facilitar refactor

### API Endpoints Versados
- Todas las rutas bajo `/api/v1/empresas/*`
- Preparado para migración a Go en Fase 2
- Node.js puede coexistir con Go temporalmente

### Tipos TypeScript Completos
- `lib/empresas/types.ts`: Single source of truth
- Interfaz con MongoDB + Zod validation (TODO)
- Reutilizable en frontend y backend

### Traducciones Hardcodeadas (Fase 1)
- Español Ecuador en `constants.ts`
- TODO: Extraer a sistema i18n en Fase 2

## Testing

### Fase 1: Smoke Tests
- Landing page carga correctamente
- Formulario de solicitud valida
- Layout autenticado renderiza sin errores
- Pages placeholders no crashean

### Fase 2: Unit Tests
- Auth hooks (mock)
- API helpers
- Validación de esquemas

### Fase 3: E2E Tests
- Flujo completo: landing → solicitud → login → dashboard
- Aprobaciones multinivel
- Descarga de facturas

## Documentación Relacionada

- `EMPRESAS_FASE1_PLAN.md` - Plan técnico detallado
- `apps/corporate-portal/README.md` - Código original (deprecated en Fase 1)
- `apps/corporate-portal/DEPRECATED.md` - Info de migración (TODO)

## Contato y Soporte

Para preguntas sobre la implementación:
- Reunión con Rubenmeister (product owner)
- Consultar plan en EMPRESAS_FASE1_PLAN.md
- Issues marcados con tag `[empresas]` en el backlog

---

**Last Updated:** 2026-04-20  
**Status:** Fase 1 - Consolidación  
**Next Review:** Después de completar Fase 1
