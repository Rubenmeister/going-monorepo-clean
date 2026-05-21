# pricing

Source of truth para el cálculo de tarifas de la plataforma Going.

## Contiene

- **Recargos dinámicos** (hora pico, nocturno, feriados Ecuador calculados de Pascua)
- **Zonas de Quito** + recargos por destino (Centro/Sur/Valles/Aeropuerto)
- **Rutas compartidas oficiales Going** (Sierra Centro, Costa, Sierra Norte)
- **PricingService**: orquestador que calcula tarifa final por tipo de servicio
  (transport/shared/shared_route/envio/accommodation/tour/experience)

## Por qué lib compartida

Antes vivía en `payment-service/src/application/pricing.service.ts`. Mover a
lib permite que **frontend (cotización), backend (cobro) y mobile (estimate)
usen el MISMO código** — eliminamos la causa #1 de quejas "el precio que vi
no es el que me cobraron".

## Uso

```ts
import { PricingService, applyDynamicPricing } from 'pricing';

// Como clase (backend NestJS — DI automática):
constructor(private readonly pricing: PricingService) {}

// Como funciones puras (frontend / cualquier contexto):
const { adjustedPrice } = applyDynamicPricing({
  basePrice: 25,
  mode: 'privado',
  dateTime: new Date(),
  clientSegment: 'public',
});
```

## Reglas resumidas

| Recargo | Privado | Compartido |
|---|---|---|
| Hora pico (6-9, 17-20) | +15% | +8% |
| Noche (22-5) | +20% | +10% |
| Fin de semana | +10% | +5% |
| Feriado nacional EC | +25% | +12% |
| Agency / Corporate | +25% | +25% |

| Zona destino Quito | Recargo |
|---|---|
| Norte | $0 |
| Centro | $1 |
| Sur | $1 |
| Valles | $2 |
| Aeropuerto | $15 |

Las reglas se suman: `precio = base × (1 + recargoTiempo + recargoCliente)
× (1 − descuento) + recargoOrigen`.
