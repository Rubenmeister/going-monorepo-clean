# Plan — Subir los agentes de Going a "experto autónomo"

> Portar a Going (Yachay + Wayra + agentes) las 3 piezas de inteligencia de
> producto prototipadas en PYMEX/MyCortex: **constitución curada**, **playbooks de
> dominio** y **atribución/aprendizaje automático**. Más un **brief** de decisión.
>
> Principio rector: **NO reconstruir el chasis** — Going ya tiene lo difícil
> (world-model, razonamiento LLM, orquestador con gobernanza, auditoría,
> verificador, 7 agentes). Solo le falta el criterio experto que cierra el círculo.
> Infra mínima (Cloud Run + Mongo + Scheduler, nada nuevo). Cost-aware: los agentes
> están dormidos a propósito para no gastar en GCP; el rollout respeta eso.

## Lo que Going YA tiene (se reutiliza, no se toca)

- **Pacha** (`cerebro-service`): world-model, `WorldSnapshot` cada 10 min, con historia.
- **Yachay** (`mycortex-service`): loop de razonamiento LLM (Claude Sonnet 4.5),
  produce "intenciones", memoria episódica + rollup semanal. `reasoning/reasoning-loop.service.ts`,
  `reasoning/prompt-builder.service.ts`.
- **Wayra** (`orchestrator-service`): rules-engine + niveles de seguridad Cat 1/2/3
  (`decision/safety-levels.ts`), allowlist con verificación (`autonomous-allowlist.ts`),
  **action-verifier + drift-detector**, aprobación por Telegram, audit log 90 días
  (`orchestrator_decisions`).
- **Chaski** (`agent-bridge-service`): despacho a Cloud Run Jobs.
- **7 agentes**: Rumi/Inti/Killa/Sumak/Sacha/Quinde/Kuntur.

## Alcance — es UNA capa para toda la empresa, no por app

El cerebro razona sobre TODA Going porque Pacha agrega en un solo `WorldSnapshot`
las señales de los 7 agentes. Por eso: UNA constitución + UNA librería de playbooks
compartida + UN loop de atribución sirven a todos los dominios. Se construye una vez.

Cobertura por dominio (estado real hoy):
- **Operaciones (Rumi)** — 🟢 fuerte. El área que más gana en "más info + mejores decisiones".
- **Finanzas (Inti)** — 🟢 fuerte (cobros, fraude, payouts).
- **Ventas / demanda** — 🟡 repartido entre Rumi + Sumak + pricing. Es donde vive
  "ventas mejora" (reactivación de pasajeros, bonos de zona, pricing), PERO el agente
  de marketing (Sumak) está a medias → **reforzarlo + darle playbooks** es requisito.
- **Contenido (Killa)** — 🟢 fuerte.
- **Móvil (Quinde) / Frontend (Kuntur)** — 🟡 salud/uptime (calidad, no ventas).
- **B2B / empresas** — 🟡 dominio NUEVO a sumar con una LENTE PROPIA (Rubén 13-jul):
  Empresas es una extensión dentro de la PC del cliente para **reservar solo, sin
  llamar a Going** (autoservicio). Su capa inteligente **NO sirve a la empresa**
  (a diferencia de PYMEX, que sirve al cliente) — **sirve a GOING**: observa los
  pedidos corporativos y nos da la data para (a) impulsar ventas en esa empresa
  (promos/incentivos a medida) y (b) **replicar lo que funcionó en otras empresas**.
  Wiring: `corporate-service` emite señales de reservas al cerebro (publishAgentRunEvent,
  como los otros agentes) → playbook de **crecimiento B2B** (promo por caída de uso,
  paquete recurrente por patrón de ruta, upsell por horario) → jugadas al equipo de
  Going (brief/Telegram), NO a la empresa → **replicación cross-empresa = el pilar de
  "sabiduría de otros", ahora B2B** (el moat corporativo). El producto Empresas en sí
  ya está ~95% (ver docs/GOING-EMPRESAS — embudo + menores en curso).

Límite honesto: el cerebro NO edita las apps (webapp/móvil). Mejora DECISIONES y
ejecuta ACCIONES (asignación, cobros, reactivación, bonos) y lo resume en el brief.
La mejora llega a las apps de forma indirecta, no cambiando sus pantallas.

Regla de extensión: un dominio queda cubierto cuando tiene (1) un agente que le
alimenta señales a Pacha, (2) playbooks en `libs/going-playbooks`, y (3) un camino
de acción vía Wayra/Chaski. Sumar un dominio = completar esas 3 cosas.

## Las 3 piezas que faltan (+ brief)

### A. Constitución curada (hoy: un solo system prompt global)

**Hoy:** el único contexto declarado por humanos es `cortex_config.systemPrompt`
(un doc en Mongo, editable desde admin-dashboard). El resto es inferido del snapshot.

**Upgrade:** una **constitución de negocio** estructurada y editable, separada del
system prompt (que es el ROL del cerebro). Recoge lo que hoy está disperso y
hardcodeado (modelo de operación de viajes, reglas de precio, zonas rojas de
seguridad, reglas de servicio, qué NO hacer) como contexto AUTORITATIVO, en
secciones, inyectado en cada decisión del cerebro.
- **Dónde:** nueva colección Mongo `business_context` (markdown por secciones) +
  `context_proposals`; inyección en `prompt-builder.service.ts` (un `buildContextBlock`
  junto al systemPrompt + snapshot + memoria); pantalla de edición en admin-dashboard.
