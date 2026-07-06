# Motor de Tarifas (Rate Engine) — Especificación técnica

> Estado: **DRAFT para revisión de Rubén** · 2026-07-05
> Objetivo de esta spec: acordar arquitectura, modelo de datos y plan ANTES de
> tocar código. Es la fuente de verdad de precios — de-riesgar primero.

---

## 1. Problema (por qué existe)

Hoy el precio se calcula/guarda en **~5 lugares**, y las reglas que quieres editar
en vivo **ya existen pero están hardcodeadas** en `libs/pricing/src/lib/pricing.service.ts`:

| Regla (hoy hardcodeada) | Dónde | Valor actual |
|---|---|---|
| Recargo hora pico mañana 06–09 | `getDynamicSurchargeRate` | privado +15% / compartido +8% |
| Recargo hora pico tarde 17–20 | idem | +15% / +8% |
| Recargo noche 22–05 | idem | +20% / +10% |
| Recargo fin de semana | idem | +10% / +5% |
| Recargo feriado nacional | `isEcuadorHoliday` + idem | +25% / +12% |
| Recargo corporativo/agencia | `getClientSurchargeRate` | +25% |
| Recargo por zona de Quito | `QUITO_ZONE_SURCHARGE` | centro/sur +$1, valles +$2, aeropuerto +$15 |
| Recargo origen | `originSurcharge` | +$5 |
| Asiento delantero exclusivo | `CARPOOL_SEATING.frontSeatSurcharge` | +$3 |
| Multiplicador por tier | `TIER_MULTIPLIER` (service-tier.ts) | confort/premium/empresa |
| Base por km/min/platform-fee | `RATES` | transport base $2.5, $0.55/km, 20% |

Y la **tabla base de tarifas** vive duplicada en:
`fares.ts` (`FARES.shared`), `excel-fares.ts` (`EXCEL_FARES`, generado por
`scripts/import-fares.py` desde el Excel del founder), matriz del asistente,
`Fare` de transport y el mirror móvil.

**Consecuencia:** cambiar UN precio o UNA regla = editar código + rebuild + deploy
de varios servicios. Eso causó el whack-a-mole de "precio distinto entre pantallas".

---

## 2. Objetivo (qué entrega el motor)

> "Poner una tarifa = un solo lugar, sin deploy, sin revisar varios puntos.
> Automatizar en vez de parchar." — Rubén

- **Base en Atlas** (editable en vivo): tablas de tarifas versionadas + reglas con
  vigencia y prioridad (día / ventana horaria / feriado / promo / por conductor).
- **UN servicio runtime** que todos consultan: `POST /price(...)` → **precio + desglose
  + qué lista y qué reglas aplicaron** (auditable).
- **Todos** (webapp, móvil, transport, payment, asistente) lo consultan en vivo →
  nadie guarda copias → **muere la divergencia**.
- **Panel admin**: editar/importar tablas + activar/desactivar reglas EN VIVO.

**No-goals (lo que NO cambia):**
- No cambia ningún precio real — F1 exige **paridad exacta** con hoy (mismos números).
- No toca loyalty/puntos (los descuentos por puntos siguen en loyalty-service).
- No agrega infra fuera de la stack autorizada (Cloud Run + Atlas + Redis).

---

## 3. Arquitectura

```
                         ┌────────────────────────────┐
   webapp / móvil ─────► │  pricing-service (Cloud Run) │ ──► Atlas (rate_*)
   transport-service ──► │  POST /price                 │ ──► Redis (caché)
   payment-service ────► │  GET/PUT reglas y listas     │
   asistente (voice) ──► │  motor de evaluación         │
                         └────────────────────────────┘
                                     ▲
                         admin panel (empresas/admin) — edita en vivo
```

- **Servicio dedicado** `pricing-service` (NestJS, Cloud Run us-central1, VPC
  connector `going-connector`, secret `MONGO_URL-prod` + `redis-url`). Decisión abierta
  §11: dedicado vs endpoint en transport-service. Recomendación: **dedicado** (desacopla
  precios de transporte; lo consultan servicios que no son de transporte, ej. payment y
  el asistente).
