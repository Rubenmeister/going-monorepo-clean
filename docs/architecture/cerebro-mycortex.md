# Cerebro de Going + MyCortex — Arquitectura de 4 capas

**Status**: Diseño aprobado · Implementación pendiente (post-AAB MVP)
**Autor original**: Ruben Torres
**Última actualización**: 2026-05-06

## Visión

Going opera con 6+ agentes autónomos (ops, financial, content, marketing,
going, customer-support) que corren por cron y no se hablan entre sí. Esta
arquitectura propone una jerarquía de 4 capas que mantiene la autonomía de
los agentes pero suma coordinación operacional (Orchestrator) e
inteligencia predictiva (MyCortex).

> **El código es la base de automatización. Los agentes hacen la tarea
> concreta y pueden ser muchos. El Orchestrator dirige todas las
> operaciones mediante los agentes. MyCortex es la parte intelectual de
> razonamiento y actividad directriz, capaz de interpretar datos y avizorar
> el desarrollo de actividades antes de que el agente se dé cuenta.**
>
> — Ruben Torres, conversación de diseño 2026-05-06

## Las 4 capas

```
┌──────────────────────────────────────────────────────────────┐
│  🧠 MyCortex — capa cognitiva                                │
│     "anticipa y dirige"                                      │
│  • Lee patrones (no datos puntuales)                         │
│  • Ve el futuro probable basado en histórico + contexto      │
│  • Propone PRE-acciones antes de que el problema ocurra      │
│  • Aprende de outcomes para refinar predicciones             │
│  • Lenguaje: "esto va a pasar, prepara X"                    │
└────────────────────┬─────────────────────────────────────────┘
                     │  intenciones priorizadas
                     ↓
┌──────────────────────────────────────────────────────────────┐
│  🎯 Orchestrator — capa operacional                          │
│     "coordina y ejecuta"                                     │
│  • Recibe directivas de MyCortex o de eventos del sistema    │
│  • Decide CUÁL agente, en QUÉ orden, con QUÉ args            │
│  • Maneja dependencias (B necesita output de A)              │
│  • Maneja retries, timeouts, fallbacks, safety levels        │
│  • Lenguaje: "hacé X con agente Y"                           │
└────────────────────┬─────────────────────────────────────────┘
                     │  call_agent(name, action, args)
                     ↓
┌──────────────────────────────────────────────────────────────┐
│  🤖 Agentes — capa ejecutiva                                 │
│     "hacen la tarea concreta"                                │
│  • ops-agent, financial-agent, content-agent, going-agent,   │
│    marketing-agent, customer-support-service, …              │
│  • Cada uno experto en su dominio acotado                    │
│  • Stateless en lo conceptual; reportan al Orchestrator      │
│  • Lenguaje: "hecho, aquí está el resultado"                 │
└────────────────────┬─────────────────────────────────────────┘
                     │  reads/writes
                     ↓
┌──────────────────────────────────────────────────────────────┐
│  ⚙️ Código + Infraestructura — capa base                     │
│     "el sustrato físico"                                     │
│  • Microservicios NestJS (12), MongoDB, Redis, Pub/Sub       │
│  • Mobile apps (Expo), web frontends (Next.js)               │
│  • Hardware: Cloud Run, Vercel, MongoDB Atlas                │
│  • Lenguaje: APIs, schemas, contracts                        │
└──────────────────────────────────────────────────────────────┘
```

## La distinción crítica: Orchestrator vs MyCortex

Son cosas distintas con responsabilidades distintas. Confundirlas lleva a
sistemas frágiles o sobre-diseñados.

| | Orchestrator | MyCortex |
|---|---|---|
| **Responde a** | Eventos que YA ocurrieron | Patrones que SUGIEREN qué va a ocurrir |
| **Decide** | ¿Quién hace qué AHORA? | ¿Qué hay que prepararse a hacer? |
| **Tiempo** | Reactivo (segundos-minutos) | Predictivo (horas-días) |
| **Determinismo** | Reglas + workflows (mayormente determinístico) | Razonamiento probabilístico (LLM) |
| **Falla así** | Retry, fallback, alert ops | Predicción no se cumple → ajusta modelo |
| **Costo** | Bajo (rules engine) | Alto (LLM cada ciclo, ~$1-2/run) |
| **Frecuencia** | Continuo (event-driven) | Periódico (cada 30-60 min) |
| **Auditabilidad** | Logs estructurados, fácil | Reasoning traces, requiere análisis |

### Ejemplos de la diferencia en Going

**Caso 1 — Drivers en zona**

- *Orchestrator (reactivo)*: "Cumbayá tiene 0 drivers AHORA → notifica ops via Telegram"
- *MyCortex (predictivo)*: "En las últimas 4 semanas, los viernes a las 6pm la
  demanda en Cumbayá sube 3x mientras la oferta cae. Hoy es viernes 4:30pm.
  **Activa marketing-agent para ofrecer bono a drivers de Tumbaco para que se
  muevan a Cumbayá AHORA**, antes de que el problema ocurra."

