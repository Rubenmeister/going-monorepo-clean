# EMPRESAS FASE 1: PLAN TÉCNICO DETALLADO DE CONSOLIDACIÓN

**Fecha:** 2026-04-20  
**Repositorio:** Going (Next.js 14 + TypeScript + MongoDB)  
**Objetivo:** Consolidar el canal "Empresas" en `frontend-webapp` bajo ruta `/empresas` con soporte para tres tipos de cuenta y cinco roles.

---

## 1. INVENTARIO DE ARCHIVOS A MIGRAR

### Origen: `apps/corporate-portal/`

#### Páginas/Rutas (Pages Router → App Router)
```
pages/
├── index.tsx                      → app/empresas/page.tsx (redirect a /empresas/panel)
├── auth/login.tsx                 → app/empresas/auth/login/page.tsx
├── auth/callback.tsx              → app/empresas/auth/callback/page.tsx
├── dashboard.tsx                  → app/empresas/panel/page.tsx
├── bookings.tsx                   → app/empresas/viajes/page.tsx
├── approvals.tsx                  → app/empresas/aprobaciones/page.tsx
├── tracking.tsx                   → app/empresas/reportes/tracking/page.tsx
├── invoices.tsx                   → app/empresas/facturacion/page.tsx
├── reports.tsx                    → app/empresas/reportes/page.tsx
├── settings.tsx                   → app/empresas/configuracion/page.tsx
├── _app.tsx                       → Integrar en RootLayout
├── _document.tsx                  → Integrar en RootLayout
└── api/auth/[...nextauth].ts     → app/api/empresas/auth/[...auth].ts (revisión)
```

#### Componentes
```
components/
├── BookingFormModal.tsx           → components/empresas/BookingFormModal.tsx
├── Layout.tsx                     → components/empresas/EmpresasLayout.tsx (remover Layout de app-level)
├── TrackingConsentBadge.tsx       → components/empresas/TrackingConsentBadge.tsx
```

#### Librerías/Hooks
```
lib/
├── auth.ts                        → lib/empresas/auth.ts (REVISAR: integración con auth global)
├── api.ts                         → lib/empresas/api.ts (REVISAR: endpoints corporativos)
```

#### Tipos
```
types/
└── next-auth.d.ts               → lib/empresas/types.ts (refactor a TypeScript puro)
```

#### Estilos
```
styles/                           → Migrar tailwind classes a global o modular
```

#### Config
```
next.config.js, tailwind.config.js, tsconfig.json
→ Mantener en apps/corporate-portal/ como deprecated, NO copiar
```

---

## 2. NUEVOS ARCHIVOS A CREAR

### Landing pública
```
frontend-webapp/src/app/empresas/page.tsx
  - Hero section: "Going para Empresas"
  - 3 cards (grande, negocio, agencia) con descripción
  - CTA "Solicitar cuenta" → /empresas/solicitud
```

### Formulario de solicitud
```
frontend-webapp/src/app/empresas/solicitud/page.tsx
  - Selector de tipo (grande/negocio/agencia)
  - Campos condicionales por tipo
  - Validación
  - POST → /api/v1/empresas/solicitudes (guarda en estado 'prospect')
frontend-webapp/src/app/api/v1/empresas/solicitudes/route.ts
  - Handler POST que crea documento en MongoDB con estado 'prospect'
```

### Panel autenticado (layout jerárquico)
```
frontend-webapp/src/app/empresas/(panel)/
├── layout.tsx                     → Layout con sidebar/nav compartido
├── page.tsx                       → Dashboard (panel)
├── viajes/page.tsx                → Gestión de viajes/bookings
├── solicitar/page.tsx             → Solicitar nuevo viaje
├── aprobaciones/page.tsx          → Pendientes de aprobación
├── equipo/page.tsx                → Gestión de usuarios
├── facturacion/page.tsx           → Facturas y pagos
├── reportes/page.tsx              → Reportes generales
├── reportes/tracking/page.tsx     → Tracking GPS
└── configuracion/page.tsx         → Ajustes de cuenta
```

