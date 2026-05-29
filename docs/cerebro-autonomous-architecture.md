# Cerebro Autónomo Going — Arquitectura

> Mapa de referencia del sistema de decisiones autónomas de Going Ecuador.
> Actualizado al cierre del sprint del 28-may-2026.

---

## TL;DR

Going opera un sistema de 7 capas que detectan, razonan, deciden y ejecutan acciones operativas sin intervención humana. Hoy las **capas 0–3 están completas** y la **capa 4 está en modo "observación pura"**. Las capas 5 y 6 (goal-setting, self-evolution) son trabajo futuro.

**Loop end-to-end activo hoy:**

```
voice-call-service detecta spam (5+ calls/15min)
    ↓ publishSuspiciousPattern
cerebro-service ingiere anomaly
    ↓ activeAnomalies en WorldSnapshot
mycortex-service.AnomalyRulesService traduce determinísticamente
    ↓ Intention block_voice_caller urgency 0.85
orchestrator-service.MyCortexPoller la recoge (≤5min lag)
    ↓ dispatcher consulta autonomous-allowlist
agent-bridge-service ejecuta /voice/command
    ↓ HTTP Bearer auth
voice-call-service.VoiceCommandService bloquea (TTL 60min)
    ↓ action-verifier consulta /voice/metrics/active-blocks
status: 'converged'
```

**Cero humanos.** Próxima llamada del spammer recibe TwiML `<Hangup/>` con mensaje "número bloqueado temporalmente".

---

## Las 7 capas

| # | Capa | Servicio principal | Estado |
|---|------|--------------------|--------|
| 0 | Sensing | publishers en agents | ✅ Completa |
| 1 | Reasoning | `mycortex-service` | ✅ Hybrid LLM + reglas |
| 2 | Deciding | `orchestrator-service` | ✅ Completa |
| 3 | Acting | `agent-bridge-service` + verifier | ✅ Completa |
| 4 | Learning | OutcomeTrackerService | 🟡 Observa, no muta |
| 5 | Goal-setting | — | ❌ Pendiente Q3 |
| 6 | Self-evolution | — | ❌ Pendiente Q4 |

### Capa 0 — Sensing

Cada agent publica eventos al `cerebro-service` (alias Pacha) vía Pub/Sub. El cerebro mantiene un `world model` con:

- KPIs por agent (volumen, latencia, error rate)
- Anomalies activas (con TTL)
- Top proposed actions

**Publishers existentes:**
- `voice-call-service.CerebroPublisherService`:
  - `publishCallStarted`, `publishCallEnded`
  - `publishSuspiciousPattern` (5+ calls / 15 min)
  - `publishHandoffStuck` (handoff requested sin transfer > 90s)
- `customer-support-service.CerebroPublisher`:
  - Eventos de handoffs + chat metrics
- `dispatcher.service.ts` (orchestrator): self-eventos de cada Decision

**Agregar un publisher nuevo:**
1. Inyectar `CerebroPublisherService` en el service del agent
2. Llamar `publishAgentRunEvent` con `anomalies: [{ type, severity, message, data }]`
3. Verificar el `agentId` está registrado en `@going-platform/cerebro-contracts`

### Capa 1 — Reasoning (mycortex-service)

Razona sobre el snapshot del cerebro y emite Intentions. **Híbrido:**

**1.a · Reglas determinísticas** (`AnomalyRulesService`)
- Pure service, sin Mongoose ni HTTP
- Registry de reglas `{ id, matches, build }`
- Corre ANTES del LLM en cada ciclo
- Garantiza patrones críticos no dependen del modelo

**Reglas activas hoy:**
- `spammer-voice-caller`: `suspicious_call_pattern` → `block_voice_caller`
- `stale-customer-handoffs`: `high_pending_red_handoffs` → `cleanup_stale_customer_handoffs` *(publisher pendiente)*
- `voice-handoff-stuck`: `voice_handoff_stuck` → `force_handoff_voice_call` *(activo)*

