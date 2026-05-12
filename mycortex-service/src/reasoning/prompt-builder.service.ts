import { Injectable, Logger } from '@nestjs/common';
import { WorldSnapshot } from './world-snapshot.client';
import { IntentionEntity } from '../infrastructure/schemas/intention.schema';
import { MemoryRollupEntity } from '../infrastructure/schemas/memory-rollup.schema';
import { CortexConfigService } from './cortex-config.service';

/**
 * Construye los prompts (system + user) que se envían a Claude.
 *
 * Diseño:
 *   - System prompt FIJO entre runs (cacheable por Anthropic prompt cache).
 *     Se puede sobreescribir en runtime via CortexConfigService — si
 *     admin-dashboard guardó un prompt custom en Mongo, se usa ese; si no,
 *     el default hardcoded de abajo (DEFAULT_SYSTEM_PROMPT).
 *   - User prompt cambia con cada world snapshot.
 *   - Historial reciente de intenciones + outcomes ayuda al modelo a
 *     calibrar (lo que propuso antes funcionó? falló?).
 */
@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  constructor(private readonly configService: CortexConfigService) {}

  /**
   * System prompt de MyCortex. Define rol, capas del sistema, qué hacer y
   * qué NO hacer. Estable entre invocaciones para que Anthropic prompt
   * cache lo retenga (descuento ~90% en input tokens cacheados).
   *
   * Lee primero la config en Mongo. Si está vacía o falla la lectura,
   * cae al DEFAULT_SYSTEM_PROMPT — defensa para que un admin que borró
   * el prompt en la UI no rompa MyCortex. El caller no necesita saber
   * si el prompt vino de DB o del default.
   */
  async buildSystemPrompt(): Promise<string> {
    try {
      const config = await this.configService.get();
      const custom = (config.systemPrompt ?? '').trim();
      if (custom.length > 100) {
        // Sanity check: si alguien guardó algo absurdamente corto (e.g. ""),
        // ignoramos y usamos default. 100 chars es un floor razonable —
        // un prompt útil nunca es así de corto.
        return custom;
      }
      if (custom.length > 0) {
        this.logger.warn(
          `Prompt custom muy corto (${custom.length} chars) — usando default por seguridad`,
        );
      }
    } catch (e) {
      this.logger.warn(`Error leyendo cortex config: ${(e as Error).message} — usando default`);
    }
    return DEFAULT_SYSTEM_PROMPT;
  }

  /** Útil para mostrar el default en la UI (botón "restaurar default"). */
  getDefaultSystemPrompt(): string {
    return DEFAULT_SYSTEM_PROMPT;
  }

  /**
   * User prompt que incluye el world snapshot + memoria reciente +
   * rollups de las últimas semanas (memoria de largo plazo, Etapa D).
   */
  buildUserPrompt(args: {
    snapshot:           WorldSnapshot;
    recentIntentions:   IntentionEntity[];
    memoryRollups?:     MemoryRollupEntity[];
    nowIso:             string;
  }): string {
    const { snapshot, recentIntentions, memoryRollups, nowIso } = args;

    const sections: string[] = [
      `# Hora actual: ${nowIso} (Ecuador UTC-5)`,
      '',
      `# World snapshot (snapshot.generatedAt=${snapshot.generatedAt})`,
      `Health: ${snapshot.systemHealth} | Críticas: ${snapshot.totalCriticalAnomalies} | Warnings: ${snapshot.totalWarnings}`,
      '',
      this.formatAgentsSection(snapshot),
      '',
      this.formatAnomaliesSection(snapshot),
      '',
      this.formatProposedActionsSection(snapshot),
      '',
      this.formatBusinessSection(snapshot),
    ];

    if (snapshot.changedSinceLast) {
      sections.push('', `# Cambios vs snapshot anterior`);
      sections.push(`- ${snapshot.changedSinceLast.description}`);
      sections.push(`- nuevas críticas: ${snapshot.changedSinceLast.newCriticalCount}, resueltas: ${snapshot.changedSinceLast.resolvedCriticalCount}`);
    }

    if (recentIntentions.length > 0) {
      sections.push('', `# Tus intenciones recientes (${recentIntentions.length})`);
      for (const i of recentIntentions.slice(0, 10)) {
        const outcomeStr = i.outcome === 'unknown' ? '(sin outcome aún)' : `→ outcome: ${i.outcome}`;
        sections.push(`- [${i.status}] ${i.type} (urgency ${i.urgency.toFixed(2)}): ${i.suggestedAction.slice(0, 100)}... ${outcomeStr}`);
      }
    }

    // Memoria de largo plazo — últimos 4 rollups semanales (Etapa D).
    if (memoryRollups && memoryRollups.length > 0) {
      sections.push('', `# Memoria estratégica (últimas ${memoryRollups.length} semanas)`);
      sections.push('Usá esta info para detectar patrones recurrentes y calibrar urgencia. Si un type aparece semana tras semana sin solución, escalá. Si un type recurrió y se ejecutó effective, podés bajar urgencia.');
      for (const r of memoryRollups) {
        sections.push(`- ${r.summary}`);
        if (r.byType.length > 0) {
          const topTypes = r.byType.slice(0, 3).map(t =>
            `${t.type}=${t.count}(exec ${t.executedCount})`
          ).join(', ');
          sections.push(`  top types: ${topTypes}`);
        }
      }
    }

    sections.push('', `# Tu turno`);
    sections.push('Razoná y propone intenciones siguiendo el formato del system prompt.');

    return sections.join('\n');
  }

  private formatAgentsSection(s: WorldSnapshot): string {
    const lines = ['## Agentes'];
    for (const a of (s.agents ?? [])) {
      const fresh = a.lastRunAt
        ? `${a.ageMinutes}min ago, status=${a.lastStatus}`
        : 'sin datos en ventana';
      // Agents sin datos vienen del cerebro sin el campo `metrics`. Guard
      // contra Object.entries(undefined) — TypeError fatal en runtime.
      const metricsStr = Object.entries(a.metrics ?? {})
        .filter(([_, v]) => typeof v === 'number')
        .map(([k, v]) => `${k}=${v}`)
        .slice(0, 8)
        .join(', ');
      lines.push(`- ${a.agentId} (${fresh}) crit=${a.criticalCount} warn=${a.warningCount}`);
      if (metricsStr) lines.push(`    ${metricsStr}`);
    }
    return lines.join('\n');
  }

  private formatAnomaliesSection(s: WorldSnapshot): string {
    const list = s.activeAnomalies ?? [];
    if (list.length === 0) return '## Anomalías activas\n- (ninguna)';
    const lines = ['## Anomalías activas (top 30)'];
    for (const a of list) {
      const emoji = a.severity === 'critical' ? '🚨' : '⚠️';
      lines.push(`- ${emoji} [${a.agentId}] ${a.type}: ${a.message}`);
    }
    return lines.join('\n');
  }

  private formatProposedActionsSection(s: WorldSnapshot): string {
    const list = s.topProposedActions ?? [];
    if (list.length === 0) {
      return '## Acciones propuestas por agentes\n- (ninguna)';
    }
    const lines = ['## Acciones propuestas por agentes (top 10 por urgency)'];
    for (const p of list) {
      lines.push(`- [${p.agentId}] ${p.type} (urgency ${p.urgency.toFixed(2)}): ${p.reason}`);
    }
    return lines.join('\n');
  }

  /**
   * Sección de business KPIs — organiza tácticos vs estratégicos, y al final
   * lista los KPIs PENDIENTES (cuya data source no está implementada) para
   * que MyCortex pueda emitir intentions human_only de implementación cuando
   * los necesite.
   *
   * Lo "available pero null" no se muestra (evita ruido). Lo "available
   * con dato" se agrupa por dominio. Lo "pending" se lista al final
   * para visibilidad estratégica.
   */
  private formatBusinessSection(s: WorldSnapshot): string {
    const business = (s.business ?? {}) as Record<string, number | undefined>;

    // Agrupación temática — más legible que lista plana de 30 campos.
    const sections: Array<{ title: string; keys: string[] }> = [
      {
        title: 'Demanda + supply (ops)',
        keys: [
          'pendingRidesNoDriver', 'idleDrivers', 'activeDrivers',
          'dailyRidesCompleted', 'dailyRidesCancelled', 'dailyGoingRevenue',
          'ridesCompleted7d', 'avgRideValueUsd', 'rideCompletionRate',
          'newDriverSignups7d', 'activeDrivers7d',
        ],
      },
      {
        title: 'Revenue + finanzas (financial)',
        keys: [
          'weeklyRevenueUsd', 'weeklyRevenueChangePct',
          'monthlyRevenueCurrent', 'monthlyRevenueProjected', 'monthlyOnTrack',
          'pendingPayoutsCount', 'pendingPayoutsAmount',
          'suspiciousDriversCount',
        ],
      },
      {
        title: 'Marketing + alcance',
        keys: ['totalReach', 'totalEngagement', 'platformsActive'],
      },
      {
        title: 'Soporte (customer-support)',
        keys: [
          'activeConversations',
          'pendingHandoffsRed', 'pendingHandoffsOrange', 'pendingHandoffsNormal',
          'oldestRedHandoffAgeMinutes',
        ],
      },
      {
        title: 'Content + Code (content + going)',
        keys: ['weeklyTipPublished', 'draftsCount', 'inReviewCount',
               'toolCallsLastCycle', 'fixesAppliedLastCycle'],
      },
    ];

    // KPIs pendientes (sin data source). MyCortex los ve y puede emitir
    // intentions human_only tipo "implement DAU tracking" cuando vea valor.
    const PENDING_KPIS: Array<{ key: string; reason: string }> = [
      { key: 'dailyActivePassengers',   reason: 'requiere session tracking' },
      { key: 'monthlyActivePassengers', reason: 'requiere ventana 30d + session tracking' },
      { key: 'signupToFirstRideRate',   reason: 'requiere users.firstRideAt o aggregation pesada' },
      { key: 'monthlyChurnRate',        reason: 'requiere ventana 30d + definir churn' },
      { key: 'pendingInvoicesCount',    reason: 'requiere query a Datil filtro estado!=AUTHORIZED' },
      { key: 'pendingInvoicesAmountUsd',reason: 'requiere rides con invoiceId null' },
      { key: 'weeklyFollowerGrowth',    reason: 'requiere historial follower count' },
      { key: 'avgHandoffResponseMin',   reason: 'requiere timestamp at first operator reply' },
      { key: 'handoffResolutionRate',   reason: 'requiere ventana + resolved field tracking' },
      { key: 'npsScore',                reason: 'requiere encuestas post-ride (no implementadas)' },
    ];

    const lines: string[] = ['## Métricas de negocio'];
    let anyValue = false;

    for (const sec of sections) {
      const items = sec.keys
        .filter(k => typeof business[k] === 'number')
        .map(k => `  - ${k}: ${business[k]}`);
      if (items.length > 0) {
        lines.push(`### ${sec.title}`);
        lines.push(...items);
        anyValue = true;
      }
    }

    if (!anyValue) {
      lines.push('- (sin datos en ventana)');
    }

    // Lista pending KPIs siempre (info estratégica para MyCortex)
    lines.push('', '### 🔴 KPIs estratégicos pendientes (data source no implementada)');
    lines.push(
      'Cuando notes que necesitarías estos para razonar mejor, emití una intention',
      'human_only proponiendo implementar la data source correspondiente:',
    );
    for (const p of PENDING_KPIS) {
      lines.push(`  - **${p.key}** — ${p.reason}`);
    }

    return lines.join('\n');
  }
}

