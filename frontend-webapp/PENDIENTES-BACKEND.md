# Pendientes de backend — Flujos de Viaje y Envío (Grupo B)

Items que la webapp **no puede resolver sola** porque dependen del backend.

## Viaje

- [ ] **Avisos 1 hora y 5 minutos antes** de un viaje reservado.
  - Requiere: scheduler en backend + push notifications (web push / FCM) o SMS.
  - La webapp ya anuncia estos avisos en el panel de seguimiento, pero el envío
    real lo debe disparar el backend.
- [ ] **Asignación interna del conductor más opcionado** para reservas.
  - El backend debe asignar al conductor ~1 h antes de la salida y emitir el
    evento `ride:driver_accepted` por WebSocket (la webapp ya lo escucha).
- [ ] **Token de fin de viaje real**: hoy el código de cierre se genera en el
  cliente (determinístico por `rideId`). Idealmente el backend emite/valida el
  código de fin para que el conductor lo confirme contra el servidor.

## Envío

- [x] **Tracking real** (estado en vivo del envío): HECHO. Tras crear el envío,
  `cotizar` redirige a `/envios/tracking/[trackingCode]`, que consulta el
  endpoint real `GET /parcels/track/:trackingCode` y refresca cada 10s. Se
  eliminó la pantalla demo. (Mejora futura: WebSocket en vez de polling.)
- [ ] **Adjuntar foto del paquete** al backend (hoy solo previsualización local).

## Cuenta / Pagos (Grupo C)

- [x] **Editar perfil**: HECHO — `user-auth-service` expone `PATCH /auth/me`
  (`{firstName,lastName,phone}`). La webapp ya guarda contra él.
- [ ] **Preferencias de notificación**: hoy se guardan en `localStorage` del
  dispositivo. Falta endpoint de settings para persistirlas por usuario.
- [~] **Wallet del pasajero**: Slice 1 + 2 HECHOS — ledger real, balance/
  transactions, y **recarga** (Datafast/DeUna): `POST /payments/wallet/recharge`
  + confirmación por estado `POST .../recharge/:ref/confirm` + acreditación
  idempotente, con **webhook** como backstop. Página `/payment/recharge` lista.
  ⚠️ Requiere credenciales reales (`DATAFAST_*`, `DEUNA_*`) en staging para
  probar el pago de punta a punta. Pendiente: **transferencias** entre usuarios.
- [ ] **2FA de usuario** y **eliminación de cuenta**: pendientes de flujo backend.
