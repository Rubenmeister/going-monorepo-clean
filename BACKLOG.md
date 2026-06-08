# Backlog — items grandes / sensibles (hacer con diseño previo)

Lista viva de trabajos que **no** se improvisan: dinero, auth y arquitectura
operativa. Cada uno requiere diseño + revisión antes de implementar.
El resto del trabajo cerrado vive en el historial de PRs y en
`frontend-webapp/PENDIENTES-BACKEND.md`.

## 💰 Sensibles a dinero

- [ ] **Refund de admin** — `POST /payments/:id/refund` (guard admin).
  `payment-service` ya tiene la lógica base (`Payment.refund()`, estado
  `refunded`, refund para corporativos). Falta: endpoint admin con
  **idempotencia**, **audit log** (quién/cuándo/monto), full vs parcial.
  **Verificar primero** si Datafast/DeUna exponen refund por API; si no,
  flujo de "reembolso manual" (registra intención + ops procesa).
  Hoy el botón de refund del admin pega a un endpoint inexistente.

- [ ] **Payouts persistentes** — hoy es **stub en memoria**
  (`transport-service/.../admin-stubs.controller.ts`), se pierde al redeploy.
  Diseño: modelo `Payout` persistido (proveedor/conductor, período, monto,
  estado pending/paid, ítems) + **fuente de verdad del monto** (ledger del
  wallet o rides completados) + `GET /payouts` y `PATCH /payouts/:id/mark-paid`
  con audit. El admin ya muestra banner "en construcción".

## 🔐 Auth / hardening

- [ ] **JWT del admin → cookie httpOnly** — hoy el JWT vive en `localStorage`
  (riesgo si hubiera XSS). La API ya está protegida server-side (cada
  `/auth/admin/*` valida JWT + rol admin), así que NO es un agujero urgente,
  pero mover el token a cookie httpOnly reduce el blast-radius. Cambia el flujo
  de login/sesión → diseñar con calma para no romper el acceso.
  (CSRF no aplica: la auth es por header `Authorization: Bearer`, no cookie.)

## 🏗️ Arquitectura

- [ ] **Consolidar el "cerebro" de soporte** — hoy `customer-support-service`
  (texto/WhatsApp/Telegram) y `voice-call-service` (telefonía Twilio/Realtime)
  duplican la lógica de soporte (handoff, prompts, conversaciones, métricas).
  La separación voz/texto es correcta (infra distinta), pero el **núcleo**
  (conocimiento/políticas) debería ser una librería compartida + adaptadores
  de canal. Importante para el manejo operativo → diseñar para que quede
  perfecto.

## 🔧 Stubs / endpoints menores (no dinero)

- [ ] **Stubs en memoria → persistencia**: incidentes de dashcam y reglas de
  surge (`admin-stubs.controller.ts`). Hoy con banner "en construcción".
- [ ] **Listado de vehículos del admin** — el endpoint devuelve vacío; conectar
  a la flota real cuando el backend la exponga.
- [ ] **`GET /analytics/transport/cities`** — no existe; el admin (Mercado)
  degrada a vacío. Implementar la agregación en analytics/transport.

## ⚙️ CI/CD

- [ ] **CD: grupo de concurrencia por servicio** — hoy el grupo es
  `deploy-${ref}`, así que dos `workflow_dispatch` simultáneos se cancelan
  entre sí (hay que dispararlos secuenciales). Cambiar a
  `deploy-${ref}-${service}` para permitir deploys en paralelo.
