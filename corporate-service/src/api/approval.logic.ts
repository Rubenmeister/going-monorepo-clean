/**
 * Lógica PURA de la cadena de aprobación corporativa multinivel (sin Mongo/HTTP).
 * Una reserva que requiere aprobación recorre uno o varios niveles según su monto
 * (p. ej. manager → finanzas → dirección). Un rechazo en cualquier nivel termina
 * el flujo; sólo cuando el último nivel aprueba la reserva queda aprobada.
 */

export type StepStatus = 'pending' | 'approved' | 'rejected';
export type WorkflowStatus = 'pending' | 'approved' | 'rejected';

/** Configuración de un nivel de aprobación (vive en CompanySettings.approvalLevels). */
export interface ApprovalLevelConfig {
  level: number;
  /** Etiqueta del rol que decide en este nivel (manager | finance | director…). */
  role?: string;
  /** Aprobador asignado explícito (opcional). */
  approverId?: string;
  /** El nivel sólo aplica si el monto de la reserva alcanza este umbral. */
  minAmount?: number;
}

/** Un paso de la cadena, tal como se persiste en el workflow. */
export interface ApprovalStep {
  level: number;
  role: string;
  approverId: string;
  status: StepStatus;
  decidedBy: string | null;
  decidedAt: Date | null;
  comments: string;
}

export interface DecisionResult {
  chain: ApprovalStep[];
  currentLevel: number;
  status: WorkflowStatus;
  /** true si el flujo quedó cerrado (aprobado o rechazado), false si avanzó de nivel. */
  finalized: boolean;
  /** false si no había un paso pendiente en currentLevel (decisión ignorada). */
  changed: boolean;
}

/** Por defecto: un solo nivel (manager) para cualquier monto. Compatible con el modelo previo. */
export const DEFAULT_APPROVAL_LEVELS: ApprovalLevelConfig[] = [
  { level: 1, role: 'manager', minAmount: 0 },
];

/**
 * Construye la cadena de pasos pendientes para una reserva de monto `amount`.
 * Aplica todos los niveles cuyo `minAmount` <= amount (escalado por monto). Si
 * ninguno aplica (monto por debajo de todos los umbrales) usa el nivel más bajo,
 * de modo que siempre haya al menos un aprobador.
 */
export function buildApprovalChain(
  amount: number,
  levels?: ApprovalLevelConfig[] | null,
): ApprovalStep[] {
  const cfg = (levels && levels.length ? levels : DEFAULT_APPROVAL_LEVELS)
    .slice()
    .sort((a, b) => a.level - b.level);

  let applicable = cfg.filter((l) => amount >= (l.minAmount ?? 0));
  if (applicable.length === 0) applicable = [cfg[0]];

  return applicable.map((l) => ({
    level: l.level,
    role: l.role ?? '',
    approverId: l.approverId ?? '',
    status: 'pending' as StepStatus,
    decidedBy: null,
    decidedAt: null,
    comments: '',
  }));
}

/** Nivel pendiente más bajo de la cadena (el que debe decidir ahora). */
export function firstPendingLevel(chain: ApprovalStep[]): number {
  const pending = chain
    .filter((s) => s.status === 'pending')
    .sort((a, b) => a.level - b.level);
  return pending.length ? pending[0].level : 0;
}

/**
 * Aplica una decisión sobre el paso pendiente en `currentLevel`.
 * - rechazo  → ese paso queda rejected y el flujo termina como 'rejected'.
 * - aprobado → ese paso queda approved; si hay un nivel pendiente superior el
 *   flujo avanza (sigue 'pending'); si era el último, el flujo queda 'approved'.
 */
export function applyDecision(
  chain: ApprovalStep[],
  currentLevel: number,
  decision: 'approved' | 'rejected',
  decidedBy: string,
  comments = '',
  now: Date = new Date(),
): DecisionResult {
  const next = chain.map((s) => ({ ...s }));
  const idx = next.findIndex(
    (s) => s.level === currentLevel && s.status === 'pending',
  );

  if (idx === -1) {
    // No hay paso pendiente en este nivel: el flujo ya estaba resuelto.
    return {
      chain: next,
      currentLevel,
      status: deriveStatus(next),
      finalized: true,
      changed: false,
    };
  }

  next[idx] = {
    ...next[idx],
    status: decision,
    decidedBy,
    decidedAt: now,
    comments: comments ?? '',
  };

  if (decision === 'rejected') {
    return { chain: next, currentLevel, status: 'rejected', finalized: true, changed: true };
  }

  const upcoming = next
    .filter((s) => s.level > currentLevel && s.status === 'pending')
    .sort((a, b) => a.level - b.level)[0];

  if (upcoming) {
    return {
      chain: next,
      currentLevel: upcoming.level,
      status: 'pending',
      finalized: false,
      changed: true,
    };
  }

  return { chain: next, currentLevel, status: 'approved', finalized: true, changed: true };
}

/** Estado global derivado de los pasos: rejected si alguno fue rechazado, approved si todos aprobados, si no pending. */
export function deriveStatus(chain: ApprovalStep[]): WorkflowStatus {
  if (chain.some((s) => s.status === 'rejected')) return 'rejected';
  if (chain.length > 0 && chain.every((s) => s.status === 'approved')) return 'approved';
  return 'pending';
}

// ── Travel Policy Evaluator (Gap #2) ─────────────────────────────────────

export interface TravelPolicy {
  enabled: boolean;
  maxFarePerTrip: number;
  maxFarePerDay: number;
  maxFarePerMonth: number;
  requireJustificationAbove: number;
  allowedServices: string[];
  allowedDays: number[];
  allowedHoursFrom: string;
  allowedHoursTo: string;
  autoApproveBelow: number;
  requireApprovalAbove: number;
  allowPersonalUse: boolean;
  allowInternational: boolean;
}