// ─── Prompt default ───────────────────────────────────────────
//
// El system prompt baseline. Si admin-dashboard no guardó override en Mongo,
// usamos este. Editar acá requiere redeploy — el path normal de edición es
// la UI del admin. Lo mantengo en código como fallback por seguridad.

const DEFAULT_SYSTEM_PROMPT = `Eres MyCortex, capa cognitiva del sistema operativo de Going Ecuador
(plataforma de transporte y turismo). Tu trabajo es leer el estado del
sistema (world snapshot) cada 30 minutos y proponer intenciones
priorizadas que prevengan problemas ANTES de que ocurran.

# Las 4 capas del sistema (de abajo a arriba)

1. **Código + infra**: microservicios NestJS, MongoDB Atlas, Cloud Run.
2. **Agentes** (6): ops-agent (monitoreo viajes/conductores), financial-agent
   (revenue, fraude, SRI), content-agent (tip semanal público al canal
   Telegram), marketing-agent (métricas 9 redes), going-agent (autonomous
   code agent que lee Cloud Run logs), customer-support-service (chat
   WhatsApp/Telegram con escalamiento a humanos).
3. **Orchestrator** (NO existe aún): cuando exista, ejecutará tus
   intenciones. Por ahora tus propuestas las recibe ops humano por Telegram.
4. **Tú (MyCortex)**: razonas sobre patrones, anticipas, propones.

# Qué SÍ hacer

- Leer el world snapshot completo, no solo las anomalías.
- Razonar sobre patrones cross-agente (ej: drop en oferta de drivers +
  hora pico próxima → proponer bono).
- Priorizar por impacto y urgencia (no todo es 1.0).
- Proponer acciones CONCRETAS, no vaguedades ("contactar a Juan", no
  "mejorar la comunicación").
- Estimar expiresAt cuando aplique (oportunidad temporal).
- Detectar problemas que los agentes individuales no pueden ver (porque
  cada agente solo ve su slice).

# Qué NO hacer

- NO repitas anomalías que los agentes ya están reportando — el ops humano
  ya las recibe directo. Tu valor es VER LO QUE FALTA.
- NO propongas acciones que ningún agente puede ejecutar (ej: "contratar
  más operadores" no es accionable a 30 min — sí es accionable
  "redistribuir operadores existentes a turno X").
- NO inventes datos que no están en el world snapshot. Si necesitás algo
  que no tenés, decilo en el reason.
- NO uses urgency 1.0 a menos que sea verdaderamente crítico (vidas en
  riesgo, dinero perdiéndose por minuto). 0.7-0.9 = importante;
  0.4-0.6 = útil; 0.0-0.3 = informacional.
- NO propongas verificaciones genéricas de pipeline / observabilidad /
  data quality. Asumí que la infra está OK a menos que veas error
  EXPLÍCITO en una anomalía o que un agente esté reportando "failure" en
  status. \`lastRunAt: null\` solo significa que el agente no ha corrido en
  la ventana — puede ser perfectamente normal si su cron es semanal o si
  el sistema acaba de empezar (warm-up post-deploy puede tardar 24-48h
  hasta que todos los crons disparen su ciclo natural).
- NO confundas "warm-up del sistema" con "anomalía". Si la mayoría de
  agents tienen \`lastRunAt: null\` Y no hay anomalías críticas reportadas,
  el sistema probablemente está empezando — no propongas acciones de
  emergencia, solo observá.

# Contexto de cron natural de cada agente (relevante para interpretar lastRunAt)

- ops-agent: cada 15 min (Cloud Scheduler */15 * * * *)
- financial-agent: 4 veces al día (8am, 9am, 12pm, 8pm Ecuador)
- content-agent: lunes 9am Ecuador (semanal)
- marketing-agent: lunes 9am Ecuador (semanal)
- going-agent: cada 6h (UTC)
- customer-support-service: cron interno cada 10 min (HTTP service always-on)

Esto significa que en cualquier ventana de 30 min, esperar datos frescos
de **ops-agent y customer-support-service**. El resto puede tener
\`lastRunAt\` de hace horas o días y eso es NORMAL.

# Formato de output (OBLIGATORIO)

Razoná primero en texto plano (3-5 oraciones máximo). Después emití un
bloque \`\`\`json con un array de intenciones:

\`\`\`json
[
  {
    "type": "string-snake-case",
    "urgency": 0.0-1.0,
    "target": "string opcional (zona, driverId, userId, etc.)",
    "reason": "1-2 oraciones por qué",
    "suggestedAction": "qué hacer concretamente",
    "expiresAt": "ISO8601 opcional",
    "data": { /* contexto extra opcional */ }
  }
]
\`\`\`

Si no hay intenciones que valgan la pena (sistema healthy, sin patrones
preocupantes), emití un array vacío \`[]\`. NO inventes intenciones por
inventar.

Máximo 5 intenciones por ciclo. Calidad > cantidad.`;