**Caso 2 — Cancelaciones**

- *Orchestrator (reactivo)*: "Pasajero canceló → cobra fee de cancelación"
- *MyCortex (predictivo)*: "Este pasajero ha cancelado 3 veces seguidas con
  el mismo conductor. Detecto un conflicto interpersonal. **No lo matchees
  con conductor X de nuevo**, y abre ticket en customer-support-service."

**Caso 3 — Envíos**

- *Orchestrator (reactivo)*: "Parcel creado → matchea conductor más cercano"
- *MyCortex (predictivo)*: "Pasajero está creando un parcel cuya descripción
  menciona 'medicamentos urgentes' y el destino es 90km. Probabilidad de
  queja si se demora >2h = 78%. **Asigna driver con vehiculo más rápido y
  notifica a ops para escalar si la entrega supera 90 min**."

**Caso 4 — Pricing**

- *Orchestrator (reactivo)*: "Hora pico → aplica surge multiplier 1.3x"
- *MyCortex (predictivo)*: "Va a llover en Quito en 90 min según API
  meteorológica. Histórico muestra +40% demanda + 30% más cancelaciones por
  retraso de drivers. **Pre-aumenta surge a 1.4x AHORA, comunica a drivers
  el incentivo, y bloquea bookings programados que no puedan ser cumplidos
  en tiempo**."

## Dataflow

```
mongo + pub/sub events  ──→  WORLD MODEL (snapshot cada 5-15 min)
                                  ↓
                            MyCortex reads world model
                                  ↓
                       LLM (Claude) razona: "¿qué viene?"
                                  ↓
                      Output: intenciones priorizadas
                       e.g., [
                         { type:"prevent_supply_gap", zone:"Cumbayá", urgency:0.85 },
                         { type:"reduce_churn_risk", userId:"x", urgency:0.6 },
                       ]
                                  ↓
                      Orchestrator descompone en tareas
                                  ↓
                  call_agent('marketing', 'driver_bonus_zone', {...})
                  call_agent('customer-support', 'open_ticket', {...})
                                  ↓
                          Agentes ejecutan
                                  ↓
                          Reportan outcome
                                  ↓
                  WORLD MODEL se actualiza con resultado
                                  ↓
                  MyCortex aprende: "predicción cumplió/falló"
                                  ↓
                          (loop continúa)
```

## Por qué este modelo es robusto

1. **Cada capa puede fallar sin romper el resto.**
   - MyCortex hallucina → Orchestrator lo ignora si no tiene safety check.
   - Orchestrator falla → agentes siguen con sus crons como hoy.
   - Agentes fallan → código sigue funcionando con behavior baseline.

2. **Cada capa cambia a su propia velocidad.**
   - Código: cambios cada deploy (semanal/diario)
   - Agentes: refinamientos cada pocos días
   - Orchestrator: ajustes mensuales (reglas, pesos)
   - MyCortex: aprendizaje continuo, retraining trimestral

3. **Costo escalonado.** El 90% del trabajo lo hace código + agentes
   (barato, deterministic). MyCortex solo se invoca para decisiones que
   valen su costo (~$1-2 cada vez).

4. **Auditabilidad.** Cada capa logea sus decisiones. Cuando algo sale mal,
   sabes EN QUÉ CAPA — y eso te dice si es bug de código (capa 4), agente
   con malos datos (capa 3), workflow mal definido (capa 2), o predicción
   equivocada (capa 1).

## Implementación propuesta

### Capa 2: Orchestrator (`cerebro-service/`)

Nuevo microservicio NestJS:

```
cerebro-service/
  src/
    api/
      cerebro.controller.ts          # /cerebro/state, /cerebro/decisions, /cerebro/override
    application/
      world-model.service.ts          # snapshot de estado global cada X min
      action-dispatcher.service.ts    # ejecuta decisiones (HTTP a otros agents)
      memory.service.ts               # MongoDB cerebro_state, cerebro_decisions
    domain/
      decision.entity.ts
      world-snapshot.entity.ts
    infrastructure/
      pubsub.subscriber.ts            # consume agent.*.events
      agent-http.client.ts            # HTTP a cada agente con /command endpoint
```

### Capa 1: MyCortex (paquete reutilizable)

Diseñado como package portable. La intención es que sirva para Going Y para
otros proyectos (ej. Self-Driving Workspace personal).

```
libs/mycortex/                       # NX library, importable por cualquier servicio
  src/
    world-model.ts                    # cómo construir snapshots de cualquier dominio
    reasoning-engine.ts               # LLM + prompt templates + tool dispatch
    memory.ts                         # short-term + long-term + outcomes feedback
    learning.ts                       # retroalimentación de predicciones
    adapters/
      going-adapter.ts                # rides, parcels, drivers
      pkm-adapter.ts                  # notas, proyectos, calendar (futuro)
      base-adapter.ts                 # interface común
```

