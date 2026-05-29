import { Injectable, Logger } from '@nestjs/common';
import type { IntentionInput } from './intentions-parser.service';

/**
 * Anomaly type shape — copia local de world-snapshot.client.ts para no
 * importar el cliente (este service es puro y testeable sin Mongoose/HTTP).
 */
interface Anomaly {
  agentId:    string;
  type:       string;
  severity:   string;
  message:    string;
  detectedAt: string;
  data?:      Record<string, unknown>;
}

/**
 * Una regla de translation: dado un anomaly que matchea su `matches()`,
 * devuelve una Intention. Si no matchea, devuelve null.
 *
 * Las reglas son deterministas — corren ANTES del LLM para garantizar que
 * patrones críticos no dependan de que Claude "se acuerde". El LLM sigue
 * razonando en paralelo y puede emitir Intentions adicionales sobre el
 * mismo anomaly desde otro ángulo (ej. tendencia a largo plazo).
 */
interface AnomalyRule {
  /** ID corto para logging — único por regla. */
  id: string;
  /** Anomaly type que matchea. Si quieres matchear varios, usar OR fn. */
  matches: (a: Anomaly) => boolean;
  /** Construir la Intention. Null si los datos no son suficientes. */
  build: (a: Anomaly) => IntentionInput | null;
}

/**
 * Servicio determinístico que traduce anomalies del WorldSnapshot a Intentions
 * sin depender del LLM. Se invoca en `reasoning-loop.service.ts:runOnce()` ANTES
 * de llamar a Claude. Las Intentions rule-based se mezclan con las del LLM en
 * el mismo cycleId — el orchestrator las consume indistintamente.
 *
 * **Por qué reglas determinísticas + LLM:**
 *  - Patrones críticos de seguridad (spam voice, fraud signals) no pueden
 *    depender de que Claude esté de buen humor o que el prompt esté bien
 *    redactado. Las reglas son la última línea de defensa.
 *  - LLM sigue agregando valor para anomalies complejas o multi-señal
 *    (ej. "driver pool drop + weather event + payday + holiday").
 *
 * **Cómo agregar una nueva regla:**
 *  1. Asegurate que el orchestrator-service tiene la rule mapeada en
 *     RULES (rules-engine.service.ts) y la action en allowlist.
 *  2. Agregá una entrada al array `rules` abajo con id, matches, build.
 *  3. Test (idealmente `*.spec.ts`).
 *
 * Idempotencia: este service NO chequea si la misma Intention fue emitida
 * en ciclos anteriores. El reasoning-loop puede agregar dedupe contra
 * `repo.topPending()` si quisiéramos. Por ahora, aceptamos que la misma
 * anomalía persistente genere Intentions consecutivas — el orchestrator
 * es idempotente (re-block extiende TTL, no duplica).
 */
@Injectable()
export class AnomalyRulesService {
  private readonly logger = new Logger(AnomalyRulesService.name);

