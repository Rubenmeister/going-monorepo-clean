import Layout from '../components/Layout';
import { useSession } from '../lib/auth';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import { corpFetch } from '../lib/api';

type Tab = 'empresa' | 'usuarios' | 'pagos' | 'seguridad';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  department: string;
}

interface CompanySettings {
  companyName: string;
  ruc: string;
  billingEmail: string;
  phone?: string;
  address?: string;
  currency: string;
  requireApproval: boolean;
  trackingEnabled: boolean;
  mfaRequired: boolean;
  dataRetentionMonths: number;
  defaultPaymentMethod: string;
  creditLimit?: number;
  invoiceDays: number;
}

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: '',
  ruc: '',
  billingEmail: '',
  phone: '',
  address: '',
  currency: 'USD',
  requireApproval: true,
  trackingEnabled: true,
  mfaRequired: false,
  dataRetentionMonths: 12,
  defaultPaymentMethod: 'corporate_card',
  creditLimit: 0,
  invoiceDays: 30,
};

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'empresa',   label: 'Empresa',   icon: '🏢' },
  { key: 'usuarios',  label: 'Usuarios',  icon: '👥' },
  { key: 'pagos',     label: 'Pagos',     icon: '💳' },
  { key: 'seguridad', label: 'Seguridad', icon: '🔒' },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador', manager: 'Manager', employee: 'Empleado',
};
const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin:    { bg: '#fee2e2', color: '#991b1b' },
  manager:  { bg: '#dbeafe', color: '#1e40af' },
  employee: { bg: '#f3f4f6', color: '#6b7280' },
};

