# Política de cancelación

> ⚠️ **Plantilla — completar con operaciones Going antes del lanzamiento.**
> Las cifras y ventanas de tiempo abajo son TENTATIVAS y deben validarse con
> el equipo legal y de soporte.

## Cuándo puede cancelar el cliente

### Sin costo (cancelación temprana)

- **Viaje inmediato (on-demand):** dentro de los primeros **2 minutos** desde
  que se solicita el viaje y antes de que el conductor confirme que va en
  camino al pickup.
- **Viaje programado:** hasta **30 minutos antes** de la hora pactada.

### Con cargo parcial (cancelación tardía)

- **Viaje inmediato:** después de los 2 minutos o cuando el conductor ya está
  en camino al pickup → se cobra una tarifa de cancelación mínima
  (PENDIENTE: definir monto).
- **Viaje programado:** menos de 30 minutos antes → se cobra una tarifa
  proporcional (PENDIENTE: definir % o monto fijo).

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