**Agregar regla:**
1. Append entry al array `rules` en `anomaly-rules.service.ts`
2. Asegurar que existe la regla en `orchestrator-service/RULES` con su action
3. Si la action no está aún auto-ejecutable, agregar entry en `AUTONOMOUS_ALLOWLIST`
4. Test en `anomaly-rules.service.spec.ts`

**1.b · LLM (Claude vía Anthropic)** (`ReasoningLoopService`)
- Cron cada 5 min (throttled por `pollIntervalMin` configurable)
- Sistema prompt admin-editable vía `CortexConfigService`
- Output JSON parseado con Zod schema (`IntentionInputSchema`)
- Maneja anomalies complejas multi-señal que las reglas no cubren

Las reglas y el LLM corren en el mismo ciclo. Sus Intentions se **mergean** con el mismo `cycleId` y van al `IntentionRepository`.

### Capa 2 — Deciding (orchestrator-service)

Recibe Intentions, mapea a actions, decide ejecutar o esperar ack.

**`RULES`** (`rules-engine.service.ts`): tabla `intentType → { agent, action, safetyLevel, argsBuilder }`. Centraliza qué acción ejecutar para cada intent type.

**Safety levels:**
- **Cat 1**: auto-ejecutable (informativas, alertas)
- **Cat 2**: auto-ejecutable si en `AUTONOMOUS_ALLOWLIST` con `verifier`
- **Cat 3**: requiere ack humano vía Telegram (timeout configurable)

**`AUTONOMOUS_ALLOWLIST`** (`autonomous-allowlist.ts`): segunda capa defensiva. Solo lo que está acá puede correr autónomamente. Estructura:

```ts
{
  intentType:    'block_voice_caller',
  minUrgency:    0.7,
  verify: {
    verifierKey: 'active_voice_block_for_caller',
    direction:   'increase',
    waitMs:      10_000,
    minDelta:    1,
  },
  onVerifyFail: 'alert_only',
  notes:        'docs operativos inline'
}
```

**Gates pre-dispatch (orden):**
1. `executeEnabled` (master switch via env)
2. `safetyLevel <= maxAutoLevel` (rollout gradual)
3. `agentOverride.isPaused(agentId)` (admin UI puede pausar agents)
4. `requiresAck` para Cat 3 → Telegram
5. `findAutonomousEntry(intent.type)` → ¿está allowlisted?
6. `urgency >= minUrgency` → si no, `dormant`

Si pasa todos los gates: snapshotBefore → execute → scheduleVerification.

### Capa 3 — Acting

**`agent-bridge-service`** (Chaski): proxy HTTP entre orchestrator y agents. Registry indexa `agentId → { url, commandPath, token }`. Dispatch:

```
POST {agent.url}{commandPath}
  Authorization: Bearer {token}
  Body: { decisionId, action, payload }
```

**`action-verifier.service.ts`**:
- `snapshotBefore`: mide métrica pre-acción, persiste en `action_verifications`
- `scheduleVerification`: setTimeout `waitMs`
- `runVerification`: re-mide, compara con minDelta, persiste status
- `verifierContext`: opcional, para métricas que requieren target específico (ej. `{ target: '+593...' }` para `active_voice_block_for_caller`)

**Métricas implementadas:**
- `pending_red_handoffs` → GET customer-support `/support/metrics/pending-red-handoffs`
- `active_voice_block_for_caller` → GET voice-call `/voice/metrics/active-blocks?from=`

### Capa 4 — Learning (mini)

**`OutcomeTrackerService`** (orchestrator-service):
- Cron diario 03:00 UTC (22:00 Quito)
- Lee `action_verifications` últimas 24h
- Calcula `successRate` por `verifierKey`
- Structured logs `{event: 'outcome_stats', ...}` a Cloud Logging
- Endpoint GET `/orchestrator/outcome-stats?hours=24`

**No muta runbook todavía.** Capa 4 completa (Q3-Q4) agregaría:
- Schema `outcome_daily_stats` (histórico persistido)
- Drift detector (success rate baja week-over-week)
- Propuestas de ajuste `minUrgency` / `waitMs` (Decisions Cat 3)
- Mutación del `AUTONOMOUS_ALLOWLIST` con ack humano

