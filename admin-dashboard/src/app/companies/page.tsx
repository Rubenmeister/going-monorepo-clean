'use client';
export const dynamic = 'force-dynamic';

/**
 * /companies — Gestión de Empresas Corporativas
 * Tabs: Empresas activas | Solicitudes pendientes
 */

import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button } from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { AdminLayout, StatCard } from '../components';
import { Loading, ErrorState } from '@going-monorepo-clean/shared-ui';
import { adminFetch } from '../../lib/admin-api';

type TipoCuenta = 'grande' | 'negocio' | 'agencia';
type CompanyStatus = 'active' | 'inactive' | 'suspended' | 'prospect';

interface Company {
  id: string; name: string; email: string; ruc: string;
  status: CompanyStatus; tipoCuenta?: TipoCuenta;
  employees: number; industry?: string; city?: string;
  phone?: string; descripcionUso?: string; createdAt: string;
}

const TIPO_LABELS: Record<TipoCuenta, { label: string; color: string }> = {
  grande:  { label: 'Empresa Grande',    color: 'bg-blue-100 text-blue-700' },
  negocio: { label: 'Negocio / PyME',    color: 'bg-emerald-100 text-emerald-700' },
  agencia: { label: 'Agencia de Viajes', color: 'bg-purple-100 text-purple-700' },
};
const STATUS_STYLE: Record<CompanyStatus, string> = {
  active: 'bg-green-100 text-green-700', inactive: 'bg-slate-100 text-slate-500',
  suspended: 'bg-red-100 text-red-600', prospect: 'bg-amber-100 text-amber-700',
};
const STATUS_LABEL: Record<CompanyStatus, string> = {
  active: 'Activa', inactive: 'Inactiva', suspended: 'Suspendida', prospect: 'Solicitud',
};
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}
const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

