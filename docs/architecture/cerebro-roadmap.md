# Cerebro Going + MyCortex — Roadmap de implementación

**Status**: Fase 1 + 2 ✅ live en producción · 2026-05-08
**Doc de diseño**: `cerebro-mycortex.md` (visión + 4 capas)
**Branch del trabajo**: `claude/naughty-dhawan-181eb8`

Este doc complementa el de diseño con el plan EJECUTIVO de las fases pendientes,
decisiones tomadas, costos, y comandos de operación. Está pensado como guía
para retomar sin tener que releer historial de conversaciones.

---

## 1. Status actual (snapshot 2026-05-08)

### Lo que está vivo en producción

| Componente | URL / Resource | Estado |
|---|---|---|
| `cerebro-service` | `https://cerebro-service-lw44cnhdeq-uc.a.run.app` | ✅ revision-00004, min-instances=1 |
| 6 Pub/Sub topics | `agent.{ops,financial,content,marketing,going,customer-support}.events` | ✅ con IAM bindings |
| 6 subscriptions | `cerebro-agent.<x>.events` | ✅ subscriber consuming |
| 6 agents publishers | `CEREBRO_PUBLISH_ENABLED=true` | ✅ 6/6 activados |
| WorldModelService cron | `@Cron('*/10 * * * *')` | ✅ snapshots persistidos |
| `GET /cerebro/state` | Fase 2 World Model | ✅ devuelve snapshot real |
| `GET /cerebro/events/:agentId` | Audit log | ✅ con TTL 30d |
| `mycortex-service/` skeleton | Sin deployar | 🟡 código listo, esperando SA + build |

### Commits clave

```
~22 commits sobre origin/main, branch claude/naughty-dhawan-181eb8

Foundation Fase 1:
  86e22b27  cerebro-contracts lib + ops-agent wired
  75907b9f  financial-agent wired (con migración Anthropic→Gemini)
  da1436ea  content-agent wired
  75657622  marketing-agent wired
  028a964b  going-agent wired
  6142e064  customer-support-service wired (HTTP, cron interno)

Skeleton + Fase 2:
  00d55140  cerebro-service skeleton + bootstrap script
  e3e7383b  Fase 2 World Model + diff detector

Fase 4 v0:
  9cb877be  mycortex-service skeleton (sin deployar)

Bugs latentes cerrados durante el deploy:
  425785bd  Pin pnpm@10 (pnpm 11 incompat Node 20)
  6a977cec  Strip workspace deps de generated package.json
  5855537e  Mongoose @Prop type:String para union types
  c497ed01  cerebro-contracts main → dist/index.js
  43afe9b1  customer-support cloudbuild MONGO_URL
  36c91aa3  bootstrap script --condition=None bug
```

### Lo que descubrió el sistema (real, en producción)

El primer snapshot del cerebro reveló:

- **2 handoffs con priority RED sin atender desde hace 9.5 días**
  (`oldestRedHandoffAgeMinutes: 13741` en `/support/metrics`)
- **`OPERATOR_TELEGRAM_CHAT_IDS` vacío** en producción → handoffs caen en limbo
- 0 viajes pendientes / 0 conductores activos al momento del trigger ops-agent

Estos son hallazgos accionables que MyCortex debería empezar a reportar
automáticamente cuando se active.

---

## 2. Plan fase por fase

### Fase 4 v0 — Deploy MyCortex (read-only)

**Objetivo**: validar que las propuestas IA tienen valor antes de invertir
en infra de ejecución (Orchestrator). El servicio razona y reporta a
Telegram; NO ejecuta nada.

**Esfuerzo**: 1 día setup + ~1 semana de observación

**Componentes**: ya commiteados en `mycortex-service/`. Falta solo deploy.

**Dependencias**: ninguna (cerebro-service ya expone `/cerebro/state` HTTP).

**Comandos**:

