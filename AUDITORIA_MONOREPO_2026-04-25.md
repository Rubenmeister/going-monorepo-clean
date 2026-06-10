# Auditoría técnica exhaustiva — `Rubenmeister/going-monorepo-clean`

**Fecha:** 2026-04-25  
**Alcance:** revisión de estructura Nx, configuración TypeScript, pipelines CI/CD, seguridad y mantenibilidad del monorepo.

---

## 1) Resumen ejecutivo

El monorepo tiene una base sólida (Nx + separación por servicios/apps/libs), pero presenta **problemas estructurales de confiabilidad operativa**:

1. **El grafo de Nx no se puede construir** por una configuración inválida de `paths` en TypeScript (`@/services` con 2 destinos sin wildcard). Esto rompe comandos clave (`nx show projects`, `nx affected`, `nx report` completo).  
2. **Inconsistencia de package manager**: el repo declara pnpm como estándar, pero existen scripts/workflows que ejecutan npm, provocando warnings y deriva de comportamiento.
3. **CI/CD duplicado e inconsistente**: varios workflows se solapan (`ci.yml`, `ci-cd.yml`, `security.yml`, `security-scanning.yml`) con versiones distintas de Node y acciones, incrementando ruido y fallas intermitentes.
4. **Referencias a scripts inexistentes**: `ci-cd.yml` invoca `pnpm run test:security`, pero dicho script no existe en `package.json`.
5. **Documentación desalineada**: README declara stack/estructura/comandos que no reflejan fielmente el estado real del monorepo (por ejemplo comandos `dev:web`, `dev:api` vs scripts reales).

---

## 2) Hallazgos priorizados

## 🔴 Críticos

### C1. Nx project graph roto por alias TS inválido
- **Evidencia:** `frontend-webapp/tsconfig.json` define `"@/services": ["./src/services", "./src/app/services"]` (2 rutas sin wildcard). SWC/Nx espera 1 cuando no hay `*`.
- **Impacto:** rompe confiabilidad de `nx affected` y cualquier operación dependiente del project graph.
- **Acción recomendada (inmediata):**
  - Cambiar `@/services` a **una sola ruta** o reemplazarlo por alias con wildcard (`@/services/*`).
  - Aplicar la misma validación a otros aliases sin wildcard (hooks, utils, types, etc.) para evitar futuros bloqueos.

### C2. CI llama scripts que no existen
- **Evidencia:** `ci-cd.yml` ejecuta `pnpm run test:security`; `package.json` no contiene `test:security`.
- **Impacto:** job de seguridad fallará o quedará marcado como no confiable.
- **Acción recomendada:**
  - Crear script `test:security` real o actualizar workflow para usar comandos existentes (`pnpm audit`, `snyk`, pruebas de seguridad concretas).

## 🟠 Altos

### H1. Cuatro workflows con solapamiento funcional
- **Evidencia:** coexistencia de `ci.yml`, `ci-cd.yml`, `security.yml`, `security-scanning.yml` con objetivos similares.
- **Impacto:** ejecución redundante, costos de CI más altos, resultados conflictivos, mantenimiento complejo.
- **Acción recomendada:**
  - Consolidar en 2 pipelines: `ci.yml` (build/test/lint) + `security.yml` (SAST/SCA/secrets/container).
  - Estandarizar versiones (`actions/*@v4`, Node 20 LTS, pnpm 10).

### H2. Política de package manager inconsistente
- **Evidencia:** `.npmrc` declara que pnpm es el único permitido, pero hay scripts/workflows usando npm (`npm install`, cache npm, etc.).
- **Impacto:** lockfile drift, warnings repetitivos, resultados distintos local vs CI.
- **Acción recomendada:**
  - Migrar TODO a pnpm (`pnpm install --frozen-lockfile`, cache pnpm).
  - Eliminar opciones legacy incompatibles con npm o documentarlas estrictamente si se conservan.

### H3. tsconfig Expo base no resuelta en apps móviles
- **Evidencia:** warnings en `mobile-user-app/tsconfig.json` y `mobile-driver-app/tsconfig.json` al extender `expo/tsconfig.base` sin resolución disponible en el entorno actual.
- **Impacto:** ruido en tooling, riesgo de typecheck parcial en CI/local.
- **Acción recomendada:**
  - Confirmar dependencia Expo/CLI instalada en workspace correcto.
  - Añadir validación de `tsconfig` en CI móvil para detectar regressions.

## 🟡 Medios

### M1. README no refleja estado real del monorepo
- **Evidencia:** comandos y arquitectura documentados no coinciden completamente con scripts/estructura actuales.
- **Impacto:** onboarding lento y errores de ejecución para nuevos contribuidores.
- **Acción recomendada:**
  - Ajustar README a comandos reales (`dev:webapp`, `dev:admin`, etc.).
  - Añadir sección “estado verificado” con fecha y matriz de comandos válidos.

### M2. Deuda técnica explícita en código crítico
- **Evidencia:** TODO sin cerrar en middleware de firma de requests inter-servicio y en capa API frontend corporativa.
- **Impacto:** riesgo de seguridad e inconsistencia funcional.
- **Acción recomendada:**
  - Convertir TODOs críticos a issues con SLA y owner.
  - Priorizar firma HMAC entre servicios y endurecimiento de clientes API.

---

## 3) Plan de remediación propuesto (30 días)

## Semana 1 (estabilización)
1. Corregir aliases TS que rompen SWC/Nx.
2. Hacer pasar `nx graph` y `nx affected -t test,lint,build` en CI.
3. Corregir o eliminar `test:security` inexistente en workflows.

## Semana 2 (consolidación CI)
1. Unificar workflows duplicados.
2. Estandarizar Node 20 + pnpm 10 + `--frozen-lockfile`.
3. Introducir matriz selectiva por tipo de proyecto (web, backend, mobile).

## Semana 3 (hardening)
1. Cerrar TODO de firma HMAC inter-servicios.
2. Añadir policy checks (secret scanning + branch protection + required checks).
3. Definir baseline de vulnerabilidades (high/critical = bloqueo).

## Semana 4 (developer experience)
1. Actualizar README y runbooks.
2. Agregar dashboard de salud (build success, flakiness, coverage).
3. Publicar guía única de convenciones Nx/TS alias.

---

## 4) Métricas objetivo

- **Project graph Nx:** 100% construible en local y CI.
- **Flakiness CI:** < 2% semanal.
- **Tiempo de pipeline PR:** < 12 min para cambios no móviles.
- **Incidencias por configuración tooling:** reducción > 80% en 1 mes.
- **Cobertura de documentación operativa:** 100% de comandos de README validados en CI.

---

## 5) Checklist de acciones rápidas (quick wins)

- [ ] Fix inmediato de `@/services` (sin wildcard con múltiples targets).  
- [ ] Definir `test:security` o eliminar su invocación.  
- [ ] Consolidar workflows duplicados.  
- [ ] Migrar workflows que usan npm → pnpm.  
- [ ] Refrescar README con comandos reales y estructura actual.  
- [ ] Abrir issue para cierre de TODO de firma HMAC inter-servicio.

