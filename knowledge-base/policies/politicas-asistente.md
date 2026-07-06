# Políticas del asistente Going

> **Documento canónico (curado por Rubén).** Consolida las políticas que el
> asistente comunica al público: cancelación, Going Empresas, mascotas y
> reembolsos. Es la versión autoritativa.

## Política de cancelación

### Cuándo puede cancelar el cliente

**Sin costo (cancelación temprana)**

- **Viaje inmediato (on-demand):** dentro de los primeros 2 minutos desde que se
  solicita el viaje y antes de que el conductor confirme que va en camino al
  pickup.
- **Viaje programado:** hasta 90 minutos antes de la hora pactada.

**Con cargo parcial (cancelación tardía)**

- **Viaje inmediato:** después de los 2 minutos o cuando el conductor ya está en
  camino al pickup → se cobra una tarifa de cancelación mínima.
- **Viaje programado:** menos de 90 minutos antes → se cobra una tarifa
  proporcional mínima.

**Sin reembolso**

- Si el conductor llegó al pickup y el cliente no aparece en 10 minutos desde la
  llegada (no-show), se cobra la tarifa completa.
- Si el cliente cancela después de iniciar el viaje, no aplica reembolso excepto
  en casos excepcionales (handoff a soporte humano).

### Cuándo puede cancelar el conductor

- Antes de llegar al pickup, sin penalidad por causa razonable (tráfico
  imposible, problema mecánico, emergencia). El sistema reasigna automáticamente.
- Si el conductor cancela frecuentemente sin causa, se penaliza su rating y
  eventualmente se le saca de la plataforma.

### Cuándo Going App cancela el viaje

- No hay conductoras o conductores disponibles en el radio de matching tras un
  timeout (configurado en el backend, hoy ~90 segundos).
- Sistema en mantenimiento o emergencia.

En estos casos:

- Sin costo para el cliente.
- Si era un viaje programado, se ofrece reprogramar o reembolso completo.

### Cómo se ejecuta una cancelación

1. Botón "Cancelar viaje" en la app.
2. Confirmación con motivo (selección rápida + texto opcional).
3. Si aplica cargo → se informa antes de confirmar.
4. Confirmación final → se libera el conductor.

### Casos especiales

- Cancelación masiva por desastre natural / paro.
- Cancelación por falla técnica de la app.
- Reembolso de viajes corporativos (cargo a la empresa, no al empleado).

## Política Going Empresas

### Qué es

Going Empresas es el plan corporativo de Going App: una capa de gestión sobre el
servicio normal para que organizaciones puedan ofrecer transporte a sus empleados
con control de presupuesto, facturación consolidada y reportes. URL del panel:
`https://empresas.goingec.com`

### Beneficios para la empresa

- **Facturación consolidada mensual** con factura electrónica.
- **Política de viaje configurable:**
  - Días y horarios permitidos: todos los días y horarios excepto en zonas rojas.
  - Vehículos autorizados: SUV / SUV XL / VAN / VAN XL / MINIBUS / BUS;
    eventualmente, en determinados lugares, autos y camionetas.
  - Tipos de viaje permitidos (compartido, privado siempre con aprobación, etc.).
  - Origen / destino restringidos (ej. solo a/desde oficina y aeropuerto).
- **Límites de presupuesto por empleado:**
  - Mensual, semanal o por viaje.
  - Notificación cuando un empleado se acerca al límite.
- **Aprobación multinivel (opcional):**
  - Manager debe aprobar viajes sobre cierto monto.
  - Workflow de aprobación con notificación email.
- **Despacho prioritario:**
  - Los viajes corporativos tienen prioridad sobre los retail en igualdad de
    condiciones.
- **Reportes y analytics:**
  - Costo por departamento / empleado / ruta.
  - Frecuencia de uso.
  - Comparativo mensual.

### Cómo se contrata

1. La empresa solicita en `empresas.goingec.com` el alta de cuenta corporativa.
2. Going revisa el RUC, contrato y datos.
3. Se firma contrato (acuerdo de servicio + política de uso).
4. Going crea la cuenta corporativa y asigna un Account Manager.
5. La empresa carga sus empleados al sistema (manual o vía CSV/API).
6. Se configura la política inicial.
7. Cada empleado descarga la app Going y se conecta a la cuenta corporativa con
   su email empresarial.

### Facturación

