# ⚠️ DEPRECATED: Corporate Portal

**Fecha de Deprecación:** 2026-04-20  
**Fase:** Consolidación - Fase 1  
**Estado:** ARCHIVED

## ¿Qué pasó?

El directorio `apps/corporate-portal/` fue **consolidado** en `frontend-webapp/src/app/empresas/` como parte de la Fase 1 del proyecto "Empresas" de Going.

## Migración

- ✓ Código movido a: `frontend-webapp/src/app/empresas/`
- ✓ Librerías movidas a: `frontend-webapp/src/lib/empresas/`
- ✓ Componentes movidos a: `frontend-webapp/src/components/empresas/`
- ✓ Tests reubicados en: `frontend-webapp-e2e/src/empresas-smoke.spec.ts`

## Documentación de Referencia

- **Plan técnico completo:** `docs/EMPRESAS_FASE1_PLAN.md`
- **Documentación Empresas:** `docs/empresas.md`
- **Histórico de cambios:** Ver rama `feature/empresas-fase1-migracion`

## ¿Qué Hacer Si Necesitas Código Antiguo?

1. **Para desarrollo:** Usa `frontend-webapp/src/app/empresas/`
2. **Para historial:** `git log --follow -- apps/corporate-portal/`
3. **Para rollback:** Revert de commit de migración (no recomendado, mejor relanzar desde Empresas)

## URLs Antiguas

| Ruta antigua | Ruta nueva | Estado |
|---|---|---|
| `/corporate` | `/empresas` | ✓ Migrada |
| `/corporate/auth/login` | `/empresas/auth/login` | ✓ Migrada |
| `/corporate/dashboard` | `/empresas/panel` | ✓ Migrada |
| `/corporate/bookings` | `/empresas/viajes` | ✓ Migrada |
| `/corporate/approvals` | `/empresas/aprobaciones` | ✓ Migrada |
| `/corporate/invoices` | `/empresas/facturacion` | ✓ Migrada |
| etc. | `/empresas/*` | ✓ Migrada |

## Decisiones Futuras

- **Fase 1 (actual):** Mantener `apps/corporate-portal/` como referencia.
- **Fase 2:** Eliminar directorio después de validación en producción.
- **Fase 3+:** Código vive únicamente en `frontend-webapp`.

## Contacto

Para preguntas sobre la migración:
- Ver `docs/EMPRESAS_FASE1_PLAN.md` sección "Riesgos" y "TODOs"
- Reunión con Rubenmeister (product owner)

---

**Do not use this directory for new development.**  
**All new work goes in frontend-webapp/src/app/empresas/**
