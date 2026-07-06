# Política de cancelación

> **Versión canónica consolidada:** `policies/politicas-asistente.md`.
>
> **Ventana confirmada por Rubén (jul-2026):** en **viaje programado**, sin costo
> hasta 1 hora y media (90 minutos) antes del viaje, una vez asignado el
> conductor. En **viaje inmediato (on-demand)**, el doc curado fija sin costo
> dentro de los primeros 5 minutos desde la solicitud y antes de que el conductor
> confirme que va en camino. La tarifa de cancelación es de $2 USD.

## Cuándo puede cancelar el cliente

### Sin costo (cancelación temprana)

- **Sin costo hasta 1 hora y media (90 minutos) antes** de la hora del viaje,
  una vez que ya se asignó conductora o conductor. El valor queda como **saldo a
  favor en el Going Wallet**.
- Antes de que se asigne conductora o conductor, la cancelación es siempre sin
  costo.

### Con cargo (cancelación tardía)

- **Menos de 1 hora y media antes** del viaje, con conductora o conductor ya
  asignado → se cobra una tarifa de cancelación de **$2 USD**.

### Sin reembolso

- Si el conductor llegó al pickup y el cliente no aparece en **10 minutos**
  desde la llegada (no-show), se cobra la tarifa completa.
- Si el cliente cancela después de iniciar el viaje, no aplica reembolso
  excepto en casos excepcionales (handoff a soporte humano).

## Cuándo puede cancelar el conductor

- Antes de llegar al pickup, sin penalidad por causa razonable (tráfico
  imposible, problema mecánico, emergencia). El sistema reasigna automáticamente.
- Si el conductor cancela frecuentemente sin causa, se penaliza su rating y
  eventualmente se le saca de la plataforma.

## Cuándo Going cancela el viaje

- No hay conductoras o conductores disponibles en el radio de matching tras
  un timeout (configurado en el backend, hoy ~90 segundos).
- Sistema en mantenimiento o emergencia.

En estos casos:
- Sin costo para el cliente.
- Si era un viaje programado, se ofrece reprogramar o reembolso completo.

## Cómo se ejecuta una cancelación

1. Botón "Cancelar viaje" en la app.
2. Confirmación con motivo (selección rápida + texto opcional).
3. Si aplica cargo → se informa antes de confirmar.
4. Confirmación final → se libera el conductor.

## Casos especiales

PENDIENTE: documentar reglas para:
- Cancelación masiva por desastre natural / paro
- Cancelación por falla técnica de la app
- Reembolso de viajes corporativos (cargo a la empresa, no al empleado)