```bash
# 1. Crear SA
gcloud iam service-accounts create mycortex-service-sa \
  --display-name='MyCortex Service' --project=going-5d1ae

gcloud projects add-iam-policy-binding going-5d1ae \
  --member='serviceAccount:mycortex-service-sa@going-5d1ae.iam.gserviceaccount.com' \
  --role='roles/secretmanager.secretAccessor'

# 2. Build + deploy
gcloud builds submit . --config=mycortex-service/cloudbuild.yaml --project=going-5d1ae

# 3. Activar reasoning loop
gcloud run services update mycortex-service \
  --update-env-vars=MYCORTEX_REASONING_ENABLED=true \
  --project=going-5d1ae --region=us-central1

# 4. Trigger manual del primer ciclo
curl -X POST https://mycortex-service-...run.app/mycortex/run-now
```

**Criterio de salida**:
- Telegram recibe el primer reporte con N intenciones (N ≥ 0 OK)
- `GET /mycortex/intentions` devuelve las propuestas persistidas
- Tras 1 semana, evaluar: ¿las propuestas son específicas y accionables, o
  son tonterías genéricas? Si son malas, ajustar prompt en
  `prompt-builder.service.ts` antes de seguir a Orchestrator.

**Costo**: ~$50-100/mes con Sonnet 4.5 (cron cada 30 min × 48 runs/día).

---

### Fase 3 — Orchestrator

**Objetivo**: ejecutor determinístico que recibe intenciones de MyCortex
(o eventos del sistema) y las traduce a acciones concretas en agentes,
respetando safety levels.

**Esfuerzo**: 4-5 días

**Decisión técnica clave** (resuelta acá): cómo invocar acciones en agents.

| Approach | Pros | Contras | Decisión |
|---|---|---|---|
| Convertir cron jobs a HTTP services | Cada agent expone `/command` directo | $$ caro (6 always-on) + refactor grande | ❌ no |
| `agent-bridge-service` que traduce HTTP → `gcloud run jobs execute --update-env-vars=COMMAND_JSON=...` | Mantiene jobs scale-to-zero, sin refactor | Latency 30-60s por trigger | ✅ sí |
| Híbrido (cron + HTTP intermitente) | Compromiso | Complejo de operar | ❌ no |

**Componentes a construir**:

```
orchestrator-service/
  src/
    main.ts
    app.module.ts
    api/
      orchestrator.controller.ts        # /decisions, /override, /pending-approvals, /run-now
    decision/
      rules-engine.service.ts            # mapping intention.type → agent + action + args
      dispatcher.service.ts              # ejecuta con safety levels
      safety-levels.ts                   # Cat 1/2/3 enum + lógica de aprobación
      mycortex-poller.service.ts         # @Cron consume intenciones nuevas de mycortex-service
    infrastructure/
      schemas/decision.schema.ts         # Mongoose: intention_id, agent, action, args, status, outcome
      persistence/decision.repository.ts
      agent-bridge.client.ts             # HTTP a agent-bridge-service
      telegram-approval.service.ts       # ack humano para Cat 3 (timeout 15 min)

agent-bridge-service/
  src/
    main.ts
    app.module.ts
    api/
      bridge.controller.ts                # POST /agents/:agentId/command
    infrastructure/
      cloud-run-jobs.client.ts            # gcloud run jobs execute via Google Cloud Run API
```

**Reglas determinísticas iniciales** (mapping a definir):

```typescript
// rules-engine.service.ts
const RULES: Record<IntentionType, AgentAction | 'human_only'> = {
  'prevent_supply_gap':       { agent: 'marketing-agent', action: 'driver_bonus_zone', cat: 2 },
  'reduce_chargeback_risk':   { agent: 'customer-support-service', action: 'open_ticket', cat: 1 },
  'investigate_driver':       { agent: 'customer-support-service', action: 'open_ticket', cat: 1 },
  'replicate_viral_format':   'human_only',  // requiere creatividad humana
  'page_oncall_operator':     { agent: 'customer-support-service', action: 'page_operator', cat: 1 },
  'add_more_operators':       'human_only',
  'configure_operators':      'human_only',
  // ...
};
```

**Safety levels** (a refinar antes de implementar — ver decisiones abiertas):

- **Cat 1 — informativas**: alertas, logs, reportes. Ejecuta directo sin confirmación.
- **Cat 2 — operacionales reversibles**: ajustar threshold, abrir ticket, enviar
  mensaje a driver. Ejecuta + notifica ops para review post-hoc.
