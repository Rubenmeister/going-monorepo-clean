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

- [ ] **Tracking real** (estado en vivo del envío): la pantalla de seguimiento
  actual es demo. Conectar a `/parcels/:id` + WebSocket y redirigir a
  `/envios/tracking/[trackingId]` tras crear el envío.
- [ ] **Adjuntar foto del paquete** al backend (hoy solo previsualización local).

## Cuenta / Pagos (Grupo C)

- [ ] **Editar perfil**: la cuenta hace `PATCH /auth/me` con `{firstName,lastName,phone}`.
  Confirmar que el backend expone ese método (si no, devolverá error y el
  usuario verá "No se pudo guardar").
- [ ] **Preferencias de notificación**: hoy se guardan en `localStorage` del
  dispositivo. Falta endpoint de settings para persistirlas por usuario.
- [ ] **Wallet**: Recargar y Transferir están deshabilitados ("Pronto") — faltan
  los flujos/endpoints de pago (`/payment/recharge`, `/payment/transfer`).
- [ ] **2FA de usuario** y **eliminación de cuenta**: pendientes de flujo backend.