function CompanyModal({ company, token, onClose, onUpdate }: {
  company: Company; token: string; onClose: () => void;
  onUpdate: (id: string, changes: Partial<Company>) => void;
}) {
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta>(company.tipoCuenta ?? 'negocio');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  async function handleSaveTipo() {
    setSaving(true);
    try {
      await adminFetch(`/corporate/companies/${company.id}`, token, {
        method: 'PATCH', body: JSON.stringify({ tipoCuenta }),
      });
      onUpdate(company.id, { tipoCuenta });
      setToast('Tipo de cuenta actualizado.');
      setTimeout(() => setToast(''), 3000);
    } catch (e: any) { setToast('Error: ' + (e.message ?? 'No se pudo actualizar')); }
    finally { setSaving(false); }
  }

  async function handleToggleStatus() {
    const newStatus: CompanyStatus = company.status === 'active' ? 'suspended' : 'active';
    setSaving(true);
    try {
      await adminFetch(`/corporate/companies/${company.id}/status`, token, {
        method: 'PATCH', body: JSON.stringify({ status: newStatus }),
      });
      onUpdate(company.id, { status: newStatus });
      onClose();
    } catch (e: any) { setToast('Error: ' + (e.message ?? 'No se pudo cambiar estado')); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{company.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">RUC: {company.ruc}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[['Email', company.email], ['Teléfono', company.phone ?? '—'],
              ['Ciudad', company.city ?? '—'], ['Industria', company.industry ?? '—'],
              ['Empleados', String(company.employees)], ['Registro', fmtDate(company.createdAt)],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{k}</p>
                <p className="text-slate-800 font-medium mt-0.5">{v}</p>
              </div>
            ))}
          </div>
          {company.descripcionUso && (
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Descripción de uso</p>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{company.descripcionUso}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Tipo de cuenta</p>
            <div className="space-y-2">
              {(Object.entries(TIPO_LABELS) as [TipoCuenta, any][]).map(([key, { label }]) => (
                <button key={key} type="button" onClick={() => setTipoCuenta(key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${tipoCuenta === key ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${tipoCuenta === key ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`} />
                  <span className={`text-sm font-medium ${tipoCuenta === key ? 'text-blue-700' : 'text-slate-700'}`}>{label}</span>
                </button>
              ))}
            </div>
            <button onClick={handleSaveTipo} disabled={saving || tipoCuenta === company.tipoCuenta}
              className="mt-3 w-full py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando…' : 'Guardar tipo de cuenta'}
            </button>
          </div>
          {toast && <p className={`text-sm px-3 py-2 rounded-lg ${toast.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{toast}</p>}
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button onClick={onClose} className="flex-1 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50">Cerrar</button>
            <button onClick={handleToggleStatus} disabled={saving}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${company.status === 'active' ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'}`}>
              {company.status === 'active' ? 'Suspender empresa' : 'Reactivar empresa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApproveModal({ company, token, onClose, onApproved }: {
  company: Company; token: string; onClose: () => void; onApproved: (id: string) => void;
}) {
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta>('negocio');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Link "define tu clave" que devuelve el approve. Se muestra para que el
  // staff se lo pase al cliente DIRECTO (WhatsApp/email), sin depender del
  // email automático (Gmail SMTP frágil — a veces no llega o se rate-limitea).
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleApprove() {
    setLoading(true); setError('');
    try {
      const res: any = await adminFetch(`/corporate/companies/${company.id}/approve`, token, {
        method: 'POST', body: JSON.stringify({ tipoCuenta }),
      });

      // El backend puede responder 201 y AUN ASÍ no haber creado la cuenta
      // (provisioned:false). Antes se cerraba como si todo hubiera salido bien:
      // el admin veía "aprobada" y el cliente no podía entrar, sin que nadie se
      // enterara. Eso dejó una agencia real bloqueada durante horas.
      if (res && res.provisioned === false) {
        setError(
          'La empresa quedó aprobada pero NO se creó su cuenta de acceso. ' +
          'El cliente no podrá ingresar. Reintenta aprobar; si persiste, avisa a soporte técnico.',
        );
        return; // no cerramos ni la marcamos como lista
      }

      onApproved(company.id);
      if (res?.resetLink) setResetLink(res.resetLink);
      else onClose();
    } catch (e: any) { setError(e.message ?? 'Error al aprobar'); }
    finally { setLoading(false); }
  }

  async function copyLink() {
    if (!resetLink) return;
    try { await navigator.clipboard.writeText(resetLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* clipboard puede fallar en http; el link igual está visible para copiar a mano */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Aprobar solicitud</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 text-sm">
            <p className="font-semibold text-slate-900">{company.name}</p>
            <p className="text-slate-500">{company.email} · RUC {company.ruc}</p>
            {company.employees > 0 && <p className="text-slate-500">{company.employees} empleados · {company.industry}</p>}
          </div>
          {!resetLink ? (
            <>
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Asignar tipo de cuenta *</p>
                <div className="space-y-2">
                  {(Object.entries(TIPO_LABELS) as [TipoCuenta, any][]).map(([key, { label }]) => (
                    <button key={key} type="button" onClick={() => setTipoCuenta(key)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${tipoCuenta === key ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${tipoCuenta === key ? 'border-green-500 bg-green-500' : 'border-slate-300'}`} />
                      <span className={`text-sm font-medium ${tipoCuenta === key ? 'text-green-700' : 'text-slate-700'}`}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50">Cancelar</button>
                <button onClick={handleApprove} disabled={loading}
                  className="flex-1 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-60">
                  {loading ? 'Aprobando…' : '✓ Aprobar y activar'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
                <p className="text-sm font-semibold text-green-800">✓ Aprobada y cuenta creada</p>
                <p className="text-xs text-slate-600">
                  Comparte este enlace con el cliente para que <strong>defina su contraseña</strong> (válido 72h).
                  Úsalo para no depender del email automático:
                </p>
                <div className="flex items-center gap-2">
                  <input readOnly value={resetLink}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 text-xs bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-700" />
                  <button type="button" onClick={copyLink}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 whitespace-nowrap">
                    {copied ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
              <button onClick={onClose}
                className="w-full py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900">
                Cerrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RejectModal({ company, token, onClose, onRejected }: {
  company: Company; token: string; onClose: () => void; onRejected: (id: string) => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleReject() {
    if (!motivo.trim()) { setError('El motivo es obligatorio.'); return; }
    setLoading(true); setError('');
    try {
      await adminFetch(`/corporate/companies/${company.id}/reject`, token, {
        method: 'POST', body: JSON.stringify({ motivo }),
      });
      onRejected(company.id); onClose();
    } catch (e: any) { setError(e.message ?? 'Error al rechazar'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Rechazar solicitud</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">Se notificará a <strong>{company.email}</strong> con el motivo del rechazo.</p>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Motivo *</label>
            <textarea rows={4} className={INPUT + ' resize-none'} value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: RUC no verificado, información incompleta…" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50">Cancelar</button>
            <button onClick={handleReject} disabled={loading}
              className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-60">
              {loading ? 'Rechazando…' : '✕ Rechazar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'active' | 'prospect' | 'analytics'>('active');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Company | null>(null);
  const [approving, setApproving] = useState<Company | null>(null);
  const [rejecting, setRejecting] = useState<Company | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading]   = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const load = useCallback(async () => {
    if (!auth.user || !token) return;
    setLoading(true); setError(null);
    try {
      const data = await adminFetch<any>('/corporate/companies?limit=200', token);
      const list: any[] = Array.isArray(data) ? data : data?.companies ?? data?.data ?? [];
      setCompanies(list.map((c: any) => ({
        id: c.id ?? c._id ?? '—', name: c.name ?? c.companyName ?? c.razonSocial ?? '—',
        email: c.email ?? c.contactEmail ?? c.contactoEmail ?? '—', ruc: c.ruc ?? c.taxId ?? '—',
        status: c.status ?? 'prospect', tipoCuenta: c.tipoCuenta ?? c.accountType,
        employees: c.employeeCount ?? c.empleadosEstimados ?? c.employees ?? 0,
        industry: c.industry ?? c.industria, city: c.city ?? c.ciudad ?? c.ubicacion,
        phone: c.phone ?? c.contactoTelefono, descripcionUso: c.descripcionUso ?? c.notes,
        createdAt: c.createdAt ?? new Date().toISOString(),
      })));
    } catch (e: any) { setError(e.message ?? 'Error al cargar empresas'); }
    finally { setLoading(false); }
  }, [auth.user, token]);

  useEffect(() => {
    if (!auth.user) { router.push('/login'); return; }
    load();
  }, [auth.user, router, load]);

  if (auth.isLoading) return <Loading fullHeight size="lg" message="Verificando sesión..." />;
  if (!auth.user?.isAdmin?.()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <ErrorState title="Acceso Denegado" description="Se requiere rol de administrador"
          action={<Button onClick={() => router.push('/')}>Volver</Button>} />
      </div>
    );
  }

  const showToast = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };
  const activas    = companies.filter(c => c.status === 'active');
  const solicitudes = companies.filter(c => c.status === 'prospect');
  const suspendidas = companies.filter(c => c.status === 'suspended');
  const displayed  = (tab === 'active' ? [...activas, ...suspendidas] : solicitudes).filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.ruc.includes(q);
  });

  /* ── Bulk helpers ── */
  const allDisplayedIds = displayed.map(c => c.id);
  const allSelected     = allDisplayedIds.length > 0 && allDisplayedIds.every(id => bulkSelected.has(id));
  const toggleAll       = () => setBulkSelected(prev => allSelected ? new Set() : new Set(allDisplayedIds));
  const toggleOne       = (id: string) => setBulkSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  async function bulkApprove() {
    const ids = [...bulkSelected];
    if (!ids.length) return;
    setBulkLoading(true);
    let ok = 0;
    let sinCuenta = 0;
    for (const id of ids) {
      try {
        // El tipo de cuenta sale de lo que pidió la empresa, NO fijo a 'negocio':
        // forzarlo degradaba a PyME a las Grandes y Agencias aprobadas en lote,
        // cambiándoles crédito, aprobaciones y comisiones sin que nadie lo viera.
        const tipo = companies.find(c => c.id === id)?.tipoCuenta ?? 'negocio';
        const res: any = await adminFetch(`/corporate/companies/${id}/approve`, token, {
          method: 'POST', body: JSON.stringify({ tipoCuenta: tipo }),
        });
        // Aprobada sin cuenta creada NO es un éxito: el cliente no podrá entrar.
        if (res && res.provisioned === false) { sinCuenta++; continue; }
        setCompanies(p => p.map(c => c.id === id ? { ...c, status: 'active' } : c));
        ok++;
      } catch { /* skip */ }
    }
    setBulkSelected(new Set());
    setBulkLoading(false);
    showToast(
      sinCuenta
        ? `${ok}/${ids.length} aprobadas. ${sinCuenta} quedaron SIN cuenta de acceso — revísalas.`
        : `${ok}/${ids.length} empresas aprobadas.`,
      sinCuenta === 0 && ok > 0,
    );
  }

  async function bulkReject() {
    const ids = [...bulkSelected];
    if (!ids.length) return;
    setBulkLoading(true);
    let ok = 0;
    for (const id of ids) {
      try {
        await adminFetch(`/corporate/companies/${id}/reject`, token, { method: 'POST', body: JSON.stringify({ motivo: 'Rechazado en revisión masiva' }) });
        setCompanies(p => p.filter(c => c.id !== id));
        ok++;
      } catch { /* skip */ }
    }
    setBulkSelected(new Set());
    setBulkLoading(false);
    showToast(`${ok}/${ids.length} solicitudes rechazadas.`, ok > 0);
  }

  async function bulkSuspend() {
    const ids = [...bulkSelected];
    if (!ids.length) return;
    setBulkLoading(true);
    let ok = 0;
    for (const id of ids) {
      try {
        await adminFetch(`/corporate/companies/${id}/status`, token, { method: 'PATCH', body: JSON.stringify({ status: 'suspended' }) });
        setCompanies(p => p.map(c => c.id === id ? { ...c, status: 'suspended' } : c));
        ok++;
      } catch { /* skip */ }
    }
    setBulkSelected(new Set());
    setBulkLoading(false);
    showToast(`${ok}/${ids.length} empresas suspendidas.`, ok > 0);
  }

  return (
    <AdminLayout userName={auth.user.firstName} onLogout={auth.logout}>
      {selected   && <CompanyModal  company={selected}   token={token} onClose={() => setSelected(null)}
        onUpdate={(id, ch) => { setCompanies(p => p.map(c => c.id === id ? { ...c, ...ch } : c)); showToast('Empresa actualizada.', true); }} />}
      {approving  && <ApproveModal  company={approving}  token={token} onClose={() => setApproving(null)}
        onApproved={id => { setCompanies(p => p.map(c => c.id === id ? { ...c, status: 'active' } : c)); showToast('Empresa aprobada y activada.', true); }} />}
      {rejecting  && <RejectModal   company={rejecting}  token={token} onClose={() => setRejecting(null)}
        onRejected={id => { setCompanies(p => p.filter(c => c.id !== id)); showToast('Solicitud rechazada. Se notificó a la empresa.', true); }} />}

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Empresas Corporativas</h1>
          <p className="text-gray-500 mt-1">Gestión de clientes corporativos y solicitudes de alta</p>
        </div>
        <button onClick={load} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">↻ Actualizar</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon="🏢" title="Total"        value={companies.length}   color="primary" />
        <StatCard icon="✅" title="Activas"       value={activas.length}     color="success" />
        <StatCard icon="⏳" title="Solicitudes"   value={solicitudes.length} color="warning" subtitle={solicitudes.length > 0 ? 'requieren revisión' : ''} />
        <StatCard icon="🚫" title="Suspendidas"   value={suspendidas.length} color="error" />
      </div>

      {solicitudes.length > 0 && tab === 'active' && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <p className="text-sm font-medium text-amber-800">⏳ {solicitudes.length} solicitud{solicitudes.length > 1 ? 'es' : ''} pendiente{solicitudes.length > 1 ? 's' : ''} de revisión</p>
          <button onClick={() => setTab('prospect')} className="text-xs font-semibold text-amber-700 underline">Revisar ahora →</button>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {([['active', 'Empresas activas'], ['prospect', `Solicitudes (${solicitudes.length})`], ['analytics', '📊 Analítica']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Buscar por nombre, email o RUC…" value={search} onChange={e => setSearch(e.target.value)}
          className="border border-slate-200 rounded-lg px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      {/* ── ANALYTICS TAB ── */}
      {tab === 'analytics' && (() => {
        const byTipo = (['grande','negocio','agencia'] as const).map(t => ({
          tipo: t, label: TIPO_LABELS[t].label, color: TIPO_LABELS[t].color,
          count: activas.filter(c => c.tipoCuenta === t).length,
        }));
        const byIndustry = activas.reduce<Record<string,number>>((acc,c) => {
          const k = c.industry ?? 'Sin industria'; acc[k] = (acc[k]??0)+1; return acc;
        }, {});
        const industryRank = Object.entries(byIndustry).sort((a,b)=>b[1]-a[1]).slice(0,5);
        const now = Date.now();
        const approvalTimes = activas.map(c => Math.round((now - new Date(c.createdAt).getTime()) / (1000*60*60*24)));
        const avgDays = approvalTimes.length ? Math.round(approvalTimes.reduce((s,v)=>s+v,0)/approvalTimes.length) : 0;
        const funnelData = [
          {label:'Solicitudes recibidas', value:companies.length, color:'#0033A0'},
          {label:'Actualmente activas',   value:activas.length,   color:'#22c55e'},
          {label:'Suspendidas',           value:suspendidas.length, color:'#ef4444'},
        ];
        const maxF = funnelData[0].value || 1;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {label:'Empresas activas',    value:activas.length,    icon:'✅', color:'text-green-600'},
                {label:'Solicitudes pend.',   value:solicitudes.length,icon:'⏳', color:'text-amber-600'},
                {label:'Días prom. en plat.', value:avgDays,           icon:'📅', color:'text-blue-600'},
                {label:'Sin tipoCuenta',      value:activas.filter(c=>!c.tipoCuenta).length, icon:'⚠', color:'text-red-500'},
              ].map(k => (
                <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <p className="text-xs text-slate-500">{k.icon} {k.label}</p>
                  <p className={`text-2xl font-black mt-1 ${k.color}`}>{k.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pipeline funnel */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">🔽 Pipeline corporativo</h3>
                <div className="space-y-3">
                  {funnelData.map((f,i) => (
                    <div key={f.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{f.label}</span>
                        <span className="font-bold text-slate-900">{f.value}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3">
                        <div className="h-3 rounded-full" style={{width:`${(f.value/maxF)*100}%`, backgroundColor:f.color}} />
                      </div>
                      {i>0 && funnelData[i-1].value>0 && (
                        <p className="text-xs text-slate-400 mt-0.5">{((f.value/funnelData[i-1].value)*100).toFixed(1)}% del total</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* By tipo */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">🏷️ Distribución por tipo</h3>
                <div className="space-y-3">
                  {byTipo.map(t => (
                    <div key={t.tipo} className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${t.color} w-36 text-center`}>{t.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-blue-500" style={{width:`${activas.length>0?(t.count/activas.length)*100:0}%`}} />
                      </div>
                      <span className="text-sm font-bold text-slate-900 w-6 text-right">{t.count}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-4">Solo empresas activas ({activas.length} total)</p>
              </div>
            </div>

            {/* By industry */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">🏭 Top 5 industrias</h3>
              <div className="space-y-3">
                {industryRank.map(([ind,count],i) => (
                  <div key={ind}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-400 w-4">{i+1}</span>
                        <span className="text-slate-700 font-medium">{ind}</span>
                      </div>
                      <span className="font-bold text-slate-900">{count} empresa{count>1?'s':''}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-indigo-500"
                        style={{width:`${industryRank[0]?.[1]>0?(count/industryRank[0][1])*100:0}%`}} />
                    </div>
                  </div>
                ))}
                {industryRank.length===0 && <p className="text-sm text-slate-400">Sin datos de industria registrados.</p>}
              </div>
            </div>

            {/* City distribution */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-3">🌎 Distribución geográfica</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(activas.reduce<Record<string,number>>((acc,c) => {
                  const k = c.city ?? 'Sin ciudad'; acc[k]=(acc[k]??0)+1; return acc;
                }, {})).sort((a,b)=>b[1]-a[1]).map(([city,count]) => (
                  <span key={city} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full">
                    {city} <span className="text-blue-400 font-normal">({count})</span>
                  </span>
                ))}
                {activas.every(c=>!c.city) && <p className="text-sm text-slate-400">Sin datos de ciudad registrados.</p>}
              </div>
            </div>
          </div>
        );
      })()}

      {tab !== 'analytics' && <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">

        {/* Bulk action toolbar */}
        {bulkSelected.size > 0 && (
          <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 border-b border-blue-200">
            <span className="text-sm font-semibold text-blue-800">{bulkSelected.size} seleccionada{bulkSelected.size>1?'s':''}</span>
            <div className="flex gap-2 ml-2">
              {tab === 'prospect' && <>
                <button onClick={bulkApprove} disabled={bulkLoading}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {bulkLoading ? '…' : '✓ Aprobar todas'}
                </button>
                <button onClick={bulkReject} disabled={bulkLoading}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {bulkLoading ? '…' : '✕ Rechazar todas'}
                </button>
              </>}
              {tab === 'active' && (
                <button onClick={bulkSuspend} disabled={bulkLoading}
                  className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50">
                  {bulkLoading ? '…' : '⏸ Suspender todas'}
                </button>
              )}
            </div>
            <button onClick={() => setBulkSelected(new Set())} className="ml-auto text-xs text-blue-500 hover:underline">Limpiar selección</button>
          </div>
        )}

        <div className="grid grid-cols-12 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <div className="col-span-1 flex items-center">
            <input type="checkbox" checked={allSelected} onChange={toggleAll}
              className="w-4 h-4 accent-red-500 cursor-pointer" />
          </div>
          <div className="col-span-3">Empresa</div><div className="col-span-2">RUC</div>
          <div className="col-span-2">{tab === 'prospect' ? 'Industria' : 'Tipo'}</div>
          <div className="col-span-1">Estado</div>
          <div className="col-span-1">Registro</div><div className="col-span-2 text-right">Acciones</div>
        </div>
        {loading && [1,2,3].map(i => <div key={i} className="h-16 mx-4 my-2 bg-slate-100 rounded-lg animate-pulse" />)}
        {!loading && displayed.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">
            {tab === 'prospect' ? 'No hay solicitudes pendientes.' : search ? `Sin resultados para "${search}".` : 'No hay empresas registradas.'}
          </div>
        )}
        {!loading && displayed.map((c, i) => (
          <div key={c.id} className={`grid grid-cols-12 px-5 py-4 items-center gap-2 text-sm ${i < displayed.length - 1 ? 'border-b border-slate-100' : ''} hover:bg-slate-50 ${bulkSelected.has(c.id) ? 'bg-blue-50' : ''}`}>
            <div className="col-span-1">
              <input type="checkbox" checked={bulkSelected.has(c.id)} onChange={() => toggleOne(c.id)}
                className="w-4 h-4 accent-red-500 cursor-pointer" />
            </div>
            <div className="col-span-3 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{c.name}</p>
              <p className="text-xs text-slate-400 truncate">{c.email}</p>
            </div>
            <div className="col-span-2 font-mono text-xs text-slate-600">{c.ruc}</div>
            <div className="col-span-2">
              {tab === 'prospect'
                ? <span className="text-xs text-slate-500">{c.industry ?? '—'}</span>
                : c.tipoCuenta
                  ? <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${TIPO_LABELS[c.tipoCuenta].color}`}>{TIPO_LABELS[c.tipoCuenta].label}</span>
                  : <span className="text-xs text-slate-400 italic">Sin asignar</span>}
            </div>
            <div className="col-span-1 text-slate-600">{c.employees || '—'}</div>
            <div className="col-span-1">
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
            </div>
            <div className="col-span-1 text-xs text-slate-400">{fmtDate(c.createdAt)}</div>
            <div className="col-span-2 flex justify-end gap-1.5">
              {tab === 'prospect' ? (
                <>
                  <button onClick={() => setApproving(c)} className="px-2.5 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700">Aprobar</button>
                  <button onClick={() => setRejecting(c)} className="px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-lg hover:bg-red-100">Rechazar</button>
                </>
              ) : (
                <button onClick={() => setSelected(c)} className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Ver detalle</button>
              )}
            </div>
          </div>
        ))}
      </div>}
    </AdminLayout>
  );
}