  /**
   * Registry de reglas. Orden importa solo para logging — todas las que
   * matchean se ejecutan independientemente.
   */
  private readonly rules: AnomalyRule[] = [
    // ─── Rule: spammer voice caller ──────────────────────────
    // Trigger: voice-call-service publica 'suspicious_call_pattern' cuando
    // detecta 5+ calls del mismo número en 15 min (configurable via env).
    // Acción: bloquear el número 60 min via voice-command.block_caller_temporarily.
    {
      id: 'spammer-voice-caller',
      matches: (a) =>
        a.type === 'suspicious_call_pattern' &&
        typeof a.data?.from === 'string' &&
        typeof a.data?.count === 'number',
      build: (a) => {
        const from  = a.data!.from as string;
        const count = a.data!.count as number;

        // Urgency clamp 0.7-0.95.
        //   5 calls → 0.7 (mínimo para auto-block, justo por encima del
        //             threshold de allowlist)
        //   8 calls → 0.85
        //   10+ calls → 0.95 (máximo — la regla nunca emite ack-required)
        const rawUrgency = 0.7 + (count - 5) / 10;
        const urgency = Math.min(0.95, Math.max(0.7, rawUrgency));

        return {
          type:    'block_voice_caller',
          target:  from,
          urgency: Number(urgency.toFixed(2)),
          reason:
            `voice-call-service reportó ${count} llamadas en ventana de detección — patrón sospechoso`,
          suggestedAction:
            `Bloquear ${from} 60 minutos via voice-call-service /voice/command block_caller_temporarily`,
          // Las Intentions expiran a los 30 min — si el orchestrator no las
          // procesa en su ciclo de poll (max 5 min lag), igual quedan
          // ejecutables. Más allá de 30 min asumimos que el patrón ya cesó
          // o ops intervino manualmente.
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          data: {
            durationMinutes: 60,
            from,
            count,
            sourceAnomaly:   'suspicious_call_pattern',
          },
        };
      },
    },

    // ─── Rule: stale RED handoffs (customer support) ────────
    // Trigger: customer-support-service publica `high_pending_red_handoffs`
    // cuando detecta >N handoffs RED + status:open + createdAt > 24h.
    // Acción: cleanup_stale_customer_handoffs (allowlist entry V1, ya
    // verificada con verifierKey 'pending_red_handoffs').
    //
    // PUBLISHER TODO: customer-support-service no emite esta anomaly aún.
    // Cuando se implemente, esta regla la procesa automáticamente. Mientras
    // tanto la regla está dormant — `matches()` retorna false en producción.
    {
      id: 'stale-customer-handoffs',
      matches: (a) =>
        a.type === 'high_pending_red_handoffs' &&
        typeof a.data?.count === 'number',
      build: (a) => {
        const count = a.data!.count as number;
        // Urgency clamp 0.85-0.98 (la action ya tiene minUrgency 0.85).
        //   10 handoffs → 0.85, 20 → 0.92, 30+ → 0.98
        const urgency = Math.min(0.98, Math.max(0.85, 0.85 + (count - 10) / 100));
        return {
          type:    'cleanup_stale_customer_handoffs',
          urgency: Number(urgency.toFixed(2)),
          reason:
            `customer-support reportó ${count} handoffs RED con status:open > 24h — risk de pérdida de tickets`,
          suggestedAction:
            `Marcar como auto_closed_stale los handoffs RED viejos via /support/command cleanup_stale`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          data: {
            sourceAnomaly: 'high_pending_red_handoffs',
            count,
          },
        };
      },
    },

    // ─── Rule: voice AI loop stuck (handoff requested sin transfer) ──
    // Trigger: voice-call-service detecta que ctx.handoffRequested=true
    // pero ctx.handoffTransferred=false por > 90s (AI dijo "te paso con
    // alguien" pero el redirect PSTN nunca confirmó).
    // Acción: force_handoff_current_call via /voice/command — fuerza
    // redirect PSTN o callback notification al operador.
    //
    // Loop completo: voice-call-service emite voice_handoff_stuck (publisher
    // publishHandoffStuck), esta rule lo traduce a Intention force_handoff_voice_call,
    // orchestrator dispatcher rutea a voice-call POST /voice/command, y el
    // ActionVerifier mide voice_call_pending_handoff via /voice/metrics/handoff-pending.
    // Allowlist entry: AUTONOMOUS_ALLOWLIST[2] en orchestrator-service.
    {
      id: 'voice-handoff-stuck',
      matches: (a) =>
        a.type === 'voice_handoff_stuck' &&
        typeof a.data?.callId === 'string',
      build: (a) => {
        const callId = a.data!.callId as string;
        const ageSeconds = (a.data?.ageSeconds as number) ?? 90;
        return {
          type:    'force_handoff_voice_call',
          target:  callId,
          urgency: 0.9, // siempre alta — el caller está esperando
          reason:
            `voice-call-service detectó handoff stuck en callId=${callId.slice(0, 12)} hace ${ageSeconds}s — AI dijo "te paso" pero PSTN redirect no confirmó`,
          suggestedAction:
            `Forzar redirect PSTN o callback notification via /voice/command force_handoff_current_call`,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          data: {
            sourceAnomaly: 'voice_handoff_stuck',
            callId,
            ageSeconds,
            reason: 'ops_forced_due_to_stuck_handoff',
          },
        };
      },
    },

    // ─── Próximas reglas a agregar (placeholders documentados) ──
    // - `driver_compliance_expired`: si un driver activo tiene documentos
    //   vencidos hace > X horas, emit `suspend_driver_documents`.
    // - `payment_gateway_degraded`: si Datafast error rate > 30% en 10 min,
    //   emit `switch_payment_fallback` (TODO action).
    // - `surge_demand_drop`: si demanda de viajes cae >50% vs baseline en
    //   3h, emit `boost_driver_supply_notification`.
  ];

  /**
   * Traduce un array de anomalies a Intentions. Mantiene el orden de los
   * matches encontrados. NO publica — solo construye. El reasoning-loop
   * las persiste con saveMany().
   *
   * Telemetría: loguea matches con id de regla + summary de la anomaly
   * (para auditoría en Cloud Logging).
   */
  translate(anomalies: Anomaly[]): IntentionInput[] {
    if (!anomalies || anomalies.length === 0) return [];

    const intentions: IntentionInput[] = [];
    for (const anomaly of anomalies) {
      for (const rule of this.rules) {
        if (!rule.matches(anomaly)) continue;
        try {
          const intention = rule.build(anomaly);
          if (intention) {
            intentions.push(intention);
            this.logger.log(
              `[rule:${rule.id}] anomaly ${anomaly.type} from ${anomaly.agentId} → ` +
              `intention ${intention.type} urgency=${intention.urgency}`,
            );
          }
        } catch (e) {
          // Una regla rota no debe romper el ciclo entero — log y continuar.
          this.logger.error(
            `[rule:${rule.id}] build threw: ${(e as Error).message} — anomaly: ${JSON.stringify(anomaly).slice(0, 200)}`,
          );
        }
      }
    }

    if (intentions.length > 0) {
      this.logger.log(
        `[rules] ${intentions.length} intention(es) generadas determinísticamente de ${anomalies.length} anomalía(s)`,
      );
    }
    return intentions;
  }

  /**
   * Útil para tests y debug — listar los IDs de reglas registradas.
   */
  registeredRules(): string[] {
    return this.rules.map((r) => r.id);
  }
}
