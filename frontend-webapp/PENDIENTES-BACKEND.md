# Pendientes de backend — Flujos de Viaje y Envío (Grupo B)

Items que la webapp **no puede resolver sola** porque dependen del backend.

## Viaje

- [x] **Avisos 1 hora y 5 minutos antes** de un viaje reservado: HECHO.
  `ScheduledRideReminderCron` (en transport-service) busca reservas próximas
  (ventanas 1h y 5min, idempotente por `reminder1hSentAt`/`reminder5mSentAt`) y
  envía push vía `notifications-service /api/notifications/send` (FCM) + evento
  WS `ride:reminder`.
  - [x] **web-push del navegador**: HECHO — service worker FCM
    (`public/firebase-messaging-sw.js`), helper `lib/push.ts` (permiso + token)
    y endpoint `POST /notifications/device-token` (notifications-service) para
    registrar el token. Toggle "Activar notificaciones" en `/account` (Ajustes).
    ⚠️ Requiere configurar `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (+ `appId`) para que
    `getToken` funcione; sin ellos el botón avisa "no configurado".
- [x] **Asignación interna del conductor más opcionado** para reservas: YA
  existía — `ScheduledRideDispatcherCron` abre el canal y dispara el matching a
  `scheduledAt − MATCH_LEAD_TIME_MINUTES` (60 por defecto) y emite por WS.
- [x] **Token de fin de viaje real**: HECHO. El backend **emite** el código de
  cierre (`GET /rides/:rideId/end-token`, 6 dígitos generados por
  `TokenService.generateDeliveryToken`, guardado en el `Ride`) y lo **valida**
  cuando el conductor lo confirma (`POST /rides/:rideId/confirm-delivery`), que
  marca `status='completed'` y emite `ride:delivery_confirmed`. El frontend ya
  no calcula el código a partir del `rideId`: el `EndTripModal` lo pide al
  servidor y el panel cierra el viaje al recibir el evento del backend.
- [x] **SOS / emergencia conectado**: HECHO. El botón SOS del panel de viaje ya
  no es solo un enlace informativo: abre un modal que ofrece llamada directa al
  911 y dispara la alerta real `POST /rides/:rideId/sos` (registra la alerta con
  severidad alta para ops y emite `ride:sos` por WebSocket), adjuntando la
  ubicación por geolocalización (best-effort). (El endpoint ya existía en
  transport-service; faltaba conectarlo desde la webapp.)

## Envío

- [x] **Tracking real** (estado en vivo del envío): HECHO. Tras crear el envío,
  `cotizar` redirige a `/envios/tracking/[trackingCode]`, que consulta el
  endpoint real `GET /parcels/track/:trackingCode` y refresca cada 10s. Se
  eliminó la pantalla demo. (Mejora futura: WebSocket en vez de polling.)
- [x] **Adjuntar foto del paquete** al backend: HECHO. Tras crear el envío, la
  webapp sube la foto (multipart) a `POST /parcels/:id/photo` (envios-service),
  que valida dueño/tamaño (≤2 MB) y la guarda como data URL en el `Parcel`
  (`packagePhotoUrl`, sin almacenamiento externo). Disponible en `GET /parcels/:id`.

## Cuenta / Pagos (Grupo C)

- [x] **Editar perfil**: HECHO — `user-auth-service` expone `PATCH /auth/me`
  (`{firstName,lastName,phone}`). La webapp ya guarda contra él.
- [ ] **Preferencias de notificación**: hoy se guardan en `localStorage` del
  dispositivo. Falta endpoint de settings para persistirlas por usuario.
- [x] **Wallet del pasajero**: COMPLETO — ledger, balance/transactions,
  **recarga** (Datafast/DeUna, confirmación por estado + webhook idempotente) y
  **transferencias** entre usuarios (`POST /payments/wallet/transfer`, resuelve
  al receptor por email/teléfono vía `GET /auth/internal/lookup-user`; débito+
  crédito atómico idempotente con reverso). Páginas `/payment/recharge` y
  `/payment/transfer` listas.
  ⚠️ La recarga real necesita credenciales `DATAFAST_*`/`DEUNA_*`; la
  transferencia necesita `INTERNAL_SERVICE_TOKEN` + `USER_AUTH_SERVICE_URL` en
  payment-service (igual que el LoyaltyClient existente).
- [x] **2FA de usuario**: HECHO — el backend (user-auth) ya tenía MfaController
  (TOTP/speakeasy) + challenge en login. Frontend conectado: página
  `/account/2fa` (activar con QR + códigos de recuperación / desactivar) y
  segundo paso en el login (`/api/auth/mfa/verify-login` + UI de código).
- [x] **Eliminación de cuenta** (borrado suave): HECHO. `DELETE /auth/me`
  (user-auth) verifica contraseña, anonimiza PII (email/nombre/teléfono),
  invalida el login (passwordHash aleatorio, status='deleted') y conserva el
  registro para integridad con viajes/pagos. Frontend: modal de confirmación
  (contraseña + escribir "ELIMINAR") en `/account` → cierra sesión.