- **Cat 3 — irreversibles / alto costo**: gasto de marketing, cambios de pricing,
  bloqueo de usuarios. Requiere ack en Telegram con timeout 15 min antes de
  ejecutar.

**Storage**: DB nueva `going-orchestrator` en mismo cluster Atlas, collection
`orchestrator_decisions` con TTL 90d (mantener histórico para learning).

**Criterio de salida**:
- Orchestrator pollea intenciones de MyCortex cada 5 min
- Cat 1 ejecutan automático sin error
- Cat 2 ejecutan + envío Telegram review
- Cat 3 envío Telegram pidiendo ack; si ack OK ejecuta, si no expira
- `GET /orchestrator/decisions` muestra histórico completo con outcomes

**Costo**: ~$10-15/mes (2 services always-on min-instances=1, baja CPU).

---

### Fase 4 v1 — MyCortex con execution (via Orchestrator)

**Objetivo**: cerrar el loop. MyCortex propone, Orchestrator ejecuta,
outcome vuelve a MyCortex para calibrar próximos ciclos.

**Esfuerzo**: 2-3 días

**Dependencias**: Fase 4 v0 + Fase 3 funcionando.

**Componentes**:

1. MyCortex publica intenciones a topic nuevo `mycortex.intentions.events`
   (en vez de solo persistir en Mongo + reportar Telegram).
2. Orchestrator subscribe.
3. Orchestrator escribe outcome en `mycortex_intentions` (campo `outcome` y
   `outcomeNotes`).
4. Próximo ciclo de MyCortex incluye outcomes en el prompt: "tu propuesta X
   resultó effective / partial / ineffective / counterproductive — calibra".

**Criterio de salida**:
- 80% de intenciones tienen outcome registrado dentro de 24h
- Prompt incluye outcomes históricos
- Métricas de "% de intenciones effective" visible

---

### Fase 6 — UI Ops

**Objetivo**: visibilidad y control humano sobre el sistema. Vos y ops
pueden ver qué está pasando, override decisiones, aprobar Cat 3.

**Esfuerzo**: 2-3 días

**Componentes**: páginas nuevas en `admin-dashboard` (Next.js, ya existente).

```
admin-dashboard/
  src/app/admin/cerebro/
    page.tsx                           # /admin/cerebro — overview
    intentions/page.tsx                # propuestas pendientes de MyCortex
    decisions/page.tsx                 # qué ejecutó el Orchestrator
    approvals/page.tsx                 # Cat 3 esperando ack
    history/page.tsx                   # snapshot history del world model
    overrides/page.tsx                 # pausar agentes, forzar comportamiento
```

**Endpoints a consumir** (todos ya disponibles tras Fase 3):
- `GET /cerebro/state` (cerebro-service)
- `GET /cerebro/events?limit=N` (cerebro-service)
- `GET /mycortex/intentions` (mycortex-service)
- `GET /orchestrator/decisions` (orchestrator-service)
- `GET /orchestrator/pending-approvals` + `POST /orchestrator/approvals/:id/ack`
- `POST /orchestrator/override` (pausa de agente, forzar comportamiento)

**Criterio de salida**:
- Vos podés ver las últimas 100 decisiones del Orchestrator desde admin
- Aprobás Cat 3 con un click (sin necesidad de Telegram)
- Pausa de un agente con un toggle (CEREBRO_PUBLISH_ENABLED off)

---

### Fase 8 — Voz + chat conversacional en GoingApp

**Objetivo**: que MyCortex sea accesible por voz y texto desde dentro de
GoingApp (no solo a través de Telegram externo). Tres niveles de público
con esfuerzo y prioridad diferentes.

**Esfuerzo total**: 13-19 días distribuidos en 3 sub-fases independientes.

**Stack a reutilizar** (todo ya en producción):
- `voice.service.ts` (Google Speech-to-Text + Text-to-Speech Neural2 ES/EN × M/F)
- Gemini 2.5 Flash (Vertex AI) para conversación
- WhatsApp Meta Cloud API + Telegram Bot API para canales externos

#### 8a — Voz para founder + equipo (Nivel A)

