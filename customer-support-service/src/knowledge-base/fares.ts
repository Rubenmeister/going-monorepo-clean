// Source of truth movido a libs/pricing/src/lib/fares.ts. Este archivo se
// mantiene como re-export para no romper imports legacy de
// './knowledge-base/fares' dentro de customer-support-service.
//
// Cuando todos los imports migren a `from 'pricing'`, este archivo se borra.
export { FARES, getFareTable } from 'pricing';
