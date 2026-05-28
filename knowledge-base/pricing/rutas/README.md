# Rutas y tarifas base — schema v2

## Estructura

Una carpeta por **corredor** para que sea fácil editar:

```
rutas/
├── README.md            ← este archivo
├── sierra-norte.yaml    ← Quito ↔ Cayambe/Otavalo/Ibarra/Tulcán
├── sierra-centro.yaml   ← Quito ↔ Latacunga/Ambato/Riobamba/Baños
└── costa-noroeste.yaml  ← Quito ↔ Santo Domingo/El Carmen/La Concordia
```

A futuro se agregan: `sierra-sur.yaml` (Cuenca, Loja), `costa-sur.yaml`
(Guayaquil, Salinas), `amazonia.yaml` (Tena, Puyo), `interurbano-cortos.yaml`
(viajes entre cantones cercanos).

## Estructura de cada entrada (schema v2)

```yaml
- id: quito_cn_to_ambato         # único en el monorepo, snake_case
  origin:
    canton: quito                # match coverage.yaml
    zone: centro_norte           # match zones.yaml
  destination:
    canton: ambato
    zone: centro                 # default si no se especifica
  distance_km: 137                # opcional pero útil para auditoría
  duration_min_typical: 150       # opcional
  shared:
    suv: 15.00                    # USD, 2 decimales, IVA incluido
    suv_xl: 15.00
    van: 13.00                    # opcional si van se ofrece en compartido
  private:
    suv: 60.00                    # vehículo completo
    suv_xl: 80.00
    van: 120.00
    van_xl: 180.00
    minibus: 300.00
    bus: 350.00
  premium_suv: 70.00              # opcional
  last_updated: "2026-05-28"
  revisar: true                   # PENDIENTE confirmar con operaciones
  notas:                          # opcional — explicación humana
    - "Salidas desde terminal Ambato cada hora pico"
```

## Reglas de revisión

- **TODAS las entradas marcadas `revisar: true`** son datos migrados de
  `going-services.ts` + `FARES` pero **NO han sido validadas con
  operaciones Going**. El founder + ops deben confirmar cada una.
- Cuando una ruta se valida, **BORRAR el flag `revisar: true`** y bumpear
  `last_updated` con la fecha de validación.
- El loader (Fase B) puede loggear las consultas que devuelvan rutas con
  `revisar:true` para que sepamos cuáles son las más urgentes.

## Drift detectado (28-may-2026)

Detectado por la auditoría del Agent vs. las 3 fuentes vivas. **Ya
aplicado en este YAML según decisión del founder:**

| Ruta | FARES | going-services | Decisión Going | Aplicado |
|---|---|---|---|---|
| Quito CN → Riobamba (compartido SUV) | $17 | $20 | **$20** | ✅ |

Otros drifts pendientes de revisar viven en `REVISAR.md`.
