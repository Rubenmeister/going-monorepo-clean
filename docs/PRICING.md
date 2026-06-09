# Going App — Tabla de Precios y Rutas

> **Generado**: 2026-06-09
> 
> Fuente única: [`libs/pricing/src/lib/fares.ts`](../libs/pricing/src/lib/fares.ts).
> Para cambiar un precio o agregar/quitar una ruta:
> 1. Editar `libs/pricing/src/lib/fares.ts` (y `cities.ts` si la ciudad es nueva).
> 2. Editar el mirror manual `mobile-user-app/src/catalog/fares.ts`.
> 3. `pnpm nx build pricing && node scripts/generate-pricing-docs.js` para regenerar este archivo.
> 4. `git diff docs/PRICING.md` para revisar — commit + push + redeploy de los 4 servicios.

## 1) Viajes Compartidos — precio por pasajero

Estos son los **únicos** pares origen ↔ destino donde se ofrece servicio Compartido. Cualquier otra combinación se debe ofrecer como Privado o avisar fuera de cobertura.

| # | Origen | Destino | Precio (USD/pasajero) |
|---|--------|---------|----------------------|
| 1 | Aeropuerto Tababela | El Carmen | $35 |
| 2 | Aeropuerto Tababela | Ibarra | $20 |
| 3 | Aeropuerto Tababela | La Concordia | $35 |
| 4 | Aeropuerto Tababela | Otavalo | $18 |
| 5 | Aeropuerto Tababela | Quito | $10 |
| 6 | Ambato | Quito | $15 |
| 7 | Atuntaqui | Quito | $14 |
| 8 | Cayambe | Quito | $8 |
| 9 | El Carmen | Quito | $20 |
| 10 | Ibarra | Quito | $15 |
| 11 | La Concordia | Quito | $20 |
| 12 | Latacunga | Quito | $10 |
| 13 | Otavalo | Quito | $12 |
| 14 | Quito | Riobamba | $17 |
| 15 | Quito | Salcedo | $12 |
| 16 | Quito | Santo Domingo | $15 |
| 17 | Quito | Tabacundo | $7 |

**Total de rutas compartidas activas:** 17

## 2) Privado Aeropuerto (precio por persona, vehículo dedicado, por zona de Quito)

| Zona de Quito | Precio (USD/persona) |
|---------------|----------------------|
| norte | $20 |
| centro norte | $20 |
| sur | $25 |
| valles | $20 |
| cumbaya | $20 |
| tumbaco | $15 |

## 3) Catálogo de vehículos (capacidad y multiplicador para privado)

| Vehículo | Etiqueta | Capacidad (pax) | Multiplicador privado |
|----------|----------|-----------------|----------------------|
| suv | SUV | 4 | ×4 |
| suv_xl | SUV XL | 5 | ×5 |
| van | VAN | 7 | ×7 |
| van_xl | VAN XL | 12 | ×10 |
| minibus | Minibús | 20 | precio fijo (no multiplicador) |
| bus | Bus | 30 | precio fijo (no multiplicador) |

- **Bus precio fijo base (Quito↔Sto Domingo $15)**: $350
- **Minibús precio fijo base**: $250
- **Extensión El Carmen / La Concordia** (por persona): $5

## 4) Viajes Privados (vehículo completo) — precios derivados

Cada celda es **precio total del vehículo** para esa ruta. Derivado de la tarifa Compartido × multiplicador del vehículo (excepto Minibús y Bus que escalan desde precio base $250 / $350).

| Origen | Destino | SUV | SUV XL | VAN | VAN XL | Minibús | Bus |
|---|---|---|---|---|---|---|---|
| Aeropuerto Tababela | El Carmen | $140 | $175 | $245 | $350 | $583 | $817 |
| Aeropuerto Tababela | Ibarra | $80 | $100 | $140 | $200 | $333 | $467 |
| Aeropuerto Tababela | La Concordia | $140 | $175 | $245 | $350 | $583 | $817 |
| Aeropuerto Tababela | Otavalo | $72 | $90 | $126 | $180 | $300 | $420 |
| Aeropuerto Tababela | Quito | $40 | $50 | $70 | $100 | $167 | $233 |
| Ambato | Quito | $60 | $75 | $105 | $150 | $250 | $350 |
| Atuntaqui | Quito | $56 | $70 | $98 | $140 | $233 | $327 |
| Cayambe | Quito | $32 | $40 | $56 | $80 | $133 | $187 |
| El Carmen | Quito | $80 | $100 | $140 | $200 | $333 | $467 |
| Ibarra | Quito | $60 | $75 | $105 | $150 | $250 | $350 |
| La Concordia | Quito | $80 | $100 | $140 | $200 | $333 | $467 |
| Latacunga | Quito | $40 | $50 | $70 | $100 | $167 | $233 |
| Otavalo | Quito | $48 | $60 | $84 | $120 | $200 | $280 |
| Quito | Riobamba | $68 | $85 | $119 | $170 | $283 | $397 |
| Quito | Salcedo | $48 | $60 | $84 | $120 | $200 | $280 |
| Quito | Santo Domingo | $60 | $75 | $105 | $150 | $250 | $350 |
| Quito | Tabacundo | $28 | $35 | $49 | $70 | $117 | $163 |

## 5) Ciudades de cobertura (donde se puede pedir / dejar pasajero)

Centroide aproximado y radio operativo. Para Compartido se acepta el punto si está dentro de `radiusKm + 5 km`. Para Privado el radio operativo aplica sin buffer.

| Ciudad | Provincia/Región | radius operativo (km) | Aeropuerto |
|--------|------------------|----------------------|------------|
| Quito | Pichincha | 18 |  |
| Aeropuerto Tababela | Pichincha | 5 | ✈️ sí |
| Latacunga | Cotopaxi | 8 |  |
| Salcedo | Cotopaxi | 5 |  |
| Ambato | Tungurahua | 10 |  |
| Riobamba | Chimborazo | 10 |  |
| Cayambe | Pichincha | 6 |  |
| Tabacundo | Pichincha | 4 |  |
| Otavalo | Imbabura | 6 |  |
| Atuntaqui | Imbabura | 4 |  |
| Ibarra | Imbabura | 10 |  |
| Santo Domingo | Sto. Domingo | 12 |  |
| La Concordia | Sto. Domingo | 7 |  |
| El Carmen | Manabí | 7 |  |

## 6) Notas operativas

- **Hubs principales**: Quito (centro norte) y Aeropuerto Tababela. La gran mayoría de rutas Compartido son hub ↔ ciudad.
- **NO existe Compartido directo entre ciudades no-hub** (ej. Ambato ↔ Latacunga, Ibarra ↔ Otavalo). Para esos casos se ofrece Privado o conexión por Quito.
- **Buffer 5 km**: un pickup o drop-off puede estar hasta 5 km fuera del radio operativo de la ciudad y aún califica como Compartido. Más allá se ofrece Privado o se marca fuera de cobertura.
- **Bus y Minibús** tienen precio fijo por ruta (no se calcula con multiplicador) — se escala proporcional a la tarifa Compartido base (Quito↔Sto Domingo $15).
