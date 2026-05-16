# Plan de verificación sistemática pre-AAB

**Creado**: 2026-05-13
**Motivación**: Hasta ahora la revisión final ha sido **reactiva** — arreglamos
lo que aparece (drivers misrouting, MongoDB TLS, CORS proxy). Una verificación
**sistemática** mapea cada flujo end-to-end y lo prueba contra producción,
detectando bugs latentes ANTES de que el usuario los encuentre.

## Cobertura objetivo

13 áreas. Cada una con criterio go/no-go para AAB.

### 1. Infraestructura (foundation)
- [ ] Health check de cada Cloud Run service (200 OK estable, sin restarts)
- [ ] Logs de la última hora: 0 errores no-conocidos en cada service
- [ ] VPC connector configurado en todos los services con MongoDB
- [ ] env vars críticas seteadas (CORS_ORIGINS, JWT_*, MAPBOX_*, MONGO_URL, REDIS_URL)
- [ ] Cuotas Cloud Run no se acercan al límite
- [ ] MongoDB Atlas IP allowlist incluye VPC connector egress

### 2. Auth completo (multi-rol)
- [ ] Login: user, driver, host, guide, operator, corporate, admin
- [ ] Register con cada rol
- [ ] /auth/me devuelve perfil con roles correctos
- [ ] /auth/refresh emite nuevo access token (sabemos roto, post-AAB)
- [ ] /auth/logout revoca refresh token
- [ ] /auth/forgot-password envía email vía Gmail SMTP
- [ ] /auth/reset-password actualiza contraseña
- [ ] OAuth Google: redirect → callback → token
- [ ] OAuth Facebook: redirect → callback → token
- [ ] Account lockout tras N intentos fallidos
- [ ] Corporate login devuelve companyId

### 3. Pasajero web — flujo completo
- [ ] /auth/login (cookie httpOnly seteada)
- [ ] /dashboard/pasajero carga
- [ ] /ride: ServicePicker → Privado
- [ ] Form: autocomplete origen/destino (Nominatim/geocoding)
- [ ] Form: cálculo de fare estimado correcto
- [ ] Submit → POST /rides/request → activeRide en store
- [ ] Tracking panel: WebSocket conecta a /rides namespace
- [ ] Tracking: evento ride:driver_accepted llega
- [ ] Tracking: ride:driver_arrived → mostrar verify OTP
- [ ] Tracking: ride:completed → ir a confirmation
- [ ] Payment: card / cash / wallet
- [ ] Rating: enviar 1-5 stars + comment

### 4. Conductor web — flujo completo
- [ ] Login con role driver
- [ ] /dashboard/conductor carga
- [ ] /dashboard/conductor/calificaciones lista ratings
- [ ] /drivers/me/wallet muestra balance (recién arreglado)
- [ ] /drivers/me/earnings muestra resumen
- [ ] /drivers/me/earnings/history pagina
- [ ] /drivers/me/withdraw solicita retiro
- [ ] Pending rides aparecen para aceptar
- [ ] Accept ride → ride:driver_accepted emit a pasajero

### 5. Envíos / paquetería
- [ ] /envios/cotizar form
- [ ] POST /parcels (4 esquemas A/B/C/D)
- [ ] Tracking del paquete
- [ ] OTP de entrega
- [ ] /envios/mis-envios dashboard

### 6. Anfitriones (alojamiento)
- [ ] /anfitriones/registro completo
- [ ] Crear alojamiento (multi-paso form)
- [ ] /anfitriones/dashboard lista alojamientos del host
- [ ] Bookings entrantes notifican

### 7. Operadores (tours)
- [ ] /operadores/registro
- [ ] Crear tour con horarios
- [ ] Ver bookings de tour

### 8. Promotores locales (guías)
- [ ] /promotores-locales/registro
- [ ] Listado público funcional

### 9. Corporate / empresas
- [ ] empresas.goingec.com middleware routing
- [ ] /empresas/auth/login (cookie going_empresas_session)
- [ ] /empresas/panel/sostenibilidad
- [ ] /empresas/panel/seguridad
- [ ] /empresas/panel/política
- [ ] /empresas/panel/mapa (live drivers)
- [ ] /empresas/panel/equipo (empleados)
- [ ] /empresas/panel/cotización (bulk pricing)

### 10. Admin dashboard
- [ ] admin.goingec.com login
- [ ] Dashboard home: KPIs reales (users total/active/drivers/admins)
- [ ] /drivers: mapa real-time + lista (Leaflet)
- [ ] /clients: search/filter, activate/suspend
- [ ] /companies: KPIs corporate
- [ ] /bookings, /payments, /payouts, /analytics
- [ ] /alerts, /surge, /promos
- [ ] /nps, /ratings
- [ ] /ingresos, /market

### 11. Mobile apps (preparación AAB)
- [ ] `eas build --platform android --profile preview` produce APK
- [ ] APK preview: login funciona contra api.goingec.com
- [ ] APK preview: Mapbox carga tiles
- [ ] APK preview: GPS permissions piden + funcionan (driver)
- [ ] APK preview: Push notifications (FCM) llegan
- [ ] `eas build --platform android --profile production` produce AAB
- [ ] AAB submit interno a Play Console
- [ ] Closed test 14 días

### 12. WebSocket integration
- [ ] Conexión socket.io a /rides desde browser
- [ ] join:ride emit + receive eventos del room
- [ ] Reconexión automática tras drop
- [ ] Driver location updates aparecen en pasajero map

### 13. Pagos & facturación
- [ ] TEST_SEED mode genera viajes de prueba
- [ ] Datafast cuando llegue certificado + filiación
- [ ] Datil (financial-agent) factura el viaje
- [ ] Withdraw a driver toma fondos del wallet

### 14. Observability
- [ ] Sentry recibe errores (mobile + frontend + backend)
- [ ] Cerebro tracker captura web-events
- [ ] customer-support-service: Telegram bot responde

## Metodología

Por cada item:
1. **Test**: comando concreto (curl, click sequence, eas command)
2. **Expected**: respuesta esperada
3. **Actual**: lo que pasa en producción
4. **Verdict**: ✅ pass · ⚠️ partial · ❌ fail
5. **Action**: ticket / fix / accept

## Bloqueantes para AAB (subset crítico)

Solo lo siguiente DEBE pasar para someter AAB:

- [ ] Auth login (user + driver) → access token válido 7d
- [ ] Pasajero web: search → confirm → pay → track → rate (sin "se corta")
- [ ] Conductor web: aceptar → completar → ver wallet
- [ ] Envíos: cotizar + pagar
- [ ] Admin dashboard accesible
- [ ] Mobile APK preview funcional
- [ ] AAB build produce archivo válido
- [ ] Play Console submit a internal track ok

Resto puede esperar a post-AAB con seguimiento documentado.

## Plan de ejecución

1. **Smoke automatizado** — script bash con curl que verifica endpoints clave
   contra producción (~30 endpoints en 2 min)
2. **E2E browser** — navegación humana o vía Chrome MCP del flujo pasajero
   completo (con Datafast simulado)
3. **APK preview** — build + install en dispositivo + walk-through manual
4. **Findings** documentados en `docs/findings-pre-aab.md` con acción

## Sesiones anteriores (referencias)

- PR #55: Cleanup raíz + AUTH fix + drivers misrouting + MongoDB TLS + dead services
- PR #56: Webapps cleanup
- PR #57: Mobile cleanup + Mapbox token driver
- Branch claude/mobile-aab: incluye fix CORS proxy (commit 9ce97eff)
