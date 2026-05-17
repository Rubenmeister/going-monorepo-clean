// El código real vive ahora en `libs/pricing` para que frontend + mobile
// puedan importar las mismas reglas y la cotización al usuario coincida con
// el cobro al final. Este archivo se mantiene como re-export para no romper
// los imports relativos `./pricing.service` y `../application/pricing.service`
// que ya existían en payment-service.
//
// Cuando todos los consumers migren a `import { ... } from 'pricing'`, este
// archivo se puede borrar.

export * from 'pricing';
