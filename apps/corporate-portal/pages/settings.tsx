import Layout from '../components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import { corpFetch } from '../lib/api';

type SSOProvider = 'okta' | 'azure_ad' | 'google_workspace' | 'none';
type Tab = 'general' | 'sso' | 'spending' | 'users' | 'security';

interface SpendingLimit {
  department: string;
  dailyLimit: number;
  monthlyLimit: number;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface CompanySettings {
  companyName: string;
  ruc: string;
  billingEmail: string;
  currency: string;
  requireApproval: boolean;
  trackingEnabled: boolean;
  mfaRequired: boolean;
  dataRetentionMonths: number;
  ssoProvider: SSOProvider;
  ssoClientId?: string;
  ssoIssuerOrTenant?: string;
  spendingLimits: SpendingLimit[];
}

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: '',
  ruc: '',
  billingEmail: '',
  currency: 'USD',
  requireApproval: false,
  trackingEnabled: true,
  mfaRequired: true,
  dataRetentionMonths: 12,
  ssoProvider: 'none',
  spendingLimits: [],
};

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [cfg, setCfg] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = (session as any)?.accessToken ?? '';

  const loadSettings = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingSettings(true);
      setError(null);
      const [settingsData, employeesData] = await Promise.all([
        corpFetch<any>('/corporate/settings', token),
        corpFetch<any>('/corporate/employees', token).catch(() => ({ employees: [] })),
      ]);

      const s = settingsData.settings ?? settingsData;
      setCfg({
        companyName: s.companyName ?? s.name ?? '',
        ruc: s.ruc ?? s.taxId ?? '',
        billingEmail: s.billingEmail ?? s.email ?? '',
        currency: s.currency ?? 'USD',
        requireApproval: Boolean(s.requireApproval ?? s.approvalRequired),
        trackingEnabled: s.trackingEnabled !== false,
        mfaRequired: s.mfaRequired !== false,
        dataRetentionMonths: Number(s.dataRetentionMonths ?? s.dataRetention ?? 12),
        ssoProvider: (s.ssoProvider ?? 'none') as SSOProvider,
        ssoClientId: s.ssoClientId ?? '',
        ssoIssuerOrTenant: s.ssoIssuerOrTenant ?? s.ssoTenantId ?? s.ssoIssuerUrl ?? '',
        spendingLimits: (s.spendingLimits ?? []).map((l: any) => ({
          department: l.department,
          dailyLimit: Number(l.dailyLimit ?? 0),
          monthlyLimit: Number(l.monthlyLimit ?? 0),
        })),
      });

      const emps = employeesData.employees ?? employeesData.data ?? [];
      setEmployees(
        emps.map((e: any) => ({
          id: e.id ?? e._id,
          name: e.name ?? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
          email: e.email ?? '',
          role: e.role ?? 'Employee',
          department: e.department ?? '—',
        }))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingSettings(false);
    }
  }, [token]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') loadSettings();
  }, [status, loadSettings]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await corpFetch('/corporate/settings', token, {
        method: 'PUT',
        body: JSON.stringify(cfg),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateLimit = (dept: string, field: 'dailyLimit' | 'monthlyLimit', value: number) => {
    setCfg((prev) => ({
      ...prev,
      spendingLimits: prev.spendingLimits.map((l) =>
        l.department === dept ? { ...l, [field]: value } : l
      ),
    }));
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'sso', label: 'SSO / Identity' },
    { id: 'spending', label: 'Spending Limits' },
    { id: 'users', label: 'Team Members' },
    { id: 'security', label: 'Security' },
  ];

  if (status === 'loading') return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">
            Configure your company's portal preferences
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {loadingSettings ? (
          <div className="bg-white rounded-xl shadow p-16 text-center text-gray-400 text-sm animate-pulse">
            Loading settings…
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Sidebar tabs */}
            <nav className="w-48 shrink-0">
              <ul className="space-y-1">
                {TABS.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => setActiveTab(t.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                        activeTab === t.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Content */}
            <div className="flex-1 bg-white rounded-xl shadow p-6">
              {/* General */}
              {activeTab === 'general' && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">
                    Company Settings
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company name
                    </label>
                    <input
                      type="text"
                      value={cfg.companyName}
                      onChange={(e) => setCfg({ ...cfg, companyName: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RUC (Tax ID)
                    </label>
                    <input
                      type="text"
                      value={cfg.ruc}
                      onChange={(e) => setCfg({ ...cfg, ruc: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Billing email
                    </label>
                    <input
                      type="email"
                      value={cfg.billingEmail}
                      onChange={(e) => setCfg({ ...cfg, billingEmail: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default currency
                    </label>
                    <select
                      value={cfg.currency}
                      onChange={(e) => setCfg({ ...cfg, currency: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="USD">USD — US Dollar</option>
                      <option value="EUR">EUR — Euro</option>
                    </select>
                  </div>
                  <Toggle
                    label="Require approval for all bookings"
                    description="Even manager bookings will require Super Admin approval."
                    checked={cfg.requireApproval}
                    onChange={(v) => setCfg({ ...cfg, requireApproval: v })}
                  />
                  <Toggle
                    label="Enable real-time tracking"
                    description="Allow the portal to show live location of active trips (requires employee consent)."
                    checked={cfg.trackingEnabled}
                    onChange={(v) => setCfg({ ...cfg, trackingEnabled: v })}
                  />
                </div>
              )}

              {/* SSO */}
              {activeTab === 'sso' && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">
                    Single Sign-On (SSO)
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Identity provider
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          { id: 'none', label: 'None (email/password)', icon: '🔑' },
                          { id: 'okta', label: 'Okta', icon: '🔷' },
                          { id: 'azure_ad', label: 'Azure AD', icon: '🪟' },
                          { id: 'google_workspace', label: 'Google Workspace', icon: '🇬' },
                        ] as { id: SSOProvider; label: string; icon: string }[]
                      ).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setCfg({ ...cfg, ssoProvider: p.id })}
                          className={`flex items-center gap-2 p-3 border-2 rounded-xl text-sm font-medium transition ${
                            cfg.ssoProvider === p.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span>{p.icon}</span>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {cfg.ssoProvider !== 'none' && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-700">
                        {cfg.ssoProvider === 'okta' && 'Okta Configuration'}
                        {cfg.ssoProvider === 'azure_ad' && 'Azure AD Configuration'}
                        {cfg.ssoProvider === 'google_workspace' && 'Google Workspace Configuration'}
                      </p>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Client ID
                        </label>
                        <input
                          type="text"
                          value={cfg.ssoClientId ?? ''}
                          onChange={(e) => setCfg({ ...cfg, ssoClientId: e.target.value })}
                          placeholder="Enter Client ID..."
                          className="w-full border rounded-lg px-3 py-1.5 text-sm"
                        />
                      </div>
                      {(cfg.ssoProvider === 'okta' || cfg.ssoProvider === 'azure_ad') && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {cfg.ssoProvider === 'okta' ? 'Issuer URL' : 'Tenant ID'}
                          </label>
                          <input
                            type="text"
                            value={cfg.ssoIssuerOrTenant ?? ''}
                            onChange={(e) => setCfg({ ...cfg, ssoIssuerOrTenant: e.target.value })}
                            placeholder={
                              cfg.ssoProvider === 'okta'
                                ? 'https://your-domain.okta.com'
                                : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                            }
                            className="w-full border rounded-lg px-3 py-1.5 text-sm"
                          />
                        </div>
                      )}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                        Callback URL:{' '}
                        <code className="font-mono">
                          https://portal.going.com/api/auth/callback/{cfg.ssoProvider}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Spending Limits */}
              {activeTab === 'spending' && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">
                    Spending Limits by Department
                  </h2>
                  <p className="text-sm text-gray-500">
                    Set daily and monthly limits. Bookings that would exceed these
                    limits require Super Admin approval.
                  </p>
                  {cfg.spendingLimits.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      No spending limits configured yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {cfg.spendingLimits.map((limit) => (
                        <div key={limit.department} className="bg-gray-50 rounded-xl p-4">
                          <p className="font-semibold text-gray-800 mb-3">{limit.department}</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">
                                Daily limit (USD)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={limit.dailyLimit}
                                onChange={(e) =>
                                  updateLimit(limit.department, 'dailyLimit', Number(e.target.value))
                                }
                                className="w-full border rounded-lg px-3 py-1.5 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">
                                Monthly limit (USD)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={limit.monthlyLimit}
                                onChange={(e) =>
                                  updateLimit(limit.department, 'monthlyLimit', Number(e.target.value))
                                }
                                className="w-full border rounded-lg px-3 py-1.5 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Users */}
              {activeTab === 'users' && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">
                    Team Members
                  </h2>
                  {employees.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No team members found.</p>
                  ) : (
                    <div className="space-y-3">
                      {employees.map((u) => (
                        <div key={u.id} className="flex items-center gap-4 p-3 border rounded-xl">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                          <span className="text-xs text-gray-500">{u.department}</span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              u.role === 'super_admin' || u.role === 'Super Admin'
                                ? 'bg-purple-100 text-purple-700'
                                : u.role === 'manager' || u.role === 'Manager'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition">
                    + Invite team member
                  </button>
                </div>
              )}

              {/* Security */}
              {activeTab === 'security' && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">
                    Security & Privacy
                  </h2>
                  <Toggle
                    label="Require MFA for all admins"
                    description="Super Admins and Managers must use two-factor authentication."
                    checked={cfg.mfaRequired}
                    onChange={(v) => setCfg({ ...cfg, mfaRequired: v })}
                  />
                  <Toggle
                    label="Require consent for location tracking"
                    description="Employees must explicitly consent before their location is shared with the company during trips. (LOPD Ecuador compliance)"
                    checked={true}
                    onChange={() => {}}
                    locked
                  />
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                    <p className="font-semibold mb-1">LOPD Ecuador Compliance</p>
                    <p>
                      Consent tracking is mandatory and cannot be disabled to comply with Ecuador's
                      Ley Orgánica de Protección de Datos Personales.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Data retention policy</p>
                    <select
                      value={cfg.dataRetentionMonths}
                      onChange={(e) => setCfg({ ...cfg, dataRetentionMonths: Number(e.target.value) })}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value={12}>12 months</option>
                      <option value={24}>24 months</option>
                      <option value={36}>36 months</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      Booking and tracking data older than this period will be automatically purged.
                    </p>
                  </div>
                </div>
              )}

              {/* Save button */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
                {saved && (
                  <span className="text-sm text-green-600 font-medium">✓ Changes saved</span>
                )}
                {error && (
                  <span className="text-sm text-red-600 font-medium">⚠️ Save failed</span>
                )}
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  locked = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  locked?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <button
        type="button"
        disabled={locked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 mt-0.5 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        } ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 m-0.5 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
