# UX Findings — Revisión pre-AAB

**Fecha**: 2026-05-13
**Scope**: Auditoría de código de frontend-webapp + Chrome MCP (browser tests)
**Status**: Pasada inicial completa. Browser audit completa solo del flujo pasajero (Chrome desconectado durante el resto).

## ✅ Aplicado en este pase (commit a73cf4b2)

Lenguaje inclusivo en 9 páginas alto-tráfico:

| Página | Antes | Después |
|---|---|---|
| `/about` | "viajeros, anfitriones y conductores" | "quienes viajan, hospedan y conducen" (3 instancias) |
| `/about` | "Cada proveedor y conductor" | "Cada proveedor, proveedora, conductor o conductora" |
| `/about` | "todos nuestros usuarios" | "toda nuestra comunidad" |
| `/help` FAQ | "los conductores" / "otros usuarios" (3 instancias) | "conductoras y conductores" / "otras personas usuarias" |
| `/academy` | "todos los usuarios" / "los usuarios" | "toda la comunidad usuaria" / "alguien" |
| `/legal/terms` | "los conductores, proveedores y demás usuarios" | "quienes conducen, proveen servicios y forman parte de la comunidad" |
| `/legal/cookies` | "los usuarios" (2 instancias) | "tu uso de la plataforma" / "nuestra comunidad" |
| `/sos` | "todos los usuarios de Going" (2 instancias) | "toda la comunidad Going" |
| `/operadores` + `/operadores/registro` | "los viajeros" | "quienes viajan" |
| `/comunidad-local/impacto` | "los conductores" | "conductoras y conductores" |

## 🟡 Findings importantes detectados (no aplicados)

### 1. 🚨 `/api/v1/empresas/solicitudes` es stub en memoria — datos se pierden

`frontend-webapp/src/app/api/v1/empresas/solicitudes/route.ts`:
```ts
const solicitudes: any[] = [];  // memoria, no DB
solicitudes.push(solicitud);    // se pierde con cold start de Vercel
// TODO: Guardar en MongoDB
// TODO: Enviar email de confirmación
// TODO: Notificar al equipo de ventas
```

**Impacto**: Empresas que llenan el form en `empresas.goingec.com/...` envían su info, pero:
- No se guarda persistente (perdido al primer cold start / nuevo deploy)
- No reciben email de confirmación
- El equipo de ventas nunca se entera

**Acción**: refactorizar para usar `corporate-service` o `user-auth-service` directo (no Next.js API route), o conectar a MongoDB Atlas desde el route con `mongoose`. Probablemente lo segundo es más rápido. Email vía Gmail SMTP del `user-auth-service` (ya hay infra).

**Prioridad**: post-AAB pero antes de promocionar empresas.goingec.com.

### 2. 🟡 Console.log en producción (9 instancias)

`frontend-webapp/src/app` tiene 9 `console.log` o `console.warn`. La mayoría son debug útiles (errores de API, fallbacks). Ninguno crítico pero deberían convertirse a Sentry breadcrumbs en post-AAB.

### 3. 🟡 Ride tracking error states usan masculino genérico

`components/features/tracking/RideTrackingPanel.tsx`:
- "Sin conductor disponible" → opción más inclusiva: "Sin asignación disponible" o aceptar como funcional
- "No hay conductores en tu zona" → "No hay personas conduciendo en tu zona"

Conservador: mantener actual porque es estado de error funcional, no marketing.

### 4. 🟡 Course content (Academy) usa "Carlos" como protagonista

`academy/[courseId]/page.tsx` tiene contenido educativo con "Carlos, conductor estrella de Imbabura". Como personaje específico (no genérico), está OK gramaticalmente. Pero balance: agregar también un ejemplo femenino ("Ana, conductora", "Lucía, anfitriona") para representación equitativa.

**Prioridad**: nice-to-have, contenido editorial.

## ✅ Verificado OK

| Item | Status |
|---|---|
| Navbar/Footer | Usa categorías como nombres ("Conductores", "Anfitriones"), no "los X" |
| /quienes-somos | Per memoria, ya aplicado lenguaje inclusivo previamente |
| /pasajeros, /conductores | Per memoria, ya aplicado |
| Home (`page.tsx`) | Per memoria, ya aplicado |
| Mock data en componentes | Sin Lorem Ipsum, sin sampleData hardcoded |
| TODO/FIXME visibles al usuario | Ninguno en `.tsx` (todos en backend stubs) |
| Reviews testimoniales | "el conductor fue amable" en testimonios específicos — gramaticalmente correcto, conservar |

## ⏳ Pendiente Chrome MCP (browser audit)

Cuando Chrome reconecte, completar audit visual:
- Mobile responsive (375px viewport)
- Empty states (sin viajes, sin bookings, sin notifications)
- Loading states (skeletons, spinners)
- Error pages (404, 500)
- Accessibility (focus rings, tab order, aria)
- Visual consistency (color tokens, spacing, type scale)

## Roadmap UX post-AAB

1. **Inclusive language fase 2**: course content + reviews + ride tracking
2. **Empresas solicitudes**: migrar de stub a infra real (DB + email + notif)
3. **Console.log cleanup**: convertir a Sentry breadcrumbs
4. **Accessibility audit**: lighthouse + axe-core
5. **Mobile responsive audit**: cada flujo en 375px
6. **Empty states polish**: skeleton screens uniformes
7. **Microcopy**: pulir botones, errores, confirmaciones (consistente, amable, gender-inclusive)