**Esfuerzo**: 3-5 días

Endpoint nuevo en `mycortex-service` que acepta voz/texto + canal Telegram
privado de operaciones. Vos preguntás "¿cómo está la operación hoy?",
MyCortex razona sobre el world model y responde con voz Neural2.

Roles por persona del equipo (ops, finance, marketing) para que cada uno
pregunte solo sobre su área. Implementado como filtros en el system prompt
de MyCortex + permisos en el endpoint.

**Componentes**:
- `mycortex-service/src/api/conversation.controller.ts` — POST /mycortex/ask
  (acepta texto o audio multipart)
- Reuso de `voice.service.ts` (copiar de customer-support o extraer a
  `libs/shared-voice/`)
- Bot Telegram privado nuevo o reuso del existente con prefijo `/mycortex`

**Criterio de salida**: vos pedís "¿cómo va Cumbayá esta hora?" y recibís
audio con el contexto correcto del world model.

#### 8b — Voz para conductores Going (Nivel B)

**Esfuerzo**: 5-7 días

Bot conversacional dentro de mobile-driver-app (los drivers no abren
WhatsApp manejando — el chat tiene que estar dentro de la app).

> *"Ey Going, ¿cuánto me falta para la meta de hoy?"*
> *"Apagá disponibilidad las próximas 2 horas"*
> *"¿Hay algún viaje cerca?"*

**Componentes**:
- `driver-voice-assistant-service/` (nuevo) o endpoint nuevo en
  customer-support-service
- React Native SDK embeddable (web speech API + recording + upload)
- Auth con JWT del driver para personalización ("tu meta hoy", "tus viajes")
- Integración con tracking-service para "apagá disponibilidad"

#### 8c — Voz para pasajeros (Nivel C)

**Esfuerzo**: 5-7 días

Embebido en mobile-user-app. Hoy customer-support funciona por WhatsApp/
Telegram externos, pero un usuario ya está dentro de la app y no debería
salir para pedir un viaje.

> *"Necesito viaje a Quito mañana 6am"*
> *"¿Cuánto cuesta a Otavalo?"*
> *"Cancelá mi viaje"*

**Componentes**:
- React Native SDK (mismo que 8b)
- Endpoint nuevo en customer-support-service (`/chat/voice` interno) o reuso
  del flujo de WhatsApp con autenticación JWT
- Integración con BookingService que ya crea viajes desde el chat (existe)

**Dependencias entre las 3 sub-fases**: ninguna estricta, pero conviene
empezar por 8a (público chico = vos = feedback rápido), después 8b/8c
en paralelo.

**Costo adicional**: ~$0.001-0.005 por interacción (Gemini Flash + STT/TTS).
Para 1000 interacciones/día = ~$30-150/mes según volumen.

---

### Fase 7 — Aprendizaje

**Objetivo**: que MyCortex mejore con el tiempo basándose en outcomes reales.

**Esfuerzo**: 1 día setup + continuo

**Componentes**:

1. Cron diario en mycortex-service que:
   - Lee outcomes de las últimas 24h de `mycortex_intentions`
   - Calcula métricas: % effective por type, urgency calibration error
   - Persiste en `mycortex_learning_corpus`

2. Prompt builder de MyCortex incluye:
   ```
   ## Tus métricas de calibración (últimos 30 días)
   - prevent_supply_gap: 67% effective, 20% partial, 13% ineffective
   - investigate_driver: 90% effective
   - replicate_viral_format: 40% effective (atención: tu urgency tiende
     a ser alta cuando los outcomes son medios)
   ```

3. Dashboard `/admin/cerebro/calibration` con tendencias.

**Criterio de salida**:
- Métricas visibles
- Prompt incluye datos de calibración
- A los 30 días, evaluar si el % effective está mejorando

---

## 3. Decisiones abiertas (pensar antes del próximo sprint)

### a. Safety levels — listado de acciones por categoría

Hay que enumerar qué intenciones pertenecen a Cat 1/2/3 ANTES de
implementar el dispatcher. Propongo una primera versión:

**Cat 1 (auto)**: open_ticket, sent_telegram_alert, page_operator,
schedule_content_review_session, log_anomaly.