export interface PolicyEvaluationInput {
  amount: number;
  serviceType: string;
  /** ISO date del inicio del viaje (si está disponible). */
  startDate?: string | Date;
  /** Justificación enviada por el empleado. */
  justification?: string;
  /** Bandera explícita uso personal. */
  isPersonal?: boolean;
  /** Bandera explícita destino internacional. */
  isInternational?: boolean;
}

export type PolicyViolation =
  | 'amount_exceeds_max'
  | 'service_not_allowed'
  | 'outside_allowed_days'
  | 'outside_allowed_hours'
  | 'justification_required'
  | 'personal_use_not_allowed'
  | 'international_not_allowed';

export interface PolicyEvaluationResult {
  /** true si el booking puede crearse (puede o no requerir aprobación). */
  allowed: boolean;
  /** true si requiere aprobación del manager (no auto-approve). */
  requiresApproval: boolean;
  /** Razones (legibles) por las que el booking fue bloqueado. */
  violations: PolicyViolation[];
  /** Mensajes legibles para el usuario. */
  messages: string[];
}

/**
 * Evalúa un booking propuesto contra la política de viajes corporativa.
 * Si `policy.enabled` es false, todo se permite y no requiere aprobación
 * (la lógica de `requireApproval`/`approvalThreshold` legacy se aplica
 * fuera de aquí). Si `enabled` es true, evalúa cada regla y devuelve un
 * resultado consolidado.
 */
export function evaluateTravelPolicy(
  policy: TravelPolicy | null | undefined,
  input: PolicyEvaluationInput,
): PolicyEvaluationResult {
  const empty: PolicyEvaluationResult = {
    allowed: true,
    requiresApproval: false,
    violations: [],
    messages: [],
  };
  if (!policy || !policy.enabled) return empty;

  const violations: PolicyViolation[] = [];
  const messages: string[] = [];
  let requiresApproval = false;

  // 1. Tope absoluto.
  if (policy.maxFarePerTrip > 0 && input.amount > policy.maxFarePerTrip) {
    violations.push('amount_exceeds_max');
    messages.push(
      `El monto $${input.amount} supera el tope por viaje de $${policy.maxFarePerTrip}.`,
    );
  }

  // 2. Servicio habilitado.
  if (
    policy.allowedServices.length > 0 &&
    !policy.allowedServices.includes(input.serviceType)
  ) {
    violations.push('service_not_allowed');
    messages.push(
      `El servicio "${input.serviceType}" no está habilitado por la política.`,
    );
  }

  // 3. Justificación obligatoria.
  if (
    policy.requireJustificationAbove > 0 &&
    input.amount > policy.requireJustificationAbove &&
    !(input.justification && input.justification.trim().length > 0)
  ) {
    violations.push('justification_required');
    messages.push(
      `Se requiere justificación para viajes mayores a $${policy.requireJustificationAbove}.`,
    );
  }

  // 4. Uso personal.
  if (input.isPersonal && !policy.allowPersonalUse) {
    violations.push('personal_use_not_allowed');
    messages.push('Uso personal de Going no está permitido por la política.');
  }

  // 5. Internacional.
  if (input.isInternational && !policy.allowInternational) {
    violations.push('international_not_allowed');
    messages.push('Viajes internacionales no están permitidos por la política.');
  }

  // 6. Días / horas: si startDate viene, validamos. Si no, no se evalúa
  //    (caller puede agregar la validación cuando dispatch resuelva la fecha).
  if (input.startDate) {
    const d = new Date(input.startDate);
    if (!isNaN(d.getTime())) {
      // Convertimos a zona ECT (UTC-5).
      const ect = new Date(d.getTime() - 5 * 3_600_000);
      const day = ect.getUTCDay();
      const minutes = ect.getUTCHours() * 60 + ect.getUTCMinutes();

      if (
        policy.allowedDays &&
        policy.allowedDays.length > 0 &&
        !policy.allowedDays.includes(day)
      ) {
        // Fuera de días permitidos → no bloqueamos, pero requerimos aprobación.
        requiresApproval = true;
        violations.push('outside_allowed_days');
        messages.push(
          'El viaje cae fuera de los días laborables — requiere aprobación.',
        );
      }
      if (policy.allowedHoursFrom && policy.allowedHoursTo) {
        const [fh, fm] = policy.allowedHoursFrom.split(':').map(Number);
        const [th, tm] = policy.allowedHoursTo.split(':').map(Number);
        const fromMin = fh * 60 + fm;
        const toMin = th * 60 + tm;
        if (minutes < fromMin || minutes > toMin) {
          requiresApproval = true;
          violations.push('outside_allowed_hours');
          messages.push(
            `El viaje cae fuera del horario ${policy.allowedHoursFrom}–${policy.allowedHoursTo} — requiere aprobación.`,
          );
        }
      }
    }
  }

  // 7. Aprobación por monto.
  if (
    policy.requireApprovalAbove > 0 &&
    input.amount >= policy.requireApprovalAbove
  ) {
    requiresApproval = true;
  }

  // Si auto-approve está configurado y el monto está debajo → no requiere aprobación.
  if (
    policy.autoApproveBelow > 0 &&
    input.amount < policy.autoApproveBelow &&
    !requiresApproval
  ) {
    // ok, auto-approve.
  }

  // Violaciones hard (no horarios): bloquean. Horarios/días solo escalan
  // a approval — no son hard blocks.
  const hardViolations = violations.filter(
    (v) => v !== 'outside_allowed_days' && v !== 'outside_allowed_hours',
  );

  return {
    allowed: hardViolations.length === 0,
    requiresApproval,
    violations,
    messages,
  };
}
