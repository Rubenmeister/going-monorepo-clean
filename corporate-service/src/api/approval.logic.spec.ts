import {
  buildApprovalChain,
  applyDecision,
  firstPendingLevel,
  deriveStatus,
  DEFAULT_APPROVAL_LEVELS,
  type ApprovalLevelConfig,
} from './approval.logic';

const LEVELS: ApprovalLevelConfig[] = [
  { level: 1, role: 'manager', minAmount: 0 },
  { level: 2, role: 'finance', minAmount: 200 },
  { level: 3, role: 'director', minAmount: 500 },
];

describe('buildApprovalChain', () => {
  it('un solo nivel por defecto cuando no hay config', () => {
    const chain = buildApprovalChain(1000, null);
    expect(chain).toHaveLength(1);
    expect(chain[0].level).toBe(1);
    expect(chain[0].role).toBe('manager');
    expect(chain[0].status).toBe('pending');
  });

  it('monto bajo → sólo el primer nivel', () => {
    const chain = buildApprovalChain(50, LEVELS);
    expect(chain.map((s) => s.level)).toEqual([1]);
  });

  it('monto medio → escala a dos niveles', () => {
    const chain = buildApprovalChain(300, LEVELS);
    expect(chain.map((s) => s.level)).toEqual([1, 2]);
  });

  it('monto alto → escala a los tres niveles', () => {
    const chain = buildApprovalChain(800, LEVELS);
    expect(chain.map((s) => s.level)).toEqual([1, 2, 3]);
    expect(chain.map((s) => s.role)).toEqual(['manager', 'finance', 'director']);
  });

  it('monto por debajo de todos los umbrales → al menos el nivel más bajo', () => {
    const onlyHigh: ApprovalLevelConfig[] = [{ level: 2, role: 'finance', minAmount: 200 }];
    const chain = buildApprovalChain(10, onlyHigh);
    expect(chain).toHaveLength(1);
    expect(chain[0].level).toBe(2);
  });
});

describe('applyDecision — un solo nivel', () => {
  it('aprobar finaliza como approved', () => {
    const chain = buildApprovalChain(50, LEVELS); // [lvl1]
    const r = applyDecision(chain, 1, 'approved', 'mgr-1', 'ok');
    expect(r.finalized).toBe(true);
    expect(r.status).toBe('approved');
    expect(r.chain[0].decidedBy).toBe('mgr-1');
  });

  it('rechazar finaliza como rejected', () => {
    const chain = buildApprovalChain(50, LEVELS);
    const r = applyDecision(chain, 1, 'rejected', 'mgr-1', 'no');
    expect(r.finalized).toBe(true);
    expect(r.status).toBe('rejected');
  });
});

describe('applyDecision — escalado multinivel', () => {
  it('aprobar nivel 1 avanza a nivel 2 sin finalizar', () => {
    const chain = buildApprovalChain(800, LEVELS); // [1,2,3]
    const r = applyDecision(chain, 1, 'approved', 'mgr-1');
    expect(r.finalized).toBe(false);
    expect(r.status).toBe('pending');
    expect(r.currentLevel).toBe(2);
    expect(r.chain[0].status).toBe('approved');
    expect(r.chain[1].status).toBe('pending');
  });

  it('cadena completa aprobada → approved sólo al último nivel', () => {
    let chain = buildApprovalChain(800, LEVELS);
    let r = applyDecision(chain, 1, 'approved', 'mgr-1');
    r = applyDecision(r.chain, r.currentLevel, 'approved', 'fin-1');
    expect(r.finalized).toBe(false);
    expect(r.currentLevel).toBe(3);
    r = applyDecision(r.chain, r.currentLevel, 'approved', 'dir-1');
    expect(r.finalized).toBe(true);
    expect(r.status).toBe('approved');
    expect(r.chain.every((s) => s.status === 'approved')).toBe(true);
  });

  it('rechazo intermedio termina el flujo aunque queden niveles', () => {
    const chain = buildApprovalChain(800, LEVELS);
    const r1 = applyDecision(chain, 1, 'approved', 'mgr-1');
    const r2 = applyDecision(r1.chain, r1.currentLevel, 'rejected', 'fin-1', 'sobre presupuesto');
    expect(r2.finalized).toBe(true);
    expect(r2.status).toBe('rejected');
    expect(r2.chain[2].status).toBe('pending'); // el nivel 3 nunca decidió
  });

  it('decisión sobre un nivel sin paso pendiente se ignora (changed=false)', () => {
    const chain = buildApprovalChain(800, LEVELS);
    const r = applyDecision(chain, 99, 'approved', 'x');
    expect(r.changed).toBe(false);
    expect(r.status).toBe('pending');
  });
});

describe('helpers', () => {
  it('firstPendingLevel devuelve el menor nivel pendiente', () => {
    const chain = buildApprovalChain(800, LEVELS);
    expect(firstPendingLevel(chain)).toBe(1);
    const r = applyDecision(chain, 1, 'approved', 'mgr-1');
    expect(firstPendingLevel(r.chain)).toBe(2);
  });

  it('deriveStatus refleja rechazos y aprobaciones completas', () => {
    const chain = buildApprovalChain(300, LEVELS);
    expect(deriveStatus(chain)).toBe('pending');
    const rejected = chain.map((s, i) => (i === 0 ? { ...s, status: 'rejected' as const } : s));
    expect(deriveStatus(rejected)).toBe('rejected');
    const approved = chain.map((s) => ({ ...s, status: 'approved' as const }));
    expect(deriveStatus(approved)).toBe('approved');
  });

  it('DEFAULT_APPROVAL_LEVELS es un único nivel manager', () => {
    expect(DEFAULT_APPROVAL_LEVELS).toHaveLength(1);
    expect(DEFAULT_APPROVAL_LEVELS[0].role).toBe('manager');
  });
});
