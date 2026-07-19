'use client';
export const dynamic = 'force-dynamic';

/**
 * /drivers/compliance — Lista de drivers con su estado de Driver Compliance
 *
 * Permite a ops filtrar por status (verified | pending | expired | rejected |
 * tourism_pending) y entrar a un driver específico para aprobar/rechazar
 * documentos individuales en /drivers/compliance/:driverId.
 *
 * Backend: GET /compliance/drivers (transport-service) via api-gateway.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@/lib/providers';
import { AdminLayout } from '../../components';
import {
  complianceApi,
  type DriverComplianceListItem,
  type DriverComplianceStatus,
} from '../../../lib/compliance-api';

// ─── Estilos por status ──────────────────────────────────────────────

const STATUS_STYLES: Record<DriverComplianceStatus, { bg: string; fg: string; label: string }> = {
  verified:         { bg: '#DCFCE7', fg: '#166534', label: 'Verificado' },
  pending:          { bg: '#FEF9C3', fg: '#854D0E', label: 'Pendiente' },
  expired:          { bg: '#FEE2E2', fg: '#991B1B', label: 'Vencido' },
  rejected:         { bg: '#FEE2E2', fg: '#7F1D1D', label: 'Rechazado' },
  tourism_pending:  { bg: '#DBEAFE', fg: '#1E40AF', label: 'Falta tourism' },
};

const FILTER_OPTIONS: Array<{ value: '' | DriverComplianceStatus; label: string }> = [
  { value: '',                 label: 'Todos' },
  { value: 'verified',         label: 'Verificados' },
  { value: 'pending',          label: 'Pendientes' },
  { value: 'expired',          label: 'Vencidos' },
  { value: 'rejected',         label: 'Rechazados' },
  { value: 'tourism_pending',  label: 'Falta tourism' },
];

// ─── Page ────────────────────────────────────────────────────────────

export default function ComplianceListPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();

  const [items, setItems] = useState<DriverComplianceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'' | DriverComplianceStatus>('');

  // Auth guard
  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.push('/login');
  }, [auth.isLoading, auth.user, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { status?: DriverComplianceStatus; limit?: number } = { limit: 200 };
      if (filter) params.status = filter;
      const res = await complianceApi.listDrivers(params);
      setItems(res.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando compliance');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (auth.isLoading) {
    return <AdminLayout><div style={{ padding: 24 }}>Cargando…</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          Driver Compliance
        </h1>
        <p style={{ color: '#666', marginBottom: 24, maxWidth: 720 }}>
          Estado de cumplimiento regulatorio de las conductoras y conductores. Drivers con
          status distinto a <strong>Verificado</strong> NO aparecen en el pool
          de matching (no reciben rides).
        </p>

        {/* Filtros */}
        <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value || 'all'}
              onClick={() => setFilter(opt.value)}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: filter === opt.value ? '2px solid #2563eb' : '1px solid #ddd',
                background: filter === opt.value ? '#dbeafe' : '#fff',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: filter === opt.value ? 600 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => void fetchData()}
            style={{
              padding: '8px 14px', borderRadius: 6, border: '1px solid #ddd',
              background: '#f9fafb', cursor: 'pointer', fontSize: 13, marginLeft: 'auto',
            }}
          >
            🔄 Refrescar
          </button>
        </div>

        {/* Estado */}
        {loading && <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Cargando drivers…</div>}
        {error && (
          <div style={{ padding: 16, background: '#fee2e2', borderRadius: 6, color: '#991B1B' }}>
            Error: {error}
          </div>
        )}

        {/* Tabla */}
        {!loading && !error && (
          <>
            <div style={{ marginBottom: 12, color: '#666', fontSize: 14 }}>
              {items.length} driver{items.length !== 1 ? 's' : ''} {filter && `con status "${filter}"`}
            </div>
            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={th}>Driver ID</th>
                    <th style={th}>Status</th>
                    <th style={thNum}>Approved</th>
                    <th style={thNum}>Missing</th>
                    <th style={thNum}>Expired</th>
                    <th style={thNum}>Rejected</th>
                    <th style={thNum}>Expiring &lt;30d</th>
                    <th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => {
                    const s = STATUS_STYLES[d.status];
                    return (
                      <tr
                        key={d.driverId}
                        style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                        onClick={() => router.push(`/drivers/compliance/${d.driverId}`)}
                      >
                        <td style={td}><code style={{ fontSize: 12 }}>{d.driverId.slice(0, 12)}…</code></td>
                        <td style={td}>
                          <span style={{
                            background: s.bg, color: s.fg,
                            padding: '2px 10px', borderRadius: 12,
                            fontSize: 12, fontWeight: 600,
                          }}>
                            {s.label}
                          </span>
                        </td>
                        <td style={tdNum}>{d.approved.length}</td>
                        <td style={tdNum}>{d.missing.length}</td>
                        <td style={tdNum}>{d.expired.length}</td>
                        <td style={tdNum}>{d.rejected.length}</td>
                        <td style={tdNum}>{d.expiringSoon.length}</td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/drivers/compliance/${d.driverId}`);
                            }}
                            style={{
                              padding: '4px 12px', borderRadius: 4,
                              background: '#2563eb', color: '#fff',
                              border: 'none', cursor: 'pointer', fontSize: 12,
                            }}
                          >
                            Revisar →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#999' }}>
                      Sin drivers con este filtro
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

const th: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' };
const thNum: React.CSSProperties = { ...th, textAlign: 'center' };
const td: React.CSSProperties = { padding: '12px 16px' };
const tdNum: React.CSSProperties = { ...td, textAlign: 'center' };