- **Loop bidireccional:** el cerebro/agentes proponen añadidos desde patrones
  observados; humano acepta/rechaza en el panel (igual que PYMEX `context_proposals`).
- **Nota:** el cerebro de Going es GLOBAL (una empresa) → UNA constitución, no
  multi-tenant. Más simple que PYMEX.
- **Leverage:** el prompt cache de Anthropic ya está en uso → la constitución se
  cachea, costo marginal bajo.

### B. Playbooks de dominio (hoy: umbrales hardcodeados dispersos)

**Hoy:** la "expertise" son umbrales sueltos en cada agente ($70/día, 20% comisión,
reglas de fraude en `financial-agent/src/ai.analysis.ts`) + las reglas de seguridad
de Wayra. No hay librería de criterio experto de dominio.

**Upgrade:** una **librería de playbooks** curada (patrón PYMEX `playbooks.ts`, pero
para movilidad/ops/finanzas), como paquete compartido `libs/going-playbooks`:
- **Ops (Rumi):** oferta/demanda de conductores (sin-conductor → jugada bono-zona con
  principio/táctica/efecto), no-shows, jugadas de zona roja/seguridad.
- **Finanzas (Inti):** playbook de fraude (formalizar el ya existente), cobranza,
  respuesta a contracargos.
- **Marketing (Sumak):** captación/retención de conductores, **reactivación de
  pasajeros** (win-back, como PYMEX pero para riders), incentivos por zona.
- Cada jugada: condición-gatillo, principio (por qué), táctica, **nivel de seguridad**
  (Cat 1/2/3), efecto esperado.
- **Wiring:** cuando un agente detecta una situación, elige la jugada y la PROPUESTA
  lleva principio/táctica/efecto → las intenciones/decisiones dejan de ser "métrica X
  cruzó umbral" y pasan a ser expertas. El LLM personaliza; la estrategia sale del
  playbook. El nivel de seguridad de la jugada **unifica** los umbrales dispersos con
  el rules-engine de Wayra (`decision/rules-engine.service.ts`).

### C. Atribución / aprendizaje automático (hoy: outcome manual, agentes sin memoria)

**Hoy:** existe el andamiaje (intention `outcome`, action-verifier, drift-detector)
pero el outcome se marca a MANO y los agentes corren sin memoria de eficacia.

**Upgrade:** cerrar el loop AUTOMÁTICAMENTE aprovechando lo que ya existe:
- El **action-verifier + drift-detector** ya miden si la acción movió la métrica
  (usan la historia del WorldSnapshot). Cablear su resultado para **setear
  `intention.outcome` automáticamente** (effective/ineffective) vía
  `mycortex.client.recordOutcome()` — sin humano.
- **Aprendizaje por jugada:** agregar outcomes por `play_id` (como los "learnings"
  de PYMEX) → "qué jugadas le funcionan a Going" → (1) reinyectar en el prompt de
  Yachay para **priorizar jugadas que históricamente funcionaron**, (2) alimentar el
  brief. Extiende el rollup de memoria existente.

### D. Brief de decisión (hoy: reporte de estado a Telegram)

**Hoy:** Yachay ya reporta a Telegram cada ciclo (entrega VIVA). Es operativo/estado.

**Upgrade:** convertir ese reporte en un **brief de decisión** (patrón PYMEX):
pulso del negocio + lo poco que importa + qué funcionó (aprendizaje) + empujón a
decidir. Bajo esfuerzo: la entrega ya existe (`TelegramReporterService`).

## Fases (cost-aware, seguras)

- **Fase 0 — Reactivar en modo sombra.** Prender el razonamiento de Yachay
  (`MYCORTEX_REASONING_ENABLED`) en modo **report-only** (ejecución del orquestador
  sigue gated: `ORCHESTRATOR_EXECUTE_ENABLED=false` / `ORCHESTRATOR_MAX_AUTO_LEVEL=0`).
  Brain con min-instances 0. Observar costo y calidad de intenciones. Sin riesgo.
- **Fase 1 — Constitución curada** (mayor leverage, menor riesgo: solo enriquece el
  prompt). Mongo + inyección + panel + loop de propuestas.
- **Fase 2 — Playbooks de dominio** + wiring en agentes + unificación con el
  rules-engine/safety de Wayra.
- **Fase 3 — Atribución automática**: verifier → outcome auto → aprendizaje por jugada
  → prompt + brief.
- **Fase 4 — Brief de decisión** (rápida, la entrega ya existe).
- **Fase 5 — Subir autonomía gradualmente**: `ORCHESTRATOR_MAX_AUTO_LEVEL` 0→1→2,
  Cat 3 siempre con aprobación humana. Verificar con el audit log + drift-report.

## No-goals (respetar CLAUDE.md)

- NADA de GKE/k8s/VPC extra/DB nueva. Solo Cloud Run + Mongo Atlas + Scheduler.
- No reinventar auditoría, verificación ni aprobación — se reusa la de Wayra.
- Mantener el control de costo: cerebro min-instances 0, ejecución gated durante el
  rollout, subir autonomía por niveles con verificación.

## Orden recomendado de arranque

Fase 0 (reactivar en sombra, medir) → Fase 1 (constitución). Son las de mayor
relación valor/riesgo y no requieren tocar la ejecución. El resto se encadena.