- **Caché**: el servicio carga la lista activa + reglas en memoria al arrancar y las
  refresca por Redis pub/sub cuando el panel edita (invalidación inmediata) + TTL de
  seguridad (60s). Los consumidores cachean respuestas de `/price` por
  (ruta+bucket-de-hora) unos segundos.
- **`libs/pricing` NO se borra**: queda como (a) motor de referencia para tests de
  paridad y (b) fallback si el servicio está caído (los consumidores degradan al cálculo
  local). Ver §10.

---

## 4. Modelo de datos (Atlas, db `going-pricing` o `going-transport`)

### 4.1 `rate_fare_lists` — tablas de tarifas versionadas, UNA POR SERVICIO

> **Refinamiento (Rubén 5-jul)**: la razón de tener VARIAS listas es que **cada
> servicio tiene precios diferentes** — compartido, privado, empresas. Por eso
> cada lista lleva un campo `service` y hay **una activa POR servicio** (las tres
> activas a la vez, no una sola global). `activate` retira solo las del MISMO
> servicio. El motor elige la lista según el viaje:
>   - `shared_seat`/`airport` → lista `compartido` (tabla `shared`, por asiento).
>   - `intercity_private` público → lista `privado` (tabla `privateFares`, por vehículo).
>   - `intercity_private` corporativo/agencia → lista `empresas` (tabla `privateFares`).
> Seed inicial (paridad): compartido = Excel `shared`; privado = Excel `private`;
> empresas = privado ×1.25 (recargo corporativo actual), luego editable aparte.
> ⚠️ Para que los consumidores USEN las listas de privado/empresas, transport debe
> pedir al motor el PRECIO privado completo (hoy transport pide solo la base
> compartida y deriva privado/corporativo localmente) — es el paso de F2c.

```jsonc
{
  "_id": "...",
  "name": "Privado 2026-07 (Excel founder)",
  "service": "compartido",        // compartido | privado | empresas | urbano | envio
  "version": 3,
  "active": true,                 // UNA activa POR service (la que sirve /price)
  "source": "excel-import",       // | "manual"
  "importedAt": "2026-07-04T...",
  "createdBy": "ruben",
  // Tarifa por asiento compartido por par de ciudades (clave "origen-destino"):
  "shared":  { "ibarra-quito": 15, "aeropuerto-ibarra": 20, "ambato-quito": 15, ... },
  // Precio privado por par + vehículo (opcional; si falta se deriva de shared):
  "private": { "ibarra-quito": { "suv": 45, "van": 70 }, ... },
  // Config global antes hardcodeada en RATES:
  "rates": {
    "transport": { "baseFare": 2.5, "perKm": 0.55, "perMinute": 0.1, "platformFeePct": 0.2 },
    "shared":    { "baseFare": 1.5, "perKm": 0.35, "perMinute": 0.08, "platformFeePct": 0.2 },
    "envio":     { "baseFare": 3.0, "perKm": 0.45, "perKg": 0.5, "platformFeePct": 0.18 }
  },
  "zoneSurcharge":     { "quito_norte": 0, "quito_centro": 1, "quito_sur": 1, "valles": 2, "aeropuerto": 15 },
  "originSurcharge":   5,
  "frontSeatSurcharge": 3,
  "tierMultiplier":    { "confort": 1.0, "premium": 1.x, "empresa": 1.x },
  "envioUrbanFixed":   { "small": 8, "medium": 12, "large": 15 },
  "envioIntercityTiers": [ {"maxKg":10,"price":10}, {"maxKg":20,"price":15}, {"maxKg":999,"price":20} ]
}
```
Importar = ejecutar el import del Excel del founder → inserta una nueva versión con
`active:false`; el panel la **activa** cuando se valida (permite rollback a la anterior).

### 4.2 `rate_rules` — reglas con condición, efecto, vigencia y prioridad