### Servicios y hooks reutilizables
```
frontend-webapp/src/lib/empresas/
├── auth.ts                        → useSession(), useAuthRedirect(), signIn(), signOut()
├── api.ts                         → corpFetch(), endpoints tipados
├── schemas.ts                     → Zod schemas para validación
├── hooks.ts                       → useCompanyInfo(), useSaldo(), useBookingData()
└── constants.ts                   → Constantes y enums (roles, tipos, estados)
```

### Componentes reutilizables
```
frontend-webapp/src/components/empresas/
├── BookingFormModal.tsx
├── EmpresasLayout.tsx
├── TrackingConsentBadge.tsx
├── RoleSelector.tsx               → Select componente para roles
├── AccountTypeSelector.tsx        → Selector de tipo de cuenta
├── ApprovalWorkflow.tsx           → Widget para aprobaciones multinivel
└── ConsolidatedInvoiceTable.tsx   → Tabla de facturas consolidadas
```

### Documentación
```
docs/empresas.md                  → Arquitectura, modelos, rutas, TODOs
docs/EMPRESAS_FASE1_PLAN.md       → Este archivo (también en repo)
```

---

## 3. MAPEO DE RUTAS: VIEJAS → NUEVAS

| Ruta antigua (corporate-portal) | Ruta nueva (frontend-webapp) | Notas |
|---|---|---|
| `/` | `/empresas` | Landing pública |
| `/auth/login` | `/empresas/auth/login` | Login corporativo |
| `/auth/callback` | `/empresas/auth/callback` | OAuth callback |
| `/dashboard` | `/empresas/panel` | Panel principal |
| `/bookings` | `/empresas/viajes` | Gestión de viajes |
| `/approvals` | `/empresas/aprobaciones` | Aprobaciones multinivel |
| `/tracking` | `/empresas/reportes/tracking` | Tracking GPS |
| `/invoices` | `/empresas/facturacion` | Facturación consolidada |
| `/reports` | `/empresas/reportes` | Reportes generales |
| `/settings` | `/empresas/configuracion` | Configuración de cuenta |

---

## 4. CAMBIOS AL MODELO DE DATOS (MongoDB)

### Colección `companies`

**Nuevos campos:**
```typescript
{
  // ... campos existentes
  tipoCuenta: "grande" | "negocio" | "agencia",      // REQUIRED, nuevo
  estadoCuenta: "prospect" | "activa" | "suspendida" | "cancelada",  // REQUIRED, default: "prospect"
  creditoAutorizado?: number,                         // Solo si tipoCuenta = "grande"
  plazoFacturacion?: number,                          // Días (40 para grande, 0 para negocio, 15 para agencia)
  comisionAgencia?: number,                           // % (solo si tipoCuenta = "agencia")
  deptosConLimitesGasto?: Array<{                     // Solo si tipoCuenta = "grande"
    departamento: string;
    limite: number;
    gastado: number;
  }>;
  walletConsolidada?: {
    saldo: number;
    movimientos: Array<{
      fecha: Date;
      tipo: "carga" | "gasto" | "ajuste";
      monto: number;
      referencia: string;
    }>;
  };
  // ... otros campos
}
```

### Colección `corporate_users`

**Cambios:**
```typescript
{
  // ... campos existentes
  roles: Array<"admin" | "aprobador" | "solicitante" | "financiero" | "agente">,  // Migrar viejos manager → aprobador, employee → solicitante
  activo: boolean,                                    // Nuevo
  ultimoAcceso?: Date,                                // Nuevo
}
```

**Migration script requerida para Fase 2:**
- `manager` → `aprobador`
- `employee` → `solicitante`

