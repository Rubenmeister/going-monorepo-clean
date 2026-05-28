# Going Ecuador — Checklist Soft Launch 16 de junio de 2026

> Punch list final para Rubén — qué falta antes de poder decir "Going está en producción Android para usuarias y conductoras reales".
>
> Estado de cierre al **28-may-2026**. Items 🔴 son bloqueantes; 🟡 son nice-to-have.

---

## 1. Backend (Cloud Run) ✅

- ✅ 15+ microservicios desplegados en producción (`api.goingec.com`)
- ✅ Cerebro autónomo + ops-agent + customer-support + voice-call
- ✅ Atlas Mongo + Redis Memorystore
- ✅ MFA TOTP + Google Workspace SSO
- ✅ Datafast + DeUna payment integrations
- ✅ KB Fase B integrada (tarifas autoritativas)
- ✅ Driver Compliance + No-show detection
- ✅ Hybrid Mode (urbano + interurbano)

## 2. Frontend Web ✅

- ✅ `goingec.com` (website marketing) — Hero v6, Marco Legal, footer brand-aligned
- ✅ `app.goingec.com` (webapp pasajero) — 24 docs legales, panel empresas, brand v6
- ✅ `admin.goingec.com` (admin interno)
- ✅ `empresas.goingec.com` (panel corporativo, ahora con Legal Corporativo)

## 3. Marco Legal ✅

- ✅ Razón social `Thorn AI Technologies S.A.S.` consistente en todas las superficies
- ✅ RUC `1793176925001` + domicilio Echeverría N2-170 y Crespo Toral, Quito
- ✅ 24 documentos legales en `/legal` (web + webapp)
- ✅ Centro Legal in-app en **mobile-user-app** (12 docs) y **mobile-driver-app** (10 docs + Wellness Guard)
- ✅ Cero ocurrencias de `Going Ecuador S.A.S.` o `legal@goingec.com` en código

## 4. Brand Alignment Going 2024 ✅

- ✅ Paleta consistente: rojo `#FF4C41` + amarillo `#FFD253` + negro `#000000`
- ✅ Website + frontend-webapp con Hero v6
- ✅ mobile-driver-app barrido (60 colores hardcoded → brand red)
- ✅ mobile-user-app barrido (20 archivos)
- ✅ StatusBar driver-app brand-aligned

## 5. Performance pre-launch ✅

- ✅ `going-hero.jpg` 17 MB → 501 KB (97% reducción)
- ✅ 60 imágenes de bundle comprimidas (~104 MB ahorrados)
- ✅ LCP mejorado para Ecuador (redes 4G/3G)

## 6. Mobile Apps — config técnica ✅

- ✅ `mobile-user-app` `com.going.userapp` versionCode 66
- ✅ `mobile-driver-app` `com.going.conductor` versionCode 52
- ✅ `POST_NOTIFICATIONS` (Android 13+) en ambos
- ✅ `FOREGROUND_SERVICE_LOCATION` driver (Android 14+)
- ✅ `CAMERA` + `READ_MEDIA_IMAGES` driver (Register flow)
- ✅ iOS `NSCameraUsageDescription` + `NSPhotoLibraryUsageDescription` driver
- ✅ iOS `NSMicrophoneUsageDescription` user (voz Asistente)
- ✅ EAS production profile configurado (autoIncrement + remote credentials driver)

## 7. Lo que falta para soft launch 🔴

### 7.1 Decisiones del founder

| Item | Estado | Quién |
|------|--------|-------|
| Confirmación final del package name driver | ✅ `com.going.conductor` | OK |
| Apple Developer Account ($99/año) | ❌ Diferido — soft launch solo Android | Diferido |
| Track Play Console: Internal vs Production | 🔴 Decidir antes de submit | Rubén |

### 7.2 Assets pendientes

| Item | Esfuerzo | Responsable |
|------|----------|-------------|
| Screenshots reales de **Going Pasajero** (mín 2 — recomendado 4-8) | 30 min con emulador o Pixel | Rubén |
| Screenshots reales de **Going Conductor** | 30 min | Rubén |
| Video demo `ACCESS_BACKGROUND_LOCATION` (30s, conductor online → mapa) | 30 min grabación | Rubén |
| Justificación texto para Play Console (background location) | ✅ Lista en `docs/play-store-background-location-justification.md` | Hecho |

### 7.3 Conductores piloto

| Item | Estado |
|------|--------|
| Sintético seed `seed-synthetic-drivers.mjs` para visibilidad | ✅ Script listo, falta ejecutar con MONGODB_URL |
| Conductores reales onboarded (target 20-30) | 🔴 Pendiente — campaña outreach |
| Compliance docs (cédula, licencia, SOAT, matrícula) verificados | 🔴 Pendiente — depende de conductores reales |

### 7.4 Builds y submission

| Item | Comando | Tiempo |
|------|---------|--------|
| `eas build --platform android --profile production` user | `mobile-user-app` | ~20 min cloud |
| `eas build --platform android --profile production` driver | `mobile-driver-app` | ~20 min cloud |
| `eas submit --platform android --profile production` user | enviar a track Internal | ~5 min |
| `eas submit --platform android --profile production` driver | enviar a track Internal | ~5 min |

Ver `docs/eas-build-commands.md` para la secuencia detallada.

### 7.5 QA manual smoke test

| Flujo | Estado |
|-------|--------|
| Registro pasajero + verificación OTP | 🔴 manual |
| Solicitar viaje compartido Quito intracity | 🔴 manual |
| Solicitar viaje privado interurbano (Quito→Ambato) | 🔴 manual |
| Cancelar viaje en distintos estados | 🔴 manual |
| Función SOS durante viaje activo | 🔴 manual |
| Programar viaje futuro + ver en /bookings | 🔴 manual |
| Reservar asiento carpool interurbano | 🔴 manual |
| Crear envío + tracking + entrega con OTP | 🔴 manual |
| Pago Datafast tarjeta de crédito | 🔴 manual |
| Pago DeUna QR | 🔴 manual |

Ver `docs/smoke-test-manual.md` para el script paso a paso.

## 8. Diferidos para post-launch 🟡

- 🟡 Theme system completo en driver-app (light/dark + ThemeProvider + tokens semánticos)
- 🟡 Sentry mobile observability (DSN + breadcrumbs)
- 🟡 iOS builds (necesita Apple Developer)
- 🟡 Esconder TODOs visibles del UI (Wallet recarga, Puntos canje)
- 🟡 Tests automatizados de flujos críticos (jest + detox)
- 🟡 Notion + Slack integrations interno

## 9. Riesgos identificados

| Riesgo | Mitigación |
|--------|------------|
| Play Console rechaza por `ACCESS_BACKGROUND_LOCATION` sin video | Video + texto listos antes de submit |
| Conductores piloto pocos al lanzar (UX vacía) | Synthetic drivers seed + campaña outreach pre-launch |
| Latencia en zonas rurales con red débil | Backend ya optimizado con timeouts; testear con throttle |
| Tarjetas internacionales no funcionan con Datafast | Documentado; usar DeUna como fallback |
| Conductores reales sin compliance docs al día | Sistema de gates ya bloquea login si docs vencen |

## 10. Cierre

Cuando los items 7.1, 7.2, 7.3, 7.4 estén ✅, **Going está listo para Internal Testing en Play Store**.

Día D objetivo: **16 de junio de 2026 — soft launch público con campaña de expectativa 15 días antes**.