**Cat 2 (auto + review)**: driver_bonus_zone (con cap $10/driver),
adjust_threshold, message_driver, suspend_user_temporarily.

**Cat 3 (ack manual)**: marketing_campaign_spend (>$50), pricing_change,
block_user_permanent, change_commission_rate, bulk_message (>100 users).

**Pregunta para vos**: ¿alguna que falte o que querás mover de categoría?

### b. Quién aprueba Cat 3

- **MVP**: ack en Telegram del founder (vos). Timeout 15 min, después
  expira automático.
- **Después**: roles + admin dashboard con queue de pendientes (Fase 6).

### c. Frecuencia de MyCortex

- **30 min** (~$50-100/mes Sonnet 4.5) — más responsive
- **1h** (~$25-50/mes) — más barato, latencia mayor
- **Adaptive**: cada 2h en off-hours (11pm-6am), cada 30min en horario
  operativo

**Recomendación**: empezar en 30 min, evaluar costo después de 1 semana.

### d. Storage de outcomes

- **Mongo Atlas** (mismo cluster, DB `going-mycortex`) — simple, ya tenemos
- **BigQuery** para analytics futuro — mejor para dashboards complejos
- **Híbrido**: Mongo para hot data + export diario a BigQuery

**Recomendación**: empezar Mongo. BigQuery cuando volumen >100k intenciones.

### e. Retraining de prompt

- **Manual mensual**: vos revisás métricas, ajustás system prompt
- **Auto via Claude**: cron mensual que pide a Opus: "estos son outcomes
  últimos 30 días, sugerí cambios al system prompt"
- **Híbrido**: auto sugiere, manual aprueba

**Recomendación**: manual primer trimestre. Auto cuando los datos sean
estadísticamente significativos.

---

## 4. Costos GCP estimados

| Componente | Costo/mes | Notas |
|---|---|---|
| cerebro-service (always-on) | $5-8 | min-instances=1, 512Mi |
| mycortex-service (always-on) | $5-8 | min-instances=1, 1Gi |
| **Anthropic Claude (Sonnet 4.5)** | $50-100 | 30-min cron, contexto ~30K tokens |
| orchestrator-service (always-on) | $5-8 | min-instances=1, 512Mi |
| agent-bridge-service (always-on) | $3-5 | min-instances=1, 256Mi |
| Pub/Sub topics + subs | <$1 | volumen bajo (~1000 msg/día) |
| Mongo Atlas (DB nuevas) | $0 | mismo cluster M10 ya existente |
| Cloud Build (re-deploys) | <$5 | promedio mensual |
| **Total nueva infra** | **~$70-130/mes** | dominado por Claude API |
| Fase 8 (voz/chat opcional) | +$30-150/mes | 1000 interacciones/día estimadas |

Mitigación: Haiku 4.5 en MyCortex bajaría a $15-30/mes (5x más barato).
Decidir después de validar calidad con Sonnet.

---

## 5. Bugs conocidos del sistema

### Cerrados durante este sprint

| # | Bug | Fix commit |
|---|---|---|
| 1 | `pnpm@latest` resolvió a v11 (incompat Node 20) | `425785bd` |
| 2 | `workspace:*` rompe `npm install` final | `6a977cec` |
| 3 | Mongoose `@Prop` sin `type:` falla con union types | `5855537e` |
| 4 | Cloud Run NAT IP no whitelisted en Atlas | `9cb877be` (VPC connector) |
| 5 | `cerebro-contracts/main` apuntaba a `src/index.ts` | `c497ed01` |
| 6 | `customer-support` cloudbuild borraba `MONGO_URL` | `43afe9b1` |
| 7 | Bootstrap `--condition=None` no aplica a pubsub IAM | `36c91aa3` |
| 8 | Redeploy reseteaba env vars de `--update-env-vars` | Operacional (re-aplicar después de cada deploy) |

### Pendientes / mejoras

- `pnpm-lock.yaml` se modifica en cada `pnpm install --filter` local.
  Conviene committearlo para deploys reproducibles, pero genera diffs
  ruidosos. Decidir convención.
- WorldModelService no detecta cambios significativos todavía
  (DiffDetectorService existe pero solo loggea — falta wire-in al snapshot).