```jsonc
{
  "_id": "...",
  "name": "Recargo noche privado",
  "active": true,
  "priority": 100,                 // orden de resolución (menor primero)
  "validFrom": null, "validTo": null,   // ciclo de vida de la regla (null = siempre)
  "scope": {                        // CUÁNDO aplica (todos opcionales = comodín)
    "serviceTypes": ["transport", "intercity_private"],
    "modes": ["privado"],
    "routeClasses": ["urban", "intercity"],
    "segments": ["public"],
    "vehicleTypes": null,
    "origin": null, "destination": null
  },
  "condition": {                    // se cumple para aplicar el efecto
    "type": "time_window",          // time_window | day_of_week | date_range | holiday | promo_code | always
    "fromHour": 22, "toHour": 5     // (params según type)
  },
  "effect": {
    "type": "surcharge_rate",       // surcharge_rate | multiplier | flat_add | flat_override
    "value": 0.20,
    "appliesTo": "base"             // base | total (semántica de acumulación)
  }
}
```

Ejemplos que cubren lo de hoy:
- **Feriado**: `condition:{type:'holiday', calendar:'EC'}`, `effect:{surcharge_rate, 0.25}`.
- **Promo**: `condition:{type:'promo_code', code:'GOING10'}`, `effect:{multiplier, 0.90}`, `validTo:'2026-08-01'`.
- **Por conductor** (como alojamientos): `scope:{providerId:'drv-123'}`, `effect:{flat_override, 48}`,
  con tope validado contra la lista (cap ±X%). *Capacidad del modelo; apagada para el
  lanzamiento (ver [[going-pricing-service-rules]]).*

---

## 5. Contrato del endpoint

```
POST /price
{
  "serviceType": "intercity_private" | "shared_seat" | "urban_ride" | "airport" | "envio",
  "mode": "privado" | "compartido",
  "origin": "ibarra", "destination": "quito",     // claves de ciudad (o coords → clasifica)
  "vehicleType": "suv", "tier": "confort",
  "dateTime": "2026-07-06T14:00:00Z",
  "segment": "public" | "agency" | "corporate",
  "distanceKm": 12.3, "durationMinutes": 25,       // para urbano/envío
  "seats": 1, "frontSeat": false, "quitoZone": "aeropuerto",
  "promoCode": "GOING10", "providerId": null,
  "weightKg": 8                                      // para envío
}
→ 200
{
  "total": 20.00, "currency": "USD",
  "base": 20.00,
  "adjustments": [
    { "ruleId": "...", "name": "Recargo noche privado", "type": "surcharge_rate", "value": 0.20, "amount": 4.00 }
  ],
  "platformFee": 4.00, "providerAmount": 16.00,
  "listVersion": 3,
  "breakdown": { "basePrice": 20, "timeSurchargeRate": 0.20, "originSurcharge": 0 }
}
```

`breakdown` reproduce los campos que hoy devuelve `FareBreakdown` para no romper a los
consumidores que los leen.

---

## 6. Motor de evaluación (orden — debe reproducir la fórmula actual EXACTA)

Para paridad con `applyDynamicPricing` / `calcTransport` / `calcCarpoolSeats`:

1. **Base**: por par de ciudades (`shared[o-d]` / `private[o-d][veh]`) o por distancia
   (`rates[serviceType]: base + km·perKm + min·perMinute`) según serviceType/routeClass.
2. **Reglas** aplicables (scope match + condición true + dentro de vigencia + activas),
   ordenadas por `priority`. Los `surcharge_rate` de tiempo y día se **suman** entre sí
   (igual que hoy: `1 + surchargeTime + surchargeClient`); dentro de "día" gana el mayor
   (feriado > fin de semana) — se modela con prioridad + un flag `pickMaxWithinGroup`.
3. **Segmento** (corporate/agency +25%) como regla `surcharge_rate` de scope `segment`.
4. **Tier** (`tierMultiplier`) y recargos fijos (`zoneSurcharge`, `originSurcharge`,
   `frontSeatSurcharge`).
5. Fórmula final idéntica a hoy:
   `total = round(base × (1 + Σ surcharge_rates) × (1 − discount)) + Σ flat_add`
6. **Platform fee**: `round(total × platformFeePct)` → `providerAmount = total − fee`.

> Nota: hoy **compartido programado** usa `getFare` FIJO (sin surge); **privado inmediato**
> usa `calcIntercityFare` (con surge). El motor preserva esa diferencia vía scope
> (reglas de tiempo solo aplican a `mode:privado` / `serviceType:urban_ride`, no a
> `shared_seat`). Esto se congela con tests de paridad (§10).

---

## 7. Panel admin (F3)