### Capa 5 — Goal-setting (pendiente Q3)

Hoy el cerebro es **reactivo**: espera que aparezca una anomaly y actúa. Capa 5 sería **proactivo**: persigue objetivos sin que se los pidan.

**Ejemplo:** Going necesita +10% drivers activos en Quito esta semana.
- Cerebro descompone en sub-objetivos: campañas de referidos, ajuste de incentivos, push notifications
- Multi-step plan persistido
- Track del progress
- Re-planning si el plan falla

Necesita:
- `goals` collection (objetivos vivos)
- `planner-service` (LLM-driven multi-step decomposition)
- Integración con marketing-agent + ops-agent

### Capa 6 — Self-evolution (pendiente Q4)

Cerebro propone cambios a **sus propias reglas**:
- "Detecto que `block_voice_caller` siempre converge con count >= 8. Propongo bajar threshold de la regla `spammer-voice-caller` a 4 calls"
- Cambio queda como Decision Cat 3 → ack humano requerido
- Si aprueba, el cambio se aplica al `AnomalyRulesService` vía Mongo overrides

**Crítico:** este es el momento donde el cerebro puede degradarse a sí mismo. Requiere:
- Rollback automático si KPIs caen post-cambio
- Sandbox mode (probar nuevas reglas paralelo a las viejas sin ejecutar)
- Audit log inmutable de toda evolución

---

## Cómo agregar un loop completo (recipe)

Ejemplo: queremos auto-suspender drivers con licencia vencida.

1. **Capa 0** — `driver-compliance-service` ya detecta licencias vencidas. Agregar `publishComplianceExpired` que emite anomaly `driver_compliance_expired` con `data: { driverId, licenseExpiredAt }`.

2. **Capa 1** — Agregar regla en `anomaly-rules.service.ts`:
   ```ts
   {
     id: 'driver-compliance-expired',
     matches: (a) => a.type === 'driver_compliance_expired' && a.data?.driverId,
     build: (a) => ({
       type: 'suspend_driver_documents',
       target: a.data.driverId as string,
       urgency: 0.95,
       reason: 'License expired',
       suggestedAction: 'Suspender driver via transport-service',
       expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
       data: { driverId: a.data.driverId },
     }),
   }
   ```

3. **Capa 2** — Agregar a `RULES`:
   ```ts
   suspend_driver_documents: {
     agent: 'transport-service',
     action: 'suspend_driver',
     safetyLevel: 2,
     argsBuilder: (intent) => ({ driverId: intent.target }),
   }
   ```
   Y a `AUTONOMOUS_ALLOWLIST`:
   ```ts
   {
     intentType: 'suspend_driver_documents',
     minUrgency: 0.9,
     verify: {
       verifierKey: 'driver_suspended',
       direction: 'increase',
       waitMs: 30_000,
       minDelta: 1,
     },
     onVerifyFail: 'alert_only',
     notes: '...',
   }
   ```

4. **Capa 3** — En `action-verifier.service.ts`:
   - Case `'driver_suspended'`: GET transport-service `/admin/metrics/driver-status?driverId=X`
   - Implementar el método `fetchTransportMetric` análogo al voice

5. **Test** — Spec en `anomaly-rules.service.spec.ts` validando la nueva regla.

6. **Deploy** — orchestrator-service + transport-service + mycortex-service.

7. **Verificar Capa 4** — Después de 7 días, mirar `/orchestrator/outcome-stats` para ver `successByKey.driver_suspended.successRate`. Si < 0.7, investigar.

---

## Comandos útiles

