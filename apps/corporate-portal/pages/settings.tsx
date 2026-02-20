import Layout from '../components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type SSOProvider = 'okta' | 'azure_ad' | 'google_workspace' | 'none';
type Tab = 'general' | 'sso' | 'spending' | 'users' | 'security';

interface SpendingLimit {
  department: string;
  dailyLimit: number;
  monthlyLimit: number;
}

const MOCK_LIMITS: SpendingLimit[] = [
  { department: 'Sales', dailyLimit: 200, monthlyLimit: 3000 },
  { department: 'Engineering', dailyLimit: 150, monthlyLimit: 2000 },
  { department: 'Marketing', dailyLimit: 100, monthlyLimit: 1500 },
  { department: 'HR', dailyLimit: 80, monthlyLimit: 1000 },
];

export default function Settings() {
  const { status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [ssoProvider, setSsoProvider] = useState<SSOProvider>('none');
  const [mfaRequired, setMfaRequired] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [limits, setLimits] = useState<SpendingLimit[]>(MOCK_LIMITS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateLimit = (
    dept: string,
    field: 'dailyLimit' | 'monthlyLimit',
    value: number
  ) => {
    setLimits((prev) =>
      prev.map((l) => (l.department === dept ? { ...l, [field]: value } : l))
    );
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
                    defaultValue="Acme Corp Ecuador"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RUC (Tax ID)
                  </label>
                  <input
                    type="text"
                    defaultValue="1790012345001"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing email
                  </label>
                  <input
                    type="email"
                    defaultValue="finance@acme.com.ec"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default currency
                  </label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </div>
                <Toggle
                  label="Require approval for all bookings"
                  description="Even manager bookings will require Super Admin approval."
                  checked={requireApproval}
                  onChange={setRequireApproval}
                />
                <Toggle
                  label="Enable real-time tracking"
                  description="Allow the portal to show live location of active trips (requires employee consent)."
                  checked={trackingEnabled}
                  onChange={setTrackingEnabled}
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
                        {
                          id: 'none',
                          label: 'None (email/password)',
                          icon: '🔑',
                        },
                        { id: 'okta', label: 'Okta', icon: '🔷' },
                        { id: 'azure_ad', label: 'Azure AD', icon: '🪟' },
                        {
                          id: 'google_workspace',
                          label: 'Google Workspace',
                          icon: '🇬',
                        },
                      ] as { id: SSOProvider; label: string; icon: string }[]
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSsoProvider(p.id)}
                        className={`flex items-center gap-2 p-3 border-2 rounded-xl text-sm font-medium transition ${
                          ssoProvider === p.id
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

                {ssoProvider !== 'none' && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">
                      {ssoProvider === 'okta' && 'Okta Configuration'}
                      {ssoProvider === 'azure_ad' && 'Azure AD Configuration'}
                      {ssoProvider === 'google_workspace' &&
                        'Google Workspace Configuration'}
                    </p>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Client ID
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Client ID..."
                        className="w-full border rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Client Secret
                      </label>
                      <input
                        type="password"
                        placeholder="Enter Client Secret..."
                        className="w-full border rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>
                    {(ssoProvider === 'okta' || ssoProvider === 'azure_ad') && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {ssoProvider === 'okta' ? 'Issuer URL' : 'Tenant ID'}
                        </label>
                        <input
                          type="text"
                          placeholder={
                            ssoProvider === 'okta'
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
                        https://portal.going.com/api/auth/callback/{ssoProvider}
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
                <div className="space-y-4">
                  {limits.map((limit) => (
                    <div
                      key={limit.department}
                      className="bg-gray-50 rounded-xl p-4"
                    >
                      <p className="font-semibold text-gray-800 mb-3">
                        {limit.department}
                      </p>
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
                              updateLimit(
                                limit.department,
                                'dailyLimit',
                                Number(e.target.value)
                              )
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
                              updateLimit(
                                limit.department,
                                'monthlyLimit',
                                Number(e.target.value)
                              )
                            }
                            className="w-full border rounded-lg px-3 py-1.5 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {activeTab === 'users' && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">
                  Team Members
                </h2>
                <div className="space-y-3">
                  {[
                    {
                      name: 'Carlos Rodríguez',
                      email: 'c.rodriguez@acme.com',
                      role: 'Super Admin',
                      dept: 'Sales',
                    },
                    {
                      name: 'Ana Martínez',
                      email: 'a.martinez@acme.com',
                      role: 'Manager',
                      dept: 'Engineering',
                    },
                    {
                      name: 'Luis Pérez',
                      email: 'l.perez@acme.com',
                      role: 'Employee',
                      dept: 'Marketing',
                    },
                    {
                      name: 'María Gómez',
                      email: 'm.gomez@acme.com',
                      role: 'Employee',
                      dept: 'HR',
                    },
                  ].map((u, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 border rounded-xl"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">
                          {u.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {u.email}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">{u.dept}</span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.role === 'Super Admin'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'Manager'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
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
                  checked={mfaRequired}
                  onChange={setMfaRequired}
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
                    Consent tracking is mandatory and cannot be disabled to
                    comply with Ecuador's Ley Orgánica de Protección de Datos
                    Personales.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Data retention policy
                  </p>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                    <option value="36">36 months</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Booking and tracking data older than this period will be
                    automatically purged.
                  </p>
                </div>
              </div>
            )}

            {/* Save button (shared) */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
              {saved && (
                <span className="text-sm text-green-600 font-medium">
                  ✓ Changes saved
                </span>
              )}
              <button
                onClick={save}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
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