En `admin.goingec.com` (o empresas): 
- Ver/editar la lista activa (tabla de pares de ciudad), importar Excel (sube versión
  nueva → activar/rollback).
- CRUD de reglas: crear "Recargo noche", "Promo Fin de Semana", activar/desactivar,
  vigencia. Preview: "¿cuánto costaría Ibarra→Quito el sábado 8pm?" (llama `/price`).
- Todo escribe Atlas + publica invalidación por Redis → efecto inmediato, sin deploy.

---

## 8. Plan de migración de consumidores (F2)

| Consumidor | Hoy | Migración |
|---|---|---|
| **transport-service** (`unified-search`, `scheduled-trip`) | `getFare`, `calcIntercityFare`, `calcCarpoolSeats` | cliente interno `PricingClient.price(...)`; fallback a `libs/pricing` si el svc responde 5xx/timeout |
| **payment-service** (`pricing.service`, `fare-engine`) | cálculo propio | idem |
| **customer-support / voice** (asistente) | `knowledge-base/fares` | `get_quote` tool → `/price` |
| **webapp** (`fareCalculator` client-side) | cálculo local instantáneo | llama `/price` (con snapshot cacheado como fallback instantáneo/offline) |
| **móvil** (mirror) | cálculo local | idem que webapp |

Migración **incremental y reversible**: empezar por transport `/search` + payment (los
que cobran), validar paridad en prod, luego asistente, luego clientes. Cada consumidor
mantiene el fallback local hasta confirmar estabilidad.

---

## 9. Fases y entregables

- **F1 — Fundación (esta sesión o la próxima)**: `pricing-service` scaffold + colecciones
  Atlas + `POST /price` con **paridad exacta** + import del Excel a `rate_fare_lists` +
  deploy. Entregable verificable: `/price` devuelve los MISMOS números que hoy para un set
  dorado de casos.
- **F2 — Migración**: transport + payment consultan `/price` (con fallback). Divergencia
  empieza a morir donde más importa (el cobro).
- **F3 — Panel en vivo**: editar tablas + reglas sin deploy.
- **F4 — Reglas ricas**: día/hora/feriado/promo **editables** + precio por conductor
  (con topes). Migrar el resto de reglas hardcodeadas a `rate_rules`.

---

## 10. Paridad (cómo garantizar mismos precios)

Riesgo #1: que el motor cobre distinto que hoy. Mitigación:
1. **Golden set**: correr `libs/pricing` actual sobre ~200 casos representativos
   (rutas × modos × horas × segmentos × feriado/finde) y snapshotear los outputs.
2. El motor F1 debe pasar ese golden set **al centavo**. Test automatizado en CI.
3. En F2, cada consumidor migrado compara `/price` vs cálculo local por un tiempo
   (shadow mode: loguea si difieren) antes de confiar solo en el servicio.

---

## 11. Decisiones abiertas (para Rubén)

1. **Servicio dedicado `pricing-service` vs endpoint en transport-service.**
   Recomiendo dedicado (lo consultan payment y el asistente, no solo transporte).
2. **Cotización client-side (webapp/móvil)**: ¿`/price` en vivo, o snapshot sincronizado
   + confirmación en vivo al reservar? Recomiendo snapshot para respuesta instantánea +
   `/price` autoritativo al confirmar (el backend ya re-cotiza en `POST /rides/request`).
3. **Precio por conductor**: ¿modelarlo ya (apagado) o diferir del todo?
4. **Fuente base única**: hoy `getFare` lee `FARES` (fares.ts) pero el Excel genera
   `EXCEL_FARES` (excel-fares.ts) → confirmar que la lista importada sale del **Excel del
   founder** (fuente oficial) y que `fares.ts` se retira.
5. **DB e identidad**: ¿db `going-pricing` nueva o reutilizar `going-transport`? ¿nombre
   del servicio / identidad Quichua?

---

## 12. Relacionado
- [[going-rate-engine-vision]] · [[going_pricing_update_guide]] · [[going-pricing-service-rules]]
- Código actual: `libs/pricing/src/lib/pricing.service.ts`, `fares.ts`, `excel-fares.ts`,
  `service-tier.ts`, `scripts/import-fares.py`.