### Colección `solicitudes_empresas` (NEW)

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
  notas: string,
  documentosAdjuntos?: [{ url: string; tipo: string; }],
  creadaEn: Date,
  actualizadaEn: Date,
  asignadoA?: string,  // Usuario de ventas/onboarding
}
```

---

## 5. CAMBIOS A AUTENTICACIÓN

### Situación actual:
- `corporate-portal`: Auth custom con JWT + localStorage
- `frontend-webapp`: ¿Usa next-auth o custom? (REVISAR)

### Decisión para Fase 1:
- **Si frontend-webapp usa next-auth:**
  - Adaptar `auth.ts` de corporate-portal para que sea compatible con next-auth.
  - O crear una capa intermedia que unifique ambos.
  - DOCUMENTAR como TODO prioritario para Fase 2.
  
- **Si frontend-webapp usa auth custom:**
  - Importar `lib/empresas/auth.ts` directamente.
  - Asegurar que tokens se validan en el mismo backend.

**Acción Fase 1:**
- Crear `lib/empresas/auth.ts` como refactor del anterior.
- Dejar TODO marcado: "Integrar con sistema global de auth (Phase 2)".
- Hacer que funcione en modo aislado para testing.

---

## 6. TRADUCCIÓN AL ESPAÑOL ECUADOR

**Scope:**
- Textos UI: "panel", "viajes", "aprobaciones", "equipos", "facturación", "reportes", "configuración"
- Moneda: USD (no aplicar aún; configurar con constante)
- Unidades: km, horas
- Formato de fecha: DD/MM/YYYY
- Formato de teléfono: +593 XX XXX XXXX (placeholders)

**Implementación Fase 1:**
- Textos inline con TODO comments.
- Si existe i18n, crear bundle `es-EC` (futuro).
- Clave de strings hardcodeadas en `lib/empresas/constants.ts`.

---

## 7. TRADUCCIONES ESPECÍFICAS POR PÁGINA

| Componente | Traducción |
|---|---|
| Dashboard | Panel de Control |
| Bookings | Viajes |
| Request New | Solicitar Viaje |
| Approvals | Aprobaciones |
| Team | Equipo |
| Invoices | Facturación |
| Reports | Reportes |
| Settings | Configuración |
| Admin | Administrador |
| Manager → Approver | Aprobador |
| Employee → Requester | Solicitante |
| Financial | Financiero |
| Agent (agencies only) | Agente |

---

## 8. VALIDACIONES Y REGLAS DE NEGOCIO

### Por tipo de cuenta:

**grande:**
- Requiere registro de departamentos.
- Aprobaciones multinivel.
- Wallet consolidada.
- Facturación a 40 días (crédito).
- Roles: admin, aprobador, solicitante, financiero.

**negocio:**
- Sin aprobaciones (directo a contratación).
- Pago cash/tarjeta por viaje.
- Facturación simple (invoice al momento).
- Roles: admin, solicitante.

**agencia:**
- Reservas a nombre de terceros (pasajeros externos).
- Going paga comisión a 15 días.
- Roles: admin, agente, financiero.

---

## 9. RIESGOS IDENTIFICADOS

| Riesgo | Probabilidad | Impacto | Mitigation |
|---|---|---|---|
| **Desfase auth:** corporate-portal y frontend-webapp usan sistemas diferentes | ALTA | CRÍTICO | REVISAR ahora. Documentar desfase. TODO para Fase 2. |
| **Colisión de rutas:** ¿Hay `/empresas` en use en frontend-webapp ya? | MEDIA | BLOQUEANTE | Verificar. Si existe, refactor con nombre distinto. |
| **MongoDB conexión:** ¿Mismo cluster o distinto entre apps? | MEDIA | ALTO | Verificar .env. Si distinto, necesita migration svc. |
| **API gateway:** corporate-portal apunta a API custom, ¿endpoint /api/v1/empresas/* existe? | ALTA | BLOQUEANTE | Crear stubs en Node ahora, migrar a Go en Mayo. |
| **Traducciones i18n:** ¿Sistema i18n existe en frontend-webapp? | MEDIA | BAJO | Si no, dejar hardcoded con TODO. |
| **Estilos Tailwind:** ¿Mismo config en ambas apps? | MEDIA | BAJO | Migrar estilos component-level. |
| **SSO (Okta/Azure/Google):** ¿Config centralizada o por app? | MEDIA | ALTO | Documentar. Probablemente necesita Fase 2. |

---

## 10. PLAN DE EJECUCIÓN DETALLADO

### Paso 1: Preparación (Esta sesión)
- [x] Inventariar archivos.
- [x] Crear plan (este documento).
- [ ] Verificar estructura actual de frontend-webapp auth.
- [ ] Verificar colisión de rutas.
- [ ] Crear branch limpio.

### Paso 2: Estructura básica
- [ ] Crear directorio `frontend-webapp/src/app/empresas/` con layout raíz.
- [ ] Crear `lib/empresas/` con tipos, constantes, esquemas.
- [ ] Crear `components/empresas/` base.
- [ ] Crear landing pública `page.tsx`.

### Paso 3: Auth y API
- [ ] Migrar `auth.ts` (refactor).
- [ ] Adaptar/integrar con sistema global.
- [ ] Crear stubs API `/api/v1/empresas/*`.
- [ ] Documentar desfases.

### Paso 4: Modelo de datos
- [ ] Actualizar schemas MongoDB (Mongoose si existe).
- [ ] Crear colección `solicitudes_empresas`.
- [ ] Scripts de migration (si necesario).

### Paso 5: Páginas y componentes
- [ ] Migrar componentes base (Layout, BookingForm, etc).
- [ ] Crear páginas del panel: viajes, aprobaciones, etc.
- [ ] Integrar estilos Tailwind.

### Paso 6: Landing y formulario de solicitud
- [ ] Crear `app/empresas/page.tsx` (landing).
- [ ] Crear `app/empresas/solicitud/page.tsx` (formulario).
- [ ] Crear endpoint POST `/api/v1/empresas/solicitudes`.

### Paso 7: Validación y limpieza
- [ ] `npm run build` (o `pnpm build`).
- [ ] `npm run lint`.
- [ ] `npx tsc --noEmit`.
- [ ] Cleanup: `apps/corporate-portal/DEPRECATED.md`.

### Paso 8: Tests y documentación
- [ ] Smoke tests e2e.
- [ ] `docs/empresas.md`.
- [ ] Reporte final.

---

## 11. DECISIONES PENDIENTES (TODOs EXPLÍCITOS)

1. **Auth integration (CRÍTICO):** ¿frontend-webapp usa next-auth? Necesita unificación explícita en Fase 2.
   - **Workaround Fase 1:** Implementar `lib/empresas/auth.ts` standalone.

2. **API Gateway (BLOQUEANTE):** ¿Existen endpoints `/api/v1/empresas/*` en Node hoy?
   - **Workaround Fase 1:** Crear stubs que leen/escriben MongoDB directamente.
   - **Fase 2:** Validar que Go en Mayo reemplace estos.

3. **SSO configuration:** ¿Está centralizada Okta/Azure/Google?
   - **Fase 1:** Documentar.
   - **Fase 2:** Integrar si no existe.

4. **Migraciones de datos:** Viejos `manager`/`employee` → nuevos roles.
   - **Fase 1:** Script listo, no ejecutar.
   - **Fase 2:** Ejecutar en datos reales.

5. **i18n:** ¿Existe en frontend-webapp?
   - **Fase 1:** Hardcode español.
   - **Fase 2:** Extraer a bundle `es-EC`.

6. **Test coverage:** ¿Existen tests unitarios en corporate-portal?
   - **Fase 1:** Migrar si hay.
   - **Fase 2:** Completar si no.

---

## 12. ARCHIVOS DE SALIDA

Este plan genera:
- `EMPRESAS_FASE1_PLAN.md` (este documento)
- Branch: `feature/empresas-fase1-migracion`
- Migración de código completada
- `docs/empresas.md` actualizado
- Reporte final (~500 palabras)

---

## 13. MÉTRICAS DE ÉXITO

- ✓ Build pasa sin errores.
- ✓ No hay warnings de linting.
- ✓ TypeScript sin errores (`tsc --noEmit`).
- ✓ Landing `/empresas` carga y muestra 3 cards.
- ✓ Formulario `/empresas/solicitud` valida y crea documento `prospect`.
- ✓ Autenticación funciona (login, JWT, sesión).
- ✓ Panel `/empresas/panel` accesible (con auth).
- ✓ TODO list explícito para Fase 2-4.
- ✓ Cero cambios en `apps/corporate-portal/` (solo DEPRECATED.md).
- ✓ Reporte final completo.

