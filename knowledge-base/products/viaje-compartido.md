# Viaje Compartido

**Carpooling puerta a puerta entre ciudades del Ecuador.**

## Qué es

Comparte un vehículo (SUV o VAN) con otras personas que van a la **misma ruta**.
Cada pasajero paga **solo su asiento**.

Es el producto más popular de Going porque combina lo mejor de dos mundos: el
confort de un transporte privado (no es bus público, no hay terminales, no hay
horarios fijos rígidos) con el precio de uno compartido.

## Cómo funciona

1. En la app, eliges origen y destino entre ciudades cubiertas.
2. El sistema busca conductoras o conductores Going que vayan en esa misma ruta
   con cupos disponibles.
3. Si hay cupo, reservas tu asiento por un precio fijo (sin sorpresas).
4. El conductor pasa a recogerte en tu dirección exacta (puerta a puerta).
5. Te deja en tu dirección exacta de destino.
6. Pagas desde la app (tarjeta, Datafast o DeUna).

## Vehículos disponibles

- **SUV** — hasta 4 pasajeros
- **VAN** — hasta 7 pasajeros

(Vehículos más grandes —Minibús, Bus— se ofrecen solo en modalidad **Privado**.)

## Para quién

- Una persona o pareja que quiere ir entre ciudades sin pagar el vehículo
  completo.
- Estudiantes y profesionales que viajan a Quito desde Ambato, Latacunga, Ibarra,
  Otavalo, Santo Domingo, etc.
- Turistas que quieren llegar al aeropuerto Mariscal Sucre desde otra ciudad.

## Ventajas vs. transporte tradicional

- **Más barato que un taxi privado** entre ciudades (hasta 70% menos).
- **Más rápido y cómodo que el bus interprovincial** — no hay paradas en
  terminal, vas puerta a puerta.
- **Conductoras y conductores verificados** con documentación al día y
  calificados por viajes anteriores.
- **Tracking en vivo** que puedes compartir con tu familia.

## Limitaciones honestas

- Solo entre ciudades cubiertas (ver `coverage.yaml`).
- Depende de que haya otros pasajeros en la misma ruta — en horarios de muy baja
  demanda el sistema puede sugerir cambiar a Viaje Privado.
- Los precios pueden tener recargos por hora pico, nocturno, fin de semana o
  feriado.

## Precio

**El precio EXACTO se cotiza en la app** con la función `get_quote`, que toma
en cuenta:
- Origen y destino exactos
- Modalidad compartido
- Hora del día (recargos nocturno, fin de semana)

Las tarifas base por corredor viven en `pricing/`.

Los agentes (chat, voice) **nunca deben dar un precio sin haber llamado a la
función**. Si no tienen origen+destino claros, deben preguntar.