const INPUT = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff4c41] focus:border-transparent bg-white';
const LABEL = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer py-1">
      <span className="text-sm text-gray-700">{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full relative transition-colors ${checked ? 'bg-[#ff4c41]' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'left-5' : 'left-0.5'}`} />
      </div>
    </label>
  );
}

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState('empresa' as Tab);
  const [cfg, setCfg] = useState(DEFAULT_SETTINGS as CompanySettings);
  const [employees, setEmployees] = useState([] as Employee[]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null as string | null);

  const token = (session as any)?.accessToken ?? '';

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [settingsRes, empRes] = await Promise.allSettled([
        corpFetch<any>('/corporate/settings', token),
        corpFetch<any>('/corporate/employees', token),
      ]);
      if (settingsRes.status === 'fulfilled') {
        const s = settingsRes.value;
        setCfg({
          companyName: s.companyName ?? s.name ?? '',
          ruc: s.ruc ?? s.taxId ?? '',
          billingEmail: s.billingEmail ?? s.email ?? '',
          phone: s.phone ?? '',
          address: s.address ?? '',
          currency: s.currency ?? 'USD',
          requireApproval: Boolean(s.requireApproval ?? true),
          trackingEnabled: Boolean(s.trackingEnabled ?? true),
          mfaRequired: Boolean(s.mfaRequired ?? false),
          dataRetentionMonths: Number(s.dataRetentionMonths ?? 12),
          defaultPaymentMethod: s.defaultPaymentMethod ?? 'corporate_card',
          creditLimit: Number(s.creditLimit ?? 0),
          invoiceDays: Number(s.invoiceDays ?? 30),
        });
      }
      if (empRes.status === 'fulfilled') {
        const e = empRes.value;
        const list: any[] = e.employees ?? e.data ?? (Array.isArray(e) ? e : []);
        setEmployees(list.map((u: any) => ({
          id: u.id ?? u._id,
          name: (u.name ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()) || u.email,
          email: u.email ?? '',
          role: u.role ?? 'employee',
          department: u.department ?? '—',
        })));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);
  useEffect(() => {
    if (status === 'authenticated') load();
  }, [status, load]);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await corpFetch('/corporate/settings', token, { method: 'PUT', body: JSON.stringify(cfg) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof CompanySettings, value: any) => setCfg(prev => ({ ...prev, [key]: value }));

  if (status === 'loading') return null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona tu cuenta corporativa Going Empresas</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">⚠️ {error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ─── EMPRESA ─── */}
            {tab === 'empresa' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h2 className="font-bold text-gray-900">Información de la empresa</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Nombre de la empresa *</label>
                    <input className={INPUT} value={cfg.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Ej: Corporación XYZ S.A." />
                  </div>
                  <div>
                    <label className={LABEL}>RUC / Identificación tributaria</label>
                    <input className={INPUT} value={cfg.ruc} onChange={e => set('ruc', e.target.value)} placeholder="Ej: 1791234567001" />
                  </div>
                  <div>
                    <label className={LABEL}>Email de facturación</label>
                    <input type="email" className={INPUT} value={cfg.billingEmail} onChange={e => set('billingEmail', e.target.value)} placeholder="facturacion@empresa.com" />
                  </div>
                  <div>
                    <label className={LABEL}>Teléfono de contacto</label>
                    <input className={INPUT} value={cfg.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="+593 2 000 0000" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Dirección fiscal</label>
                    <input className={INPUT} value={cfg.address ?? ''} onChange={e => set('address', e.target.value)} placeholder="Av. Principal 123, Quito, Ecuador" />
                  </div>
                  <div>
                    <label className={LABEL}>Moneda</label>
                    <select className={INPUT} value={cfg.currency} onChange={e => set('currency', e.target.value)}>
                      <option value="USD">USD — Dólar americano</option>
                      <option value="EUR">EUR — Euro</option>
                    </select>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <h3 className="text-sm font-bold text-gray-700">Flujo de reservas</h3>
                  <Toggle checked={cfg.requireApproval} onChange={v => set('requireApproval', v)} label="Requerir aprobación de manager para reservas de empleados" />
                  <Toggle checked={cfg.trackingEnabled} onChange={v => set('trackingEnabled', v)} label="Habilitar seguimiento GPS de servicios de transporte" />
                </div>
              </div>
            )}

            {/* ─── USUARIOS ─── */}
            {tab === 'usuarios' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900">Equipo corporativo</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{employees.length} usuario{employees.length !== 1 ? 's' : ''} registrado{employees.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button onClick={() => alert('Funcionalidad de invitación próximamente')}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition"
                    style={{ backgroundColor: '#ff4c41' }}>
                    + Invitar
                  </button>
                </div>
                {employees.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <p className="text-4xl mb-3">👥</p>
                    <p className="font-medium">No hay usuarios registrados</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {employees.map(emp => {
                      const rc = ROLE_COLORS[emp.role] ?? ROLE_COLORS.employee;
                      return (
                        <div key={emp.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: '#ff4c41' }}>
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{emp.name}</p>
                            <p className="text-xs text-gray-400 truncate">{emp.email} · {emp.department}</p>
                          </div>
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                            style={{ backgroundColor: rc.bg, color: rc.color }}>
                            {ROLE_LABELS[emp.role] ?? emp.role}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── PAGOS ─── */}
            {tab === 'pagos' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h2 className="font-bold text-gray-900">Configuración de pagos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Método de pago por defecto</label>
                    <select className={INPUT} value={cfg.defaultPaymentMethod} onChange={e => set('defaultPaymentMethod', e.target.value)}>
                      <option value="corporate_card">💳 Tarjeta corporativa</option>
                      <option value="invoice_30">🧾 Factura a 30 días</option>
                      <option value="cash_transfer">🏦 Transferencia / contado</option>
                      <option value="agency_invoice">✈️ Factura agencia</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Días de crédito para facturas</label>
                    <select className={INPUT} value={cfg.invoiceDays} onChange={e => set('invoiceDays', Number(e.target.value))}>
                      <option value={15}>15 días</option>
                      <option value={30}>30 días (estándar)</option>
                      <option value={45}>45 días</option>
                      <option value={60}>60 días</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Límite de crédito mensual (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input type="number" min="0" className={INPUT + ' pl-7'} value={cfg.creditLimit ?? 0}
                        onChange={e => set('creditLimit', Number(e.target.value))} placeholder="0 = sin límite" />
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-700">
                  <p className="font-semibold mb-1">💡 Tarifas B2B Going Empresas</p>
                  <p>Las tarifas corporativas incluyen IVA, cargo por servicio de gestión y seguro básico. Las condiciones de crédito están sujetas al contrato marco vigente. Para ajustes en tu línea de crédito, contacta a <strong>empresas@goingec.com</strong>.</p>
                </div>
              </div>
            )}

            {/* ─── SEGURIDAD ─── */}
            {tab === 'seguridad' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h2 className="font-bold text-gray-900">Seguridad y privacidad</h2>
                <div className="space-y-4 divide-y divide-gray-100">
                  <div className="space-y-3 pb-4">
                    <h3 className="text-sm font-bold text-gray-700">Acceso y autenticación</h3>
                    <Toggle checked={cfg.mfaRequired} onChange={v => set('mfaRequired', v)} label="Requerir autenticación de dos factores (MFA) para todos los usuarios" />
                  </div>
                  <div className="space-y-3 py-4">
                    <h3 className="text-sm font-bold text-gray-700">Datos y retención</h3>
                    <div>
                      <label className={LABEL}>Retención de datos de reservas</label>
                      <select className={INPUT} value={cfg.dataRetentionMonths} onChange={e => set('dataRetentionMonths', Number(e.target.value))}>
                        <option value={6}>6 meses</option>
                        <option value={12}>12 meses (recomendado)</option>
                        <option value={24}>24 meses</option>
                        <option value={36}>36 meses</option>
                      </select>
                      <p className="text-xs text-gray-400 mt-1.5">Los registros más antiguos se archivarán automáticamente</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
                      <p className="font-semibold text-gray-700">Información de privacidad</p>
                      <p>Going procesa los datos corporativos conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP). Tus datos se almacenan en servidores certificados SOC 2.</p>
                      <p className="mt-2">
                        <a href="mailto:privacidad@goingec.com" className="text-[#ff4c41] underline">privacidad@goingec.com</a> ·
                        <a href="#" className="text-[#ff4c41] underline ml-1">Política de privacidad</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save button (not for users tab) */}
            {tab !== 'usuarios' && (
              <div className="flex items-center gap-3">
                <button onClick={save} disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition hover:opacity-90"
                  style={{ backgroundColor: '#ff4c41' }}>
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
                {saved && (
                  <span className="text-sm text-green-600 font-semibold flex items-center gap-1.5">
                    ✓ Cambios guardados
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
}
