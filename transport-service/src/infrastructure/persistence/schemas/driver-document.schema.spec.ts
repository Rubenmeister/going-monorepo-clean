import {
  computeDriverCompliance,
  REQUIRED_DOCUMENT_TYPES,
  type DriverDocumentModel,
  type DriverDocumentType,
} from './driver-document.schema';

const now = new Date('2026-06-01T10:00:00Z');
const future = new Date('2027-06-01T10:00:00Z'); // 1 año adelante
const past = new Date('2026-05-01T10:00:00Z');   // 1 mes atrás
const soon = new Date('2026-06-15T10:00:00Z');   // 14 días adelante (within 30)

const driverId = 'driver-1';

function doc(
  type: DriverDocumentType,
  overrides: Partial<DriverDocumentModel> = {},
): DriverDocumentModel {
  return {
    driverId,
    type,
    url: 'gs://test/doc.pdf',
    filename: 'doc.pdf',
    status: 'approved',
    expiresAt: future,
    uploadedAt: past,
    ...overrides,
  } as DriverDocumentModel;
}

describe('computeDriverCompliance', () => {
  it('driver sin docs → status=pending con todos los required en missing', () => {
    const r = computeDriverCompliance([], now);
    expect(r.status).toBe('pending');
    expect(r.approved).toEqual([]);
    expect(r.missing).toEqual(expect.arrayContaining(REQUIRED_DOCUMENT_TYPES));
    expect(r.missing.length).toBe(REQUIRED_DOCUMENT_TYPES.length);
  });

  it('driver con TODOS los required aprobados y vigentes → verified', () => {
    const docs = REQUIRED_DOCUMENT_TYPES.map((t) => doc(t));
    const r = computeDriverCompliance(docs, now);
    expect(r.status).toBe('verified');
    expect(r.missing).toEqual([]);
    expect(r.approved.length).toBe(REQUIRED_DOCUMENT_TYPES.length);
  });

  it('un doc rejected → status=rejected', () => {
    const docs = REQUIRED_DOCUMENT_TYPES.map((t) => doc(t));
    docs[3] = doc(REQUIRED_DOCUMENT_TYPES[3], { status: 'rejected', rejectionReason: 'PDF ilegible' });
    const r = computeDriverCompliance(docs, now);
    expect(r.status).toBe('rejected');
    expect(r.rejected).toContain(REQUIRED_DOCUMENT_TYPES[3]);
  });

  it('un doc expired (status) → status=expired', () => {
    const docs = REQUIRED_DOCUMENT_TYPES.map((t) => doc(t));
    docs[0] = doc(REQUIRED_DOCUMENT_TYPES[0], { status: 'expired' });
    const r = computeDriverCompliance(docs, now);
    expect(r.status).toBe('expired');
    expect(r.expired).toContain(REQUIRED_DOCUMENT_TYPES[0]);
  });

  it('approved pero expiresAt < now → tratado como expired', () => {
    const docs = REQUIRED_DOCUMENT_TYPES.map((t) => doc(t));
    docs[2] = doc(REQUIRED_DOCUMENT_TYPES[2], { status: 'approved', expiresAt: past });
    const r = computeDriverCompliance(docs, now);
    expect(r.status).toBe('expired');
    expect(r.expired).toContain(REQUIRED_DOCUMENT_TYPES[2]);
  });

  it('approved sin expiresAt en doc que SI expira → tratado como missing', () => {
    const docs = REQUIRED_DOCUMENT_TYPES.map((t) => doc(t));
    // licencia siempre expira; aprobada sin expiresAt = bug de ops, lo tratamos como pending
    docs[1] = doc('licencia', { status: 'approved', expiresAt: undefined });
    const r = computeDriverCompliance(docs, now);
    expect(r.status).toBe('pending');
    expect(r.missing).toContain('licencia');
  });

  it('cedula approved sin expiresAt → válido (NON_EXPIRING_TYPES)', () => {
    const docs = REQUIRED_DOCUMENT_TYPES.map((t) => doc(t));
    docs[0] = doc('cedula', { status: 'approved', expiresAt: undefined });
    const r = computeDriverCompliance(docs, now);
    expect(r.status).toBe('verified');
    expect(r.approved).toContain('cedula');
  });

  it('expiresAt dentro de 30 días → expiringSoon', () => {
    const docs = REQUIRED_DOCUMENT_TYPES.map((t) => doc(t));
    docs[5] = doc(REQUIRED_DOCUMENT_TYPES[5], { status: 'approved', expiresAt: soon });
    const r = computeDriverCompliance(docs, now);
    expect(r.status).toBe('verified');
    expect(r.expiringSoon).toContain(REQUIRED_DOCUMENT_TYPES[5]);
  });

  it('un doc pending_review → status=pending', () => {
    const docs = REQUIRED_DOCUMENT_TYPES.map((t) => doc(t));
    docs[4] = doc(REQUIRED_DOCUMENT_TYPES[4], { status: 'pending_review' });
    const r = computeDriverCompliance(docs, now);
    expect(r.status).toBe('pending');
    expect(r.missing).toContain(REQUIRED_DOCUMENT_TYPES[4]);
  });

  it('múltiples docs del mismo type → toma el de uploadedAt más reciente', () => {
    const oldRejected = doc('licencia', {
      status: 'rejected', uploadedAt: new Date('2026-01-01'),
      rejectionReason: 'foto borrosa',
    });
    const newApproved = doc('licencia', {
      status: 'approved', uploadedAt: new Date('2026-05-01'),
    });
    const allOthers = REQUIRED_DOCUMENT_TYPES
      .filter((t) => t !== 'licencia')
      .map((t) => doc(t));
    const r = computeDriverCompliance([oldRejected, newApproved, ...allOthers], now);
    expect(r.status).toBe('verified');
    expect(r.approved).toContain('licencia');
    expect(r.rejected).not.toContain('licencia');
  });

  it('isTourismDriver=true sin tourism_permit pero con todo lo demás → tourism_pending', () => {
    const docs = REQUIRED_DOCUMENT_TYPES.map((t) => doc(t));
    const r = computeDriverCompliance(docs, now, true);
    expect(r.status).toBe('tourism_pending');
    expect(r.missing).toEqual(['tourism_permit']);
  });

  it('isTourismDriver=true con tourism_permit aprobado → verified', () => {
    const docs = [
      ...REQUIRED_DOCUMENT_TYPES.map((t) => doc(t)),
      doc('tourism_permit'),
    ];
    const r = computeDriverCompliance(docs, now, true);
    expect(r.status).toBe('verified');
  });

  it('prioridad de status: rejected > expired > pending', () => {
    const docs = REQUIRED_DOCUMENT_TYPES.map((t) => doc(t));
    docs[0] = doc(REQUIRED_DOCUMENT_TYPES[0], { status: 'rejected' });
    docs[1] = doc(REQUIRED_DOCUMENT_TYPES[1], { status: 'expired' });
    docs[2] = doc(REQUIRED_DOCUMENT_TYPES[2], { status: 'pending_review' });
    const r = computeDriverCompliance(docs, now);
    expect(r.status).toBe('rejected'); // rejected gana
  });
});
