# @going-platform/going-kb

**Loader y queries del Centro de Información Going.**

Esta librería lee los archivos editables del directorio `knowledge-base/`
(MD + YAML) al startup del servicio y los expone como objetos tipados.

Reemplaza las copias hardcoded de:
- `libs/pricing/src/lib/fares.ts` (tabla FARES)
- `customer-support-service/src/knowledge-base/going-services.ts` (tabla pricing + KB)
- `customer-support-service/src/knowledge-base/ecuador-cantons.ts` (cantones)

## Consumidores

| Servicio | Usa para |
|---|---|
| `customer-support-service` | Chat: cotizar viajes, info de productos, FAQs, identidad |
| `voice-call-service` | Uyari (telefónico): mismo que chat |
| `payment-service` | Cobra: cotiza precio final con recargos |
| `going-agent` (futuro) | Ops: leer estado del KB |
| `frontend-webapp` (futuro) | Mostrar tarifas estimadas en /ride |
| `mobile-user-app` (futuro) | Mostrar tarifas estimadas en BookingOptions |

## API pública

```ts
import { initKnowledgeBase, findRoute, getCanton, getProductInfo } from '@going-platform/going-kb';

// Al startup del servicio:
const kb = initKnowledgeBase({ basePath: '/app/knowledge-base' });

// Después, en runtime (en cualquier request):
const fareInfo = findRoute({
  origin:      { canton: 'quito', zone: 'centro_norte' },
  destination: { canton: 'ambato' },
  modality:    'shared',
  vehicle:     'suv',
  when:        new Date(),
  clientType:  'retail',
});
// → { basePrice: 15, finalPrice: 18.15, breakdown: [...], revisar: true }

const quito = getCanton('quito');
// → { name: 'Quito', altitude_m: 2850, attractions: [...], ... }

const sharedRideInfo = getProductInfo('viaje_compartido');
// → { description: "...", howItWorks: "...", limitations: "...", ... }
```

## Reload sin redeploy

Para v0.1: los datos se cargan al startup y se cachean en memoria. Cambios
al `knowledge-base/` requieren restart del pod (redeploy de Cloud Run).

Para v0.2 (cuando lo necesitemos): agregar un endpoint admin `/kb/reload`
que vuelva a parsear sin reiniciar.

## Validación

Para v0.1: validación básica en `loader.ts` (los archivos existen, parsean OK).

Para v0.2: schema validation con Zod o Ajv. CI bloquea PRs con KB inválido.

## Path resolution

Por defecto el loader busca `knowledge-base/` empezando desde
`process.cwd()` y subiendo hasta la raíz. Sirve para:
- desarrollo local (cwd = root del monorepo)
- Docker (cwd = /app, knowledge-base/ copiada en /app/knowledge-base)
- tests (cwd = libs/going-kb, sube hasta encontrar knowledge-base/)

Override explícito:
```ts
initKnowledgeBase({ basePath: '/custom/path' });
```
