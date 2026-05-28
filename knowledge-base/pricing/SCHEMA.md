# Schema de tarifas Going — versión 2.0

## Por qué v2

La v1 (3 archivos `ruta-*.yaml`) era una copia plana de
`going-services.ts`. No soportaba dimensiones críticas: zonas dentro de
ciudad, recargos por hora/día/feriado, tipos de cliente, promos.

Además había **drift** entre las 3 fuentes vivas del sistema (FARES en
`libs/pricing`, tabla de `going-services.ts`, YAML del KB). Ejemplo
detectado: Quito ↔ Riobamba compartido SUV — FARES dice **$17**, chat
decía **$20**, el cliente quedaba confundido.

**Decisión (28-may-2026):** consolidar todo en `knowledge-base/pricing/`
como **única fuente de verdad**. FARES y la tabla de going-services se
deprecan en Fase B (libs/going-kb loader). El chat, el voice, el cobro y
el admin leen lo mismo.

## Archivos del schema

```
pricing/
├── SCHEMA.md                    ← este archivo
├── REVISAR.md                   ← items pendientes de validación con ops
├── vehicles.yaml                ← 7 tipos canónicos + capacidades + multiplicadores
├── zones.yaml                   ← zonas dentro de cada ciudad (recargos de origen)
├── dynamic-surcharges.yaml      ← hora pico, nocturno, fin de semana, feriado
├── client-types.yaml            ← retail, corporativo (+25%), agencia
├── rutas.yaml                   ← TODAS las rutas con precio base por vehículo+modalidad
└── envios.yaml                  ← tarifas de paquetería por tamaño y distancia
```

## Cálculo de precio final

```
precio_final =
    rutas[origen→destino][modalidad][vehiculo]
  + zones[ciudad][origin_zone].origin_surcharge_usd
  × dynamic_surcharges[hora actual].multiplier
  × dynamic_surcharges[día semana].multiplier
  × dynamic_surcharges[feriado].multiplier
  × client_types[tipo_cliente].multiplier
  − promos_aplicables.descuento
```

El orden importa: surcharges de origen se SUMAN antes de aplicar
multiplicadores. Los multiplicadores se componen (multiplican entre
sí). Las promos se restan al final.

## Versionado

Cada archivo declara:

```yaml
version: "2.0"
vigente_desde: "YYYY-MM-DD"
ultima_revision: "YYYY-MM-DD"
revisor: "Nombre del responsable"
```

Cambios a tarifas deben:
1. Bumpear `ultima_revision` con la fecha del cambio
2. Bumpear `vigente_desde` si el cambio toma efecto a futuro (no
   retroactivo)
3. Commit con mensaje claro: `chore(pricing): subir Quito↔Ambato de $15 a $17`

## Reglas duras del modelo

1. **Precios EN DÓLARES americanos**, incluyendo IVA (12% Ecuador). No
   separar IVA en este YAML — la factura lo desglosa.
2. **Precios con 2 decimales máximo** (`15.00`, `15.50`). Nada de
   `14.999...`.
3. **Recargos por origen NUNCA porcentuales** — siempre USD fijo. Más
   predecible y explicable al cliente.
4. **Multiplicadores dinámicos sí porcentuales** (1.15 = +15%). Más fácil
   de razonar.
5. **Una ruta = una entrada**. Si la ruta tiene dos sentidos con precios
   distintos (ej. Aeropuerto→Quito vs Quito→Aeropuerto), son DOS
   entradas separadas.
6. **No-existence is explicit**. Si una ruta NO se opera, no aparece.
   El loader debe devolver "ruta no disponible" sin inventar.

## Próximos pasos (Fase B y Fase C)

- **Fase B** (esta sesión): loader `libs/going-kb` que parsea estos
  YAMLs y los expone como objetos tipados.
- **Fase C** (sesión próxima): UI en admin-dashboard para editar tarifas
  desde el navegador (cambios + git commit automático).
