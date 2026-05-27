# Política de reembolsos

> ⚠️ **Plantilla — completar con operaciones y contabilidad Going.**
> Los plazos y porcentajes abajo son TENTATIVOS.

## Cuándo aplica reembolso

### Reembolso 100%

- Going cancela el viaje (sin conductor disponible, sistema caído).
- El conductor cancela y no se logra reasignar a tiempo.
- El conductor llega más de **20 minutos** tarde al pickup (PENDIENTE: confirmar
  ventana de tolerancia).
- Falla técnica de pago confirmada (cobro doble, error de pasarela).
- Viaje no completado por causa imputable a Going.

### Reembolso parcial

- Servicio degradado parcial: ej. conductor llegó pero el vehículo es distinto
  al reservado (SUV en vez de VAN) — se reembolsa la diferencia.
- Ruta más larga que la cotizada por error del conductor (se ajusta a la
  cotización original).

### Sin reembolso

- Viaje completado satisfactoriamente.
- Cancelación del cliente fuera de la ventana sin cargo (ver
  `cancelacion.md`).
- No-show del cliente.
- Disputa por cosa subjetiva ("no me gustó la música") sin daño objetivo.

## Cómo solicitar un reembolso

1. El cliente abre soporte desde la app o WhatsApp Going.
2. Indica el ID del viaje y el motivo.
3. El equipo de soporte revisa:
   - Logs del viaje (ruta GPS, timestamps)
   - Comunicación cliente ↔ conductor
   - Comprobante de cobro
4. Decisión en hasta **48 horas hábiles** (PENDIENTE: confirmar SLA).
5. Si procede → el reembolso vuelve al método de pago original en hasta **5-10
   días hábiles** según el banco / pasarela.

## Excepciones

PENDIENTE: documentar:
- Reembolsos corporativos (cargo a la cuenta de la empresa, no al empleado)
- Reembolsos por suscripciones o planes prepagos cuando se lancen
- Casos de fuerza mayor (desastre natural, paro nacional)