- Ciclo mensual (corte el día 1, factura emitida hasta día 5 del mes siguiente).
- Pago a 15 / 30 días según contrato.
- Factura electrónica enviada por email + disponible en el panel.
- Detalle: cada viaje listado con empleado, ruta, vehículo, monto.
- Métodos: transferencia bancaria principalmente. PSE para empresas grandes.

### Modalidades

Planes específicos cuando estén:

- Plan PYME (1-50 empleados).
- Plan Corporativo (51-500 empleados).

### Soporte corporativo

- Account Manager dedicado para clientes Corporate y Enterprise.
- Línea directa para incidentes.
- Reportes mensuales automatizados.

> **Regla de dominio (ver `policies/corporativo.md`):** el plan corporativo
> aplica **+25% de RECARGO** sobre la tarifa privada Confort — es un sobrecosto
> que financia la capa premium (facturación, política, prioridad, reportes), NO
> un descuento.

## Política de mascotas

### Regla general

Going App permite mascotas pequeñas en transportadora cerrada en algunos viajes,
dependiendo del conductor.

### Cómo funciona

1. Al reservar, marca la casilla **"Viajo con mascota"** en la app.
2. El sistema busca conductoras o conductores que tengan la opción "Acepta
   mascotas" activada en su perfil.
3. Si hay match → se asigna normalmente.
4. Si no hay match en ese momento → la app te avisa y te ofrece reservar para más
   tarde o cambiar de modalidad.

### Requisitos para llevar mascota

- **Transportadora cerrada y limpia.** No se permite la mascota suelta dentro del
  vehículo.
- **Tamaño pequeño o mediano.** Para mascotas grandes (perros >25kg) consulta por
  chat para coordinar vehículo apropiado.
- **Vacunación al día.** El conductor puede pedir ver el carné si tiene dudas.
- **Sin olor fuerte ni mascotas que generen alergia visible** — por respeto a
  otros pasajeros y al conductor.

### Qué NO se permite

- Mascotas sueltas en el vehículo.
- Animales no domésticos (aves grandes, reptiles, etc.) sin coordinación previa.
- En viaje COMPARTIDO, la mascota ocupa asiento y paga por él.

### En caso de daños

Si la mascota causa daños al vehículo (orines, mordeduras, etc.):

- El dueño asume el costo de limpieza profesional.
- El conductor puede dar de baja al pasajero con causa justificada.

### En caso de viaje con mascota de servicio (perro guía, asistencia)

- **Siempre permitido**, sin costo extra, sin transportadora obligatoria.
- El cliente indica al reservar.
- Si un conductor se niega injustificadamente, es falta grave y se le sanciona.

## Política de reembolsos

### Cuándo aplica reembolso

**Reembolso 100%**

- Going cancela el viaje (sin conductor disponible, sistema caído).
- El conductor cancela y no se logra reasignar a tiempo.
- El conductor llega más de 20 minutos tarde al pickup.
- Falla técnica de pago confirmada (cobro doble, error de pasarela).
- Viaje no completado por causa imputable a Going App.

**Reembolso parcial**

- Servicio degradado parcial: ej. conductor llegó pero el vehículo es distinto al
  reservado (SUV en vez de VAN) — se reembolsa la diferencia.
- Ruta más larga que la cotizada por error del conductor (se ajusta a la
  cotización original).

**Sin reembolso**

- Viaje completado satisfactoriamente.
- Cancelación del cliente fuera de la ventana sin cargo (ver sección de
  cancelación).
- No-show del cliente.
- Disputa por cosa subjetiva ("no me gustó la música") sin daño objetivo.

### Cómo solicitar un reembolso

1. El cliente abre soporte desde la app o WhatsApp Going.
2. Indica el ID del viaje y el motivo.
3. El equipo de soporte revisa:
   - Logs del viaje (ruta GPS, timestamps).
   - Comunicación cliente ↔ conductor.
   - Comprobante de cobro.
4. Decisión en hasta 48 horas hábiles.
5. Si procede → el reembolso vuelve al método de pago original en hasta **5-10
   días hábiles** según el banco / pasarela.

### Excepciones

- Reembolsos corporativos (cargo a la cuenta de la empresa, no al empleado).
- Reembolsos por suscripciones o planes prepagos cuando se lancen.
- Casos de fuerza mayor (desastre natural, paro nacional).
