/**
 * Fase A del cerebro autónomo — Allowlist explícita.
 *
 * El dispatcher ya respeta `executeEnabled`, `MAX_AUTO_LEVEL` y
 * `agent_paused`. Pero esos gates son *amplios* — "cualquier Cat 2 puede
 * auto-ejecutar". Eso significa que si mañana alguien clasifica
 * mal una regla (ej. baja `boost_driver_supply` a Cat 2), se ejecuta
 * automáticamente sin más review.
 *
 * Esta allowlist es la *segunda capa*: defensiva, granular, por
 * `intent.type`. Solo lo que está acá puede ejecutarse autónomamente
 * SIN ack humano — independiente de su safety level configurado.
 *
 * Pensá esta lista como "los runbooks que el cerebro tiene permiso de
 * correr a las 3 AM sin despertar al founder".
 *
 * Cómo agregar una nueva entrada:
 *   1. La acción tiene un endpoint idempotente en el agent.
 *   2. La acción tiene una *métrica observable* que mejora si la acción
 *      funcionó (sino no podemos verificar).
 *   3. La acción es reversible o "soft" (no escribe dinero, no manda
 *      mass-comms, no borra user data).
 *   4. Pasaron al menos 5 ejecuciones manuales exitosas con el patrón.
 */

export interface AutonomousEntry {
  /** Tipo de intención que MyCortex emite (matchea `intent.type`). */
  intentType: string;

  /**
   * Umbral mínimo de urgency del intent para auto-ejecutar. Pensar como
   * "qué tan seguro tiene que estar MyCortex de que esta acción es la
   * correcta". 0.85 es un buen default conservador.
   */
  minUrgency: number;

  /**
   * Verificación post-ejecución. Idea: la acción se ejecuta → esperamos
   * `waitMs` → consultamos la métrica → debe haber cambiado en la dirección
   * esperada al menos `minDelta`. Si no convergió, alertamos.
   *
   * Las callbacks reales viven en `action-verifier.service.ts` porque
   * necesitan acceso a Mongo / agents. Acá solo declaramos el *contrato*.
   */
  verify: {
    /** Nombre del verificador (matchea a un método de ActionVerifier). */
    verifierKey: string;
    description: string;
    /** Cómo debería cambiar la métrica si la acción funcionó. */
    direction: 'decrease' | 'increase';
    /** Cuánto esperar antes de medir post-acción (ms). */
    waitMs: number;
    /** Cambio mínimo absoluto para considerar "convergió". */
    minDelta: number;
  };

  /**
   * Qué hacer si la verificación dice "no convergió". 'alert_only' es el
   * default seguro — el cerebro avisa y un humano decide. 'rollback' solo
   * para acciones que tienen un endpoint de rollback explícito y testeado.
   */
  onVerifyFail: 'alert_only' | 'rollback';

  /**
   * Si onVerifyFail='rollback', qué acción ejecutar para revertir.
   */
  rollback?: {
    agentId: string;
    action: string;
    description: string;
  };

  /**
   * Notas para el equipo. Documentación inline de por qué esta acción
   * está en la allowlist y bajo qué supuestos.
   */
  notes: string;
}

/**
 * V1 — empezamos con UNA SOLA entrada para validar el flujo end-to-end.
 * Después de 1 semana de observación sin falsos positivos, agregamos más.
 */
export const AUTONOMOUS_ALLOWLIST: AutonomousEntry[] = [
  {
    intentType: 'cleanup_stale_customer_handoffs',
    minUrgency: 0.85,
    verify: {
      verifierKey: 'pending_red_handoffs',
      description: 'cantidad de conversations con status:handoff + priority:RED + createdAt > 24h',
      direction: 'decrease',
      waitMs: 30_000, // 30s — Mongo update es rápido, no hace falta esperar más
      minDelta: 1, // que haya cerrado al menos 1
    },
    onVerifyFail: 'alert_only',
    // No rollback automático: el cleanup marca status='auto_closed_stale'
    // (no borra). Si un operador necesita reabrir, lo hace manualmente
    // desde admin dashboard. Más seguro que un rollback automático que
    // podría re-abrir 50 handoffs viejos legítimos.
    notes:
      'Primera acción autónoma. Caso de uso: founder fuera de horario + 13 RED handoffs >24h ' +
      'esperando. MyCortex emite con urgency 0.95. La acción es soft (marca, no borra).',
  },
  {
    // Caso de uso: voice-call-service detecta 5+ calls del mismo número en
    // 15min y publica `suspicious_call_pattern` al cerebro. MyCortex razona
    // sobre el patrón (volumen, hora del día, sentiment del transcript) y
    // emite Intention `block_voice_caller` con urgency 0.7-0.95 según
    // severidad. El orchestrator ejecuta block_caller_temporarily contra
    // voice-call-service que mete el número a blocklist in-memory por TTL.
    // El verifier consulta GET /voice/metrics/active-blocks y confirma que
    // el caller quedó bloqueado.
    //
    // Reversible por TTL: el block dura 60min máx (configurable per-call).
    // Si el orchestrator se equivoca, el block expira solo. Blast radius
    // mínimo: un solo número bloqueado por 1 hora.
    intentType: 'block_voice_caller',
    minUrgency: 0.7,
    verify: {
      verifierKey: 'active_voice_block_for_caller',
      description: 'cantidad de active blocks para el caller específico (esperamos 1 post-acción)',
      direction: 'increase',
      waitMs: 10_000, // 10s — voice-call-service responde sub-segundo, este margin cubre red latency
      minDelta: 1,
    },
    onVerifyFail: 'alert_only',
    // No rollback: blocklist es in-memory. Si el verifier falla, lo más
    // probable es que la instancia voice-call-service reinició entre el
    // dispatch y la verify (cold start o redeploy). Alerta y deja que
    // el cerebro lo intente en el próximo ciclo.
    notes:
      'Segunda acción autónoma. Caso de uso: spammer marca 8 veces en 12 min, mycortex emite ' +
      'urgency 0.85. El TTL del block es 60min — si nos equivocamos, blast radius es 1h de un ' +
      'caller. Idempotente: re-bloquear extiende el TTL al máximo.',
  },
];

/**
 * Lookup por intent.type. Devuelve null si la acción NO está en la
 * allowlist — en ese caso, aunque sea Cat 2 y dentro de MAX_AUTO_LEVEL,
 * NO se auto-ejecuta. Se queda dormant con razón 'not_in_allowlist'.
 */
export function findAutonomousEntry(intentType: string): AutonomousEntry | null {
  return AUTONOMOUS_ALLOWLIST.find((e) => e.intentType === intentType) ?? null;
}
