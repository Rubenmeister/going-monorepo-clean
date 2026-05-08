import { Injectable } from '@nestjs/common';
import { WorldSnapshot } from './world-snapshot.client';
import { IntentionEntity } from '../infrastructure/schemas/intention.schema';

/**
 * Construye los prompts (system + user) que se envían a Claude.
 *
 * Diseño:
 *   - System prompt FIJO entre runs (cacheable por Anthropic prompt cache).
 *   - User prompt cambia con cada world snapshot.
 *   - Historial reciente de intenciones + outcomes ayuda al modelo a
 *     calibrar (lo que propuso antes funcionó? falló?).
 */
@Injectable()
export class PromptBuilderService {

  /**
   * System prompt de MyCortex. Define rol, capas del sistema, qué hacer y
   * qué NO hacer. Estable entre invocaciones para que Anthropic prompt
   * cache lo retenga (descuento ~90% en input tokens cacheados).
   */
  buildSystemPrompt(): string {
    return `Eres MyCortex, capa cognitiva del sistema operativo de Going Ecuador
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
  }

  /**
   * User prompt que incluye el world snapshot + memoria reciente.
   */
  buildUserPrompt(args: {
    snapshot:           WorldSnapshot;
    recentIntentions:   IntentionEntity[];
    nowIso:             string;
  }): string {
    const { snapshot, recentIntentions, nowIso } = args;

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

    sections.push('', `# Tu turno`);
    sections.push('Razoná y propone intenciones siguiendo el formato del system prompt.');

    return sections.join('\n');
  }

  private formatAgentsSection(s: WorldSnapshot): string {
    const lines = ['## Agentes'];
    for (const a of s.agents) {
      const fresh = a.lastRunAt
        ? `${a.ageMinutes}min ago, status=${a.lastStatus}`
        : 'sin datos en ventana';
      const metricsStr = Object.entries(a.metrics)
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
    if (s.activeAnomalies.length === 0) return '## Anomalías activas\n- (ninguna)';
    const lines = ['## Anomalías activas (top 30)'];
    for (const a of s.activeAnomalies) {
      const emoji = a.severity === 'critical' ? '🚨' : '⚠️';
      lines.push(`- ${emoji} [${a.agentId}] ${a.type}: ${a.message}`);
    }
    return lines.join('\n');
  }

  private formatProposedActionsSection(s: WorldSnapshot): string {
    if (s.topProposedActions.length === 0) {
      return '## Acciones propuestas por agentes\n- (ninguna)';
    }
    const lines = ['## Acciones propuestas por agentes (top 10 por urgency)'];
    for (const p of s.topProposedActions) {
      lines.push(`- [${p.agentId}] ${p.type} (urgency ${p.urgency.toFixed(2)}): ${p.reason}`);
    }
    return lines.join('\n');
  }

  private formatBusinessSection(s: WorldSnapshot): string {
    const entries = Object.entries(s.business)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `- ${k}: ${v}`);
    if (entries.length === 0) return '## Métricas de negocio\n- (sin datos)';
    return ['## Métricas de negocio', ...entries].join('\n');
  }
}
