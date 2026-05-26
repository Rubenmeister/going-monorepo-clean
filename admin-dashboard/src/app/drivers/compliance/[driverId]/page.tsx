'use client';
export const dynamic = 'force-dynamic';

/**
 * /drivers/compliance/[driverId] — Detalle de compliance de UN driver.
 *
 * Permite a ops:
 *   - Ver resumen (status agregado + counts por bucket).
 *   - Ver cada documento subido (url, metadata, status).
 *   - Aprobar un documento (con documentNumber/issuingAuthority/issuedAt/expiresAt).
 *   - Rechazar un documento (con razón obligatoria, min 5 chars).
 *
 * Backend (transport-service via api-gateway):
 *   GET   /compliance/drivers/:driverId
 *   PATCH /compliance/documents/:docId/approve
 *   PATCH /compliance/documents/:docId/reject
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../../../components';
import {
  complianceApi,
  type DriverComplianceDetail,
  type DriverComplianceStatus,
  type DriverDocumentDetail,
  type DriverDocumentStatus,
  type DriverDocumentType,
} from '../../../../lib/compliance-api';

// ─── Constantes ──────────────────────────────────────────────────────

const NON_EXPIRING_TYPES = new Set<DriverDocumentType>([
  'cedula',
  'foto_vehiculo',
  'going_training',
]);

const DOC_TYPE_LABELS: Record<DriverDocumentType, string> = {
  cedula:                 'Cédula',
  licencia:               'Licencia de conducir',
  criminal_record:        'Antecedentes penales',
  matricula:              'Matrícula vehículo',
  mechanical_inspection:  'Revisión técnico-mecánica',
  foto_vehiculo:          'Foto vehículo',
  vehicle_insurance:      'Seguro de vehículo',
  third_party_insurance:  'Seguro contra terceros',
  ant_permit:             'Permiso ANT',
  company_membership:     'Pertenencia operadora',
  tourism_permit:         'Permiso MINTUR (turismo)',
  going_contract:         'Contrato GOING',
  going_training:         'Capacitación GOING',
  soat:                   'SOAT (obsoleto)',
};

const STATUS_STYLES: Record<DriverComplianceStatus, { bg: string; fg: string; label: string }> = {
  verified:         { bg: '#DCFCE7', fg: '#166534', label: 'Verificado' },
  pending:          { bg: '#FEF9C3', fg: '#854D0E', label: 'Pendiente' },
  expired:          { bg: '#FEE2E2', fg: '#991B1B', label: 'Vencido' },
  rejected:         { bg: '#FEE2E2', fg: '#7F1D1D', label: 'Rechazado' },
  tourism_pending:  { bg: '#DBEAFE', fg: '#1E40AF', label: 'Falta tourism' },
};

const DOC_STATUS_STYLES: Record<DriverDocumentStatus, { bg: string; fg: string; label: string }> = {
  pending_review: { bg: '#FEF9C3', fg: '#854D0E', label: 'Pendiente revisión' },
  approved:       { bg: '#DCFCE7', fg: '#166534', label: 'Aprobado' },
  rejected:       { bg: '#FEE2E2', fg: '#7F1D1D', label: 'Rechazado' },
  expired:        { bg: '#FEE2E2', fg: '#991B1B', label: 'Vencido' },
};

// ─── Helpers ──────────────────────────────────────────────────────────

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-EC', {
      year: 'numeric', month: 'short', day: '2-digit',
    });
  } catch { return iso; }
}

function daysFromNow(iso?: string): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// ─── Page ────────────────────────────────────────────────────────────

export default function ComplianceDetailPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const params = useParams();
  const driverId = String(params?.driverId ?? '');

  const [data, setData] = useState<DriverComplianceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [approveDoc, setApproveDoc] = useState<DriverDocumentDetail | null>(null);
  const [rejectDoc, setRejectDoc] = useState<DriverDocumentDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.push('/login');
  }, [auth.isLoading, auth.user, router]);

  const fetchData = useCallback(async () => {
    if (!driverId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await complianceApi.getDriver(driverId);
      setData(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando driver');
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (auth.isLoading || loading) {
    return <AdminLayout><div style={{ padding: 24 }}>Cargando…</div></AdminLayout>;
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div style={{ padding: 24 }}>
          <button onClick={() => router.push('/drivers/compliance')} style={btnSecondary}>
            ← Volver
          </button>
          <div style={{ marginTop: 16, padding: 16, background: '#fee2e2', borderRadius: 6, color: '#991B1B' }}>
            {error ?? 'Driver no encontrado'}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const s = STATUS_STYLES[data.compliance.status];

  return (
    <AdminLayout>
      <div style={{ padding: 24 }}>
        {/* Header + back */}
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => router.push('/drivers/compliance')} style={btnSecondary}>
            ← Volver al listado
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
            Driver Compliance
          </h1>
          <span style={{
            background: s.bg, color: s.fg,
            padding: '4px 14px', borderRadius: 14,
            fontSize: 13, fontWeight: 700,
          }}>
            {s.label}
          </span>
        </div>
        <code style={{ fontSize: 13, color: '#666' }}>{data.driverId}</code>

        {/* Resumen counts */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12,
          marginTop: 20, marginBottom: 28,
        }}>
          <SummaryCard label="Aprobados" value={data.compliance.approved.length} color="#166534" bg="#DCFCE7" />
          <SummaryCard label="Faltantes" value={data.compliance.missing.length} color="#854D0E" bg="#FEF9C3" />
          <SummaryCard label="Vencidos" value={data.compliance.expired.length} color="#991B1B" bg="#FEE2E2" />
          <SummaryCard label="Rechazados" value={data.compliance.rejected.length} color="#7F1D1D" bg="#FEE2E2" />
          <SummaryCard label="Vencen <30d" value={data.compliance.expiringSoon.length} color="#1E40AF" bg="#DBEAFE" />
        </div>

        {/* Documents list */}
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
          Documentos subidos ({data.documents.length})
        </h2>

        {data.documents.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#999', background: '#fff', borderRadius: 8 }}>
            Este driver no ha subido ningún documento aún.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.documents.map((doc) => {
            const ds = DOC_STATUS_STYLES[doc.status];
            const daysLeft = daysFromNow(doc.expiresAt);
            const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
            const isExpired = daysLeft !== null && daysLeft < 0;

            return (
              <div
                key={doc.id}
                style={{
                  background: '#fff', borderRadius: 8, padding: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${ds.fg}`,
                }}
              >
                {/* Header del doc */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                        {DOC_TYPE_LABELS[doc.type] ?? doc.type}
                      </h3>
                      <span style={{
                        background: ds.bg, color: ds.fg,
                        padding: '2px 10px', borderRadius: 12,
                        fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                      }}>
                        {ds.label}
                      </span>
                      {isExpiringSoon && doc.status === 'approved' && (
                        <span style={{
                          background: '#FEF3C7', color: '#92400E',
                          padding: '2px 8px', borderRadius: 10,
                          fontSize: 11, fontWeight: 600,
                        }}>
                          Vence en {daysLeft} día{daysLeft === 1 ? '' : 's'}
                        </span>
                      )}
                      {isExpired && doc.status !== 'rejected' && (
                        <span style={{
                          background: '#FEE2E2', color: '#991B1B',
                          padding: '2px 8px', borderRadius: 10,
                          fontSize: 11, fontWeight: 600,
                        }}>
                          Venció hace {Math.abs(daysLeft!)} día{Math.abs(daysLeft!) === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                      Subido: {fmtDate(doc.uploadedAt)} · Archivo: <code>{doc.filename}</code>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" style={btnSecondary}>
                      Ver archivo
                    </a>
                    {doc.status === 'pending_review' && (
                      <>
                        <button onClick={() => { setApproveDoc(doc); setActionError(null); }} style={btnPrimary}>
                          Aprobar
                        </button>
                        <button onClick={() => { setRejectDoc(doc); setActionError(null); }} style={btnDanger}>
                          Rechazar
                        </button>
                      </>
                    )}
                    {doc.status === 'approved' && (
                      <button onClick={() => { setRejectDoc(doc); setActionError(null); }} style={btnDanger}>
                        Revocar
                      </button>
                    )}
                    {doc.status === 'rejected' && (
                      <button onClick={() => { setApproveDoc(doc); setActionError(null); }} style={btnPrimary}>
                        Aprobar (override)
                      </button>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12, fontSize: 13, paddingTop: 12, borderTop: '1px solid #f3f4f6',
                }}>
                  <MetaField label="Nro. documento" value={doc.documentNumber} />
                  <MetaField label="Autoridad emisora" value={doc.issuingAuthority} />
                  <MetaField label="Emitido" value={fmtDate(doc.issuedAt)} />
                  <MetaField
                    label="Vence"
                    value={NON_EXPIRING_TYPES.has(doc.type) ? 'No expira' : fmtDate(doc.expiresAt)}
                  />
                  {doc.reviewedBy && (
                    <MetaField label="Revisado por" value={`${doc.reviewedBy.slice(0, 8)}… · ${fmtDate(doc.reviewedAt)}`} />
                  )}
                  {doc.rejectionReason && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 11, color: '#666', fontWeight: 600, marginBottom: 4 }}>RAZÓN DE RECHAZO</div>
                      <div style={{ background: '#FEE2E2', color: '#7F1D1D', padding: 8, borderRadius: 4 }}>
                        {doc.rejectionReason}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Approve Modal */}
        {approveDoc && (
          <ApproveModal
            doc={approveDoc}
            loading={actionLoading}
            error={actionError}
            onCancel={() => { setApproveDoc(null); setActionError(null); }}
            onConfirm={async (body) => {
              setActionLoading(true);
              setActionError(null);
              try {
                await complianceApi.approveDoc(approveDoc.id, body);
                setApproveDoc(null);
                await fetchData();
              } catch (e: unknown) {
                setActionError(e instanceof Error ? e.message : 'Error aprobando documento');
              } finally {
                setActionLoading(false);
              }
            }}
          />
        )}

        {/* Reject Modal */}
        {rejectDoc && (
          <RejectModal
            doc={rejectDoc}
            loading={actionLoading}
            error={actionError}
            onCancel={() => { setRejectDoc(null); setActionError(null); }}
            onConfirm={async (reason) => {
              setActionLoading(true);
              setActionError(null);
              try {
                await complianceApi.rejectDoc(rejectDoc.id, reason);
                setRejectDoc(null);
                await fetchData();
              } catch (e: unknown) {
                setActionError(e instanceof Error ? e.message : 'Error rechazando documento');
              } finally {
                setActionLoading(false);
              }
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// ─── Subcomponentes ──────────────────────────────────────────────────

function SummaryCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{ background: bg, padding: 14, borderRadius: 8, textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color, fontWeight: 600, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#666', fontWeight: 600, marginBottom: 2 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 13, color: '#111' }}>{value || '—'}</div>
    </div>
  );
}

// ─── Approve Modal ───────────────────────────────────────────────────

interface ApproveModalProps {
  doc: DriverDocumentDetail;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (body: {
    documentNumber?: string;
    issuingAuthority?: string;
    issuedAt?: string;
    expiresAt?: string;
  }) => Promise<void>;
}

function ApproveModal({ doc, loading, error, onCancel, onConfirm }: ApproveModalProps) {
  const [documentNumber, setDocumentNumber] = useState(doc.documentNumber ?? '');
  const [issuingAuthority, setIssuingAuthority] = useState(doc.issuingAuthority ?? '');
  const [issuedAt, setIssuedAt] = useState(doc.issuedAt?.slice(0, 10) ?? '');
  const [expiresAt, setExpiresAt] = useState(doc.expiresAt?.slice(0, 10) ?? '');

  const isExpiring = !NON_EXPIRING_TYPES.has(doc.type);
  const expiresAtRequired = isExpiring;
  const expiresAtMissing = expiresAtRequired && !expiresAt;
  const expiresAtPast = expiresAt && new Date(expiresAt) < new Date(new Date().toDateString());

  const canSubmit = !expiresAtMissing && !expiresAtPast && !loading;

  return (
    <ModalShell title={`Aprobar — ${DOC_TYPE_LABELS[doc.type] ?? doc.type}`} onCancel={onCancel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Número de documento" hint="Cédula, placa, número de licencia, etc.">
          <input
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            style={inputStyle}
            placeholder="Ej: 0501234567"
          />
        </Field>

        <Field label="Autoridad emisora" hint="ANT, MINTUR, aseguradora, etc.">
          <input
            value={issuingAuthority}
            onChange={(e) => setIssuingAuthority(e.target.value)}
            style={inputStyle}
            placeholder="Ej: ANT"
          />
        </Field>

        <Field label="Fecha de emisión">
          <input
            type="date"
            value={issuedAt}
            onChange={(e) => setIssuedAt(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field
          label={`Fecha de vencimiento${expiresAtRequired ? ' *' : ''}`}
          hint={expiresAtRequired ? 'Obligatorio para este tipo de documento.' : 'Este documento no expira.'}
        >
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            style={{
              ...inputStyle,
              borderColor: (expiresAtMissing || expiresAtPast) ? '#dc2626' : '#d1d5db',
            }}
            disabled={!isExpiring}
          />
          {expiresAtMissing && (
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
              Requerido.
            </div>
          )}
          {expiresAtPast && (
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
              La fecha de vencimiento no puede estar en el pasado.
            </div>
          )}
        </Field>

        {error && (
          <div style={{ padding: 10, background: '#fee2e2', color: '#991B1B', borderRadius: 6, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button onClick={onCancel} style={btnSecondary} disabled={loading}>
            Cancelar
          </button>
          <button
            onClick={() => onConfirm({
              documentNumber: documentNumber || undefined,
              issuingAuthority: issuingAuthority || undefined,
              issuedAt: issuedAt ? new Date(issuedAt).toISOString() : undefined,
              expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
            })}
            disabled={!canSubmit}
            style={{ ...btnPrimary, opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
          >
            {loading ? 'Aprobando…' : 'Aprobar documento'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Reject Modal ────────────────────────────────────────────────────

interface RejectModalProps {
  doc: DriverDocumentDetail;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

function RejectModal({ doc, loading, error, onCancel, onConfirm }: RejectModalProps) {
  const [reason, setReason] = useState('');
  const tooShort = reason.trim().length < 5;

  return (
    <ModalShell title={`Rechazar — ${DOC_TYPE_LABELS[doc.type] ?? doc.type}`} onCancel={onCancel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field
          label="Razón del rechazo *"
          hint="El driver verá este mensaje. Sé específico sobre qué debe corregir (mínimo 5 caracteres)."
        >
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            placeholder="Ej: La foto está borrosa, no se distingue el número de la cédula. Por favor sube una foto más nítida."
          />
          <div style={{ fontSize: 12, color: tooShort ? '#dc2626' : '#666', marginTop: 4 }}>
            {reason.trim().length} caracteres {tooShort && '— mínimo 5'}
          </div>
        </Field>

        {error && (
          <div style={{ padding: 10, background: '#fee2e2', color: '#991B1B', borderRadius: 6, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button onClick={onCancel} style={btnSecondary} disabled={loading}>
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={tooShort || loading}
            style={{ ...btnDanger, opacity: (tooShort || loading) ? 0.5 : 1, cursor: (tooShort || loading) ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Rechazando…' : 'Rechazar documento'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Modal shell + Field ─────────────────────────────────────────────

function ModalShell({ title, children, onCancel }: { title: string; children: React.ReactNode; onCancel: () => void }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 10, padding: 24,
          maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#374151' }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 6,
  border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box',
};

const btnPrimary: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 6, border: 'none',
  background: '#16a34a', color: '#fff', cursor: 'pointer',
  fontSize: 13, fontWeight: 600,
};

const btnDanger: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 6, border: 'none',
  background: '#dc2626', color: '#fff', cursor: 'pointer',
  fontSize: 13, fontWeight: 600,
};

const btnSecondary: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db',
  background: '#fff', color: '#374151', cursor: 'pointer',
  fontSize: 13, fontWeight: 500, textDecoration: 'none', display: 'inline-block',
};
