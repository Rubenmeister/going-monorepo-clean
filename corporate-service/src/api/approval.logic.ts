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