- `mycortex-service` sin deployar — primer sprint a retomar.

---

## 6. Comandos de operación (copy-paste)

### Quick recap del estado actual

```bash
# /health del cerebro
curl https://cerebro-service-lw44cnhdeq-uc.a.run.app/health

# /cerebro/state — world snapshot actual
curl https://cerebro-service-lw44cnhdeq-uc.a.run.app/cerebro/state | jq

# Eventos de un agente específico
curl https://cerebro-service-lw44cnhdeq-uc.a.run.app/cerebro/events/ops-agent?limit=5 | jq

# Métricas customer-support (no requieren auth)
curl https://customer-support-service-lw44cnhdeq-uc.a.run.app/support/metrics | jq
```

### Trigger manual de un agente

```bash
gcloud run jobs execute ops-agent --region=us-central1 --project=going-5d1ae
gcloud run jobs execute financial-agent --region=us-central1 --project=going-5d1ae
# ... etc
```

### Verificar estado de los publishers

```bash
for agent in ops-agent financial-agent content-agent marketing-agent going-agent; do
  echo "=== $agent ==="
  gcloud run jobs describe $agent --region=us-central1 --project=going-5d1ae \
    --format='value(spec.template.spec.template.spec.containers[0].env)' \
    | tr ',' '\n' | grep CEREBRO_PUBLISH_ENABLED
done

# customer-support es service:
gcloud run services describe customer-support-service \
  --region=us-central1 --project=going-5d1ae \
  --format='value(spec.template.spec.containers[0].env)' \
  | tr ',' '\n' | grep CEREBRO_PUBLISH_ENABLED
```

### Re-aplicar IAM bindings (si bootstrap falla otra vez)

```bash
for topic in agent.ops.events agent.financial.events agent.content.events \
             agent.marketing.events agent.going.events agent.customer-support.events; do
  gcloud pubsub topics add-iam-policy-binding $topic \
    --member='serviceAccount:going-agent-sa@going-5d1ae.iam.gserviceaccount.com' \
    --role='roles/pubsub.publisher' --project=going-5d1ae
  gcloud pubsub subscriptions add-iam-policy-binding cerebro-$topic \
    --member='serviceAccount:cerebro-service-sa@going-5d1ae.iam.gserviceaccount.com' \
    --role='roles/pubsub.subscriber' --project=going-5d1ae
done
```

### Pausar el sistema completo (kill switch)

```bash
# Pausa publishers
for agent in ops-agent financial-agent content-agent marketing-agent going-agent; do
  gcloud run jobs update $agent --update-env-vars=CEREBRO_PUBLISH_ENABLED=false \
    --region=us-central1 --project=going-5d1ae
done
gcloud run services update customer-support-service --update-env-vars=CEREBRO_PUBLISH_ENABLED=false \
  --region=us-central1 --project=going-5d1ae

# Pausa subscriber (cerebro deja de procesar — los eventos se acumulan en cola 7d)
gcloud run services update cerebro-service --update-env-vars=CEREBRO_SUBSCRIBE_ENABLED=false \
  --region=us-central1 --project=going-5d1ae

# Pausa MyCortex (cuando esté deployado)
gcloud run services update mycortex-service --update-env-vars=MYCORTEX_REASONING_ENABLED=false \
  --region=us-central1 --project=going-5d1ae
```

---

## 7. Checklist de retomar el trabajo

Cuando vuelvas a esta rama después de la pausa:

- [ ] `git pull origin claude/naughty-dhawan-181eb8`
- [ ] Verificar que `/cerebro/state` sigue respondiendo
- [ ] Verificar que `agents-with-data=N/6` está creciendo (los crons natural deberían haberlo poblado)
- [ ] Decidir las 5 cuestiones abiertas de la sección 3
- [ ] Arrancar Fase 4 v0 (deploy MyCortex) con los comandos de la sección 2
- [ ] Observar 1 semana las propuestas en Telegram
- [ ] Si OK, arrancar Fase 3 (Orchestrator)

---

**Última actualización**: 2026-05-08, después de validación end-to-end del
primer evento llegando al cerebro.