```bash
# Trigger un poll inmediato del orchestrator
curl -X POST https://orchestrator.goingec.com/orchestrator/poll-now

# Ver decisions de las últimas 24h
curl https://orchestrator.goingec.com/orchestrator/decisions?limit=50

# Ver outcome stats últimas 24h
curl https://orchestrator.goingec.com/orchestrator/outcome-stats?hours=24

# Ver estado del cerebro
curl https://orchestrator.goingec.com/orchestrator/status

# Ver state del voice-command (active blocks)
curl https://voice-call-service-XXX.run.app/voice/command/state

# Pausar un agent desde admin UI
# admin.goingec.com → Cerebro → Overrides → Pausar
```

---

## Archivos clave

```
voice-call-service/
  src/voice/cerebro-publisher.service.ts   ← Capa 0 publishers
  src/voice/voice-command.service.ts       ← Backing store de comandos
  src/voice/realtime-bridge.service.ts     ← Stuck timer + forceHandoff
  src/api/voice-command.controller.ts      ← /voice/command endpoint
                                              + /voice/metrics/active-blocks

mycortex-service/
  src/reasoning/anomaly-rules.service.ts   ← Capa 1 reglas determinísticas
  src/reasoning/anomaly-rules.service.spec.ts
  src/reasoning/reasoning-loop.service.ts  ← orquestador del ciclo LLM + reglas
  src/reasoning/prompt-builder.service.ts  ← system prompt admin-editable

orchestrator-service/
  src/decision/rules-engine.service.ts     ← RULES tabla intent → action
  src/decision/autonomous-allowlist.ts     ← Capa 2 allowlist
  src/decision/dispatcher.service.ts       ← gates + execute + verify
  src/decision/action-verifier.service.ts  ← Capa 3 medición pre/post
  src/decision/outcome-tracker.service.ts  ← Capa 4 mini
  src/decision/mycortex-poller.service.ts  ← poll cada 5 min
  src/api/orchestrator.controller.ts       ← /orchestrator/* endpoints

agent-bridge-service/
  src/registry/agent-registry.ts           ← agentId → URL + auth
  src/dispatch/dispatch.controller.ts      ← Chaski proxy

cerebro-service/
  src/ingestion/pubsub-consumer.ts         ← consume AgentRunEvent
  src/world-model/world-state.service.ts   ← snapshot expuesto
  src/api/cerebro.controller.ts            ← GET /cerebro/state
```

---

## Decisiones de diseño

- **Por qué híbrido (reglas + LLM):** patrones críticos de seguridad no pueden depender de prompts. Reglas son última línea de defensa. LLM agrega valor en anomalies complejas.
- **Por qué pull (no push):** orchestrator pollea mycortex cada 5 min. Más simple que webhook, sin lock-step entre servicios.
- **Por qué TTL en memoria (blocklist voice):** blocks son ephemeros (1h max). Si Cloud Run reinicia, perdemos el block → blast radius mínimo (caller recupera capacidad 1h antes). No vale Mongo+Redis para esto.
- **Por qué `alert_only` y no `rollback`:** rollback automático puede empeorar la situación (ej. rollback de un cleanup que sí funcionó). Operador investiga y decide manualmente.
- **Por qué Capa 4 mini primero:** mutar runbooks autónomamente es donde el cerebro puede romperse. Necesitamos 3+ meses de baseline observada antes de habilitar mutación.

---

## Métricas a vigilar post-launch

- **`outcome_stats.globalSuccessRate`** semanal. Si baja de 0.85, investigar.
- **`outcome_stats.topFailedIntentTypes`**: identifica reglas degradadas.
- **`pending_verification` count creciendo**: indica que `action-verifier` no está corriendo (cron caído?).
- **`voice-call-service.suspicious_call_pattern` count diario**: baseline de spam en Going.
- **Time-to-converge p95 por verifierKey**: si sube, la acción está volviéndose más lenta de lo esperado.

---

## Roadmap

- **Q2-2026 (post-launch)**: Activar todos los publishers dormidos (driver compliance, payment gateway).
- **Q3-2026**: Capa 5 — Goal-setting con planner-service + goals collection.
- **Q4-2026**: Capa 6 — Self-evolution con sandbox + ack humano.
- **2027**: Considerar reemplazar reglas hardcoded por DSL editable desde admin UI.