El "adapter" es lo único que cambia entre proyectos. El motor cognitivo es
el mismo.

### Bus de eventos (foundation común)

Pub/Sub de GCP con un topic por agente:

```
agent.ops.events
agent.financial.events
agent.content.events
agent.marketing.events
agent.going.events
agent.customer-support.events
```

Cada agente publica al terminar:

```json
{
  "agentId": "ops-agent",
  "runId": "uuid",
  "timestamp": "2026-05-...",
  "metrics": { "lowSupplyZones": ["Cumbayá"], "avgETA": 8.2 },
  "anomalies": ["zone X had 0 driver acceptances in last 30min"],
  "actions_taken": ["sent_telegram_alert"],
  "actions_proposed": [
    { "type": "boost_driver_supply", "zone": "Cumbayá", "reason": "..." }
  ]
}
```

### Cada agente expone `/command`

Para que Orchestrator pueda invocarlos:

```ts
// ops-agent
@Post('/command')
async handleCommand(@Body() cmd: { action: string; args: any }) {
  switch (cmd.action) {
    case 'recalibrate_thresholds':
      this.thresholdService.update(cmd.args);
      break;
    case 'force_run':
      await this.opsLoopUseCase.execute();
      break;
    // ...
  }
}
```

## Roadmap

| Fase | Duración | Entregable |
|---|---|---|
| **0. Pre-requisito** | — | AAB de Going a producción + closed test 14 días |
| **1. Foundation** | 3-4 días | Pub/Sub topics + cada agente publica eventos + cerebro-service skeleton |
| **2. World model** | 2-3 días | World-snapshot.service.ts agregando estado de Mongo + Pub/Sub |
| **3. Orchestrator** | 4-5 días | Reglas determinísticas (sin LLM) + dispatcher con safety levels |
| **4. MyCortex v0** | 5-7 días | LLM lee world model, propone intenciones, **NO ejecuta** — solo reporta a Telegram |
| **5. MyCortex v1** | 4-5 días | Execution con safety levels (cat 1/2/3), feedback loop |
| **6. UI ops** | 2-3 días | Página `/admin/cerebro` con últimas decisiones, override manual |
| **7. Aprendizaje** | continuo | Memory + retroalimentación ("¿la decisión funcionó?") |

**Total v0 funcional**: ~3 semanas tras AAB.
**Total v1 con learning**: 5-6 semanas tras AAB.

## Safety levels para acciones

Cada acción que Orchestrator ejecuta tiene una categoría:

- **Cat 1 — informativas**: alertas, logs, reportes. Ejecuta directo.
- **Cat 2 — operacionales reversibles**: ajustar threshold, enviar mensaje a
  driver. Ejecuta + notifica ops para review.
- **Cat 3 — irreversibles o de alto costo**: gasto de marketing, cambios de
  pricing, bloqueo de usuarios. Requiere `request_human_approval` con
  timeout de N min antes de ejecutar.

## Open questions / decisiones pendientes

1. **¿Anthropic SDK directo o LangGraph/CrewAI?** Recomendación basada en
   experiencia: SDK directo. Frameworks de agentes son inestables y opacos
   para debugging. El reasoning loop básico es ~200 líneas en TS.

2. **¿Cuán frecuente correr MyCortex?** Trade-off: cost ($1-2/run) vs
   latencia de detección. Propuesta: cada 30 min en horario operacional
   (5am-11pm), cada 2h en off-hours, on-demand desde admin UI.

3. **¿Memoria a corto plazo en Redis o MongoDB?** Redis para world model
   (volátil, hot path). MongoDB para decision history (auditable, cold).

4. **¿Cerebro como Cloud Run service o Cloud Run Job?** Service para los
   endpoints de admin/state, Job para el reasoning loop scheduled.
   Probablemente ambos, comparten code.

5. **¿Quién aprueba acciones Cat 3?** En MVP: requiere ack en Telegram del
   founder. Más adelante: roles + admin dashboard con queue de pendientes.

## MyCortex como producto reutilizable

La estrategia: construir MyCortex bien para Going como POC. El mismo motor
sirve para:

1. **Going** — operaciones de transporte/logística (aplicación inicial)
2. **Self-Driving Workspace personal** — PKM con razonamiento sobre notas,
   tareas, calendar (proyecto futuro de Ruben)
3. **N proyectos siguientes** — cualquier dominio donde haya datos
   estructurados + necesidad de anticipar

El paquete vive en `libs/mycortex/` con adapters por dominio. Un adapter
nuevo se escribe en ~1-2 días si los datos están bien modelados.

## Referencias

- Conversación de diseño: 2026-05-06 (sesión Claude Code, día 6 pre-AAB)
- Brief inicial del Self-Driving Workspace: en memoria personal de Ruben
- Tarea spawn: "Diseñar System Cerebro de Going" (creada 2026-05-04)
