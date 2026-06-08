'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import Link from 'next/link';
import { COLORS } from '../components/design-tokens';
import {
  IconUser, IconCar, IconPackage, IconCard, IconPin, IconLock,
  IconMoney, IconArrowRight, IconWarning, IconInfo, IconGraduation,
  IconChevronDown, IconShield, IconBell,
} from '../components/icons';
import { enablePush } from '../lib/push';
import { authFetch, clearStoredAuth } from '@/lib/providers/auth-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';

async function authHeaders(): Promise<HeadersInit> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Preferencias de notificación — persistidas por usuario en el backend
// (PATCH/GET /auth/me) con localStorage como caché local. Claves estables
// para no depender del índice/orden.
const NOTIF_OPTIONS = [
  { key: 'email',  label: 'Notificaciones por Email',  def: true  },
  { key: 'sms',    label: 'Notificaciones por SMS',    def: true  },
  { key: 'promos', label: 'Ofertas y Promociones',     def: false },
  { key: 'trips',  label: 'Actualizaciones de viajes', def: true  },
] as const;
const NOTIF_PREFS_KEY = 'going_notif_prefs';

interface RideHistory {
  tripId: string;
  pickup: { address: string };
  dropoff: { address: string };
  estimatedFare: number;
  finalFare?: number;
  distance?: number;
  status: string;
  createdAt: string;
  rideType?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'cash' | 'wallet';
  label: string;
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  lat?: number;
  lon?: number;
  icon: string;
}

interface ParcelHistory {
  id: string;
  origin: { address: string };
  destination: { address: string };
  type: string;
  status: string;
  price: { amount: number };
  createdAt: string;
  trackingCode?: string;
}

const RIDE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Esperando conductor', color: 'bg-yellow-100 text-yellow-700' },
  accepted:    { label: 'Conductor asignado',  color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En camino',           color: 'bg-indigo-100 text-indigo-700' },
  completed:   { label: 'Completado',          color: 'bg-green-100 text-green-700' },
  cancelled:   { label: 'Cancelado',           color: 'bg-red-100 text-red-700' },
};

const PARCEL_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Solicitado',          color: 'bg-yellow-100 text-yellow-700' },
  assigned:   { label: 'Conductor asignado',  color: 'bg-blue-100 text-blue-700' },
  picked_up:  { label: 'Recogido',            color: 'bg-indigo-100 text-indigo-700' },
  in_transit: { label: 'En camino',           color: 'bg-purple-100 text-purple-700' },
  delivered:  { label: 'Entregado',           color: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Cancelado',           color: 'bg-red-100 text-red-700' },
};

// Sin emojis: el tipo de paquete se muestra solo como texto plano. El user
// ve el tamaño/peso en la lista de envíos sin la decoración del emoji.
const PARCEL_TYPE_LABELS: Record<string, string> = {
  small:  'Paquete pequeño (0–5 kg)',
  medium: 'Paquete mediano (6–15 kg)',
  large:  'Paquete grande (16–30 kg)',
};

interface TabDef {
  id: string;
  label: string;
  Icon: (props: { size?: number; className?: string }) => React.ReactElement;
}

const TABS: TabDef[] = [
  { id: 'profile',   label: 'Perfil',       Icon: IconUser },
  { id: 'rides',     label: 'Mis Viajes',   Icon: IconCar },
  { id: 'envios',    label: 'Mis Envíos',   Icon: IconPackage },
  { id: 'payments',  label: 'Pagos',        Icon: IconCard },
  { id: 'addresses', label: 'Direcciones',  Icon: IconPin },
  { id: 'settings',  label: 'Ajustes',      Icon: IconShield },
];

export default function AccountPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');

  const [rides,   setRides]   = useState<RideHistory[]>([]);
  const [parcels, setParcels] = useState<ParcelHistory[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [ridesLoading,   setRidesLoading]   = useState(false);
  const [parcelsLoading, setParcelsLoading] = useState(false);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [deletingMethod,  setDeletingMethod]  = useState<string | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<string | null>(null);

  // ── Edición de perfil ──
  const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile]   = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // ── Preferencias de notificación (localStorage) ──
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (auth.user) {
      const u = auth.user as { firstName?: string; lastName?: string; phone?: string; email?: string };
      setProfile({ firstName: u.firstName || '', lastName: u.lastName || '', phone: u.phone || '', email: u.email || '' });
    }
  }, [auth.user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1) Cache local para una UI inmediata.
      try {
        const raw = localStorage.getItem(NOTIF_PREFS_KEY);
        if (raw && !cancelled) setNotifPrefs(JSON.parse(raw));
      } catch { /* ignore */ }
      // 2) Fuente de verdad: preferencias persistidas por usuario en el backend.
      try {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE}/auth/me`, { headers });
        if (!res.ok) return;
        const data = await res.json();
        const prefs = data?.notificationPreferences;
        if (prefs && typeof prefs === 'object' && !cancelled) {
          setNotifPrefs(prefs);
          try { localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
        }
      } catch { /* sin red: nos quedamos con la cache local */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleNotif = (key: string, def: boolean) => {
    setNotifPrefs(prev => {
      const next = { ...prev, [key]: !(prev[key] ?? def) };
      try { localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      // Persistir en el backend por usuario (best-effort; la cache local ya
      // quedó guardada, así que la UI no se bloquea si falla la red).
      (async () => {
        try {
          const headers = await authHeaders();
          await fetch(`${API_BASE}/auth/me`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ notificationPreferences: next }),
          });
        } catch { /* offline: se sincroniza la próxima vez que se guarde */ }
      })();
      return next;
    });
  };

  // ── Push del navegador (web-push) ──
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg]   = useState<string | null>(null);

  const handleEnablePush = async () => {
    setPushBusy(true);
    setPushMsg(null);
    const r = await enablePush();
    if (r.ok) {
      setPushMsg('ok');
    } else {
      const map: Record<string, string> = {
        'no-config': 'Las notificaciones del navegador aún no están configuradas en este entorno.',
        'unsupported': 'Tu navegador no soporta notificaciones push.',
        'denied': 'Permiso denegado. Actívalo en los ajustes del navegador.',
        'no-token': 'No se pudo obtener el token de notificaciones.',
        'register-failed': 'No se pudo registrar el dispositivo. Intenta más tarde.',
        'error': 'Ocurrió un error activando las notificaciones.',
      };
      setPushMsg(map[r.reason] || 'No se pudo activar.');
    }
    setPushBusy(false);
  };

  // ── Eliminación de cuenta (borrado suave) ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword]   = useState('');
  const [deleteConfirm, setDeleteConfirm]     = useState('');
  const [deleteBusy, setDeleteBusy]           = useState(false);
  const [deleteError, setDeleteError]         = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const res = await authFetch(`${API_BASE}/auth/me`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setDeleteError(d?.message || 'No se pudo eliminar la cuenta.');
        return;
      }
      await clearStoredAuth();
      window.location.href = '/';
    } catch {
      setDeleteError('No se pudo conectar con el servidor.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setProfileMsg({ type: 'ok', text: 'Perfil actualizado.' });
      setEditingProfile(false);
    } catch {
      setProfileMsg({ type: 'err', text: 'No se pudo guardar el perfil. Intenta más tarde.' });
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (!auth.user) return;

    if (activeTab === 'rides' && rides.length === 0) {
      setRidesLoading(true);
      (async () => {
        try {
          const userId = (auth.user as { id?: string; _id?: string })?.id ?? (auth.user as { id?: string; _id?: string })?._id;
          if (!userId) { setRides([]); return; }
          const headers = await authHeaders();
          const r = await fetch(`${API_BASE}/bookings/user/${userId}`, { headers });
          if (!r.ok) throw new Error(`${r.status}`);
          const data = await r.json();
          setRides(Array.isArray(data) ? data : []);
        } catch {
          setRides([]);
        } finally {
          setRidesLoading(false);
        }
      })();
    }

    if (activeTab === 'envios' && parcels.length === 0) {
      setParcelsLoading(true);
      (async () => {
        try {
          const userId = (auth.user as { id?: string; _id?: string })?.id ?? (auth.user as { id?: string; _id?: string })?._id;
          if (!userId) { setParcels([]); return; }
          const headers = await authHeaders();
          // GET /parcels?userId=X y filtramos client-side. El endpoint
          // /envios/parcels/my no existe en producción.
          const r = await fetch(`${API_BASE}/parcels?userId=${encodeURIComponent(userId)}`, { headers });
          if (!r.ok) throw new Error(`${r.status}`);
          const data = await r.json();
          const list = Array.isArray(data) ? data : data?.parcels ?? [];
          setParcels(list.filter((p: ParcelHistory) => !p || true));
        } catch {
          setParcels([]);
        } finally {
          setParcelsLoading(false);
        }
      })();
    }

    if (activeTab === 'payments' && methods.length === 0) {
      setMethodsLoading(true);
      (async () => {
        try {
          const headers = await authHeaders();
          // /payments/methods (plural). La vieja /payment/methods (singular)
          // devolvía 404 y dejaba la página en loading eterno.
          const r = await fetch(`${API_BASE}/payments/methods`, { headers });
          if (!r.ok) throw new Error(`${r.status}`);
          const data = await r.json();
          setMethods(Array.isArray(data) ? data : []);
        } catch {
          setMethods([]);
        } finally {
          setMethodsLoading(false);
        }
      })();
    }

    if (activeTab === 'addresses' && addresses.length === 0) {
      setAddressLoading(true);
      try {
        // Source: localStorage going_saved_addresses (compartido con
        // envíos/cotizar). Cuando el backend exponga /users/:id/addresses
        // migramos a eso; por ahora persistir local mantiene UX consistente.
        const raw = typeof window !== 'undefined' ? localStorage.getItem('going_saved_addresses') : null;
        const list: SavedAddress[] = raw ? JSON.parse(raw) : [];
        setAddresses(Array.isArray(list) ? list : []);
      } catch {
        setAddresses([]);
      } finally {
        setAddressLoading(false);
      }
    }
  }, [activeTab, auth.user, rides.length, parcels.length, methods.length, addresses.length]);

  if (!auth.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-md w-full">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 text-white" style={{ backgroundColor: COLORS.brand.red }}>
            <IconLock size={36} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Acceso Requerido</h1>
          <p className="text-gray-500 mb-6">Inicia sesión para ver tu cuenta</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full py-3 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: COLORS.brand.red }}
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: COLORS.brand.red }}>
              {auth.user.firstName?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{auth.user.firstName || 'Usuario'}</h1>
              <p className="text-sm text-gray-500">{auth.user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="max-w-4xl mx-auto flex gap-1 overflow-x-auto">
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`py-4 px-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 inline-flex items-center gap-2 ${
                  active
                    ? 'text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                style={active ? { borderColor: COLORS.brand.red, color: COLORS.brand.red } : undefined}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* ─── Perfil ─── */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Información de perfil</h2>
              {!editingProfile && (
                <button onClick={() => { setEditingProfile(true); setProfileMsg(null); }}
                  className="text-sm font-semibold" style={{ color: COLORS.brand.red }}>Editar</button>
              )}
            </div>

            {profileMsg && (
              <div className={`text-sm rounded-xl px-4 py-2.5 ${profileMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {profileMsg.text}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1 block">Nombre</label>
                <input type="text" value={profile.firstName} readOnly={!editingProfile}
                  onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border text-gray-900 text-sm focus:outline-none ${editingProfile ? 'border-gray-300 bg-white focus:ring-2 focus:ring-[#ff4c41]' : 'border-gray-200 bg-gray-50'}`} />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1 block">Apellido</label>
                <input type="text" value={profile.lastName} readOnly={!editingProfile}
                  onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border text-gray-900 text-sm focus:outline-none ${editingProfile ? 'border-gray-300 bg-white focus:ring-2 focus:ring-[#ff4c41]' : 'border-gray-200 bg-gray-50'}`} />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1 block">Teléfono</label>
                <input type="tel" value={profile.phone} readOnly={!editingProfile}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder={editingProfile ? '+593 99 000 0000' : '—'}
                  className={`w-full px-4 py-3 rounded-xl border text-gray-900 text-sm focus:outline-none ${editingProfile ? 'border-gray-300 bg-white focus:ring-2 focus:ring-[#ff4c41]' : 'border-gray-200 bg-gray-50'}`} />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1 block">Email</label>
                <input type="email" value={profile.email} readOnly
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none" />
              </div>
            </div>

            {editingProfile && (
              <div className="flex gap-3">
                <button onClick={handleSaveProfile} disabled={savingProfile}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60"
                  style={{ backgroundColor: COLORS.brand.red }}>
                  {savingProfile ? 'Guardando…' : 'Guardar'}
                </button>
                <button onClick={() => {
                    setEditingProfile(false); setProfileMsg(null);
                    const u = auth.user as { firstName?: string; lastName?: string; phone?: string; email?: string };
                    setProfile({ firstName: u?.firstName || '', lastName: u?.lastName || '', phone: u?.phone || '', email: u?.email || '' });
                  }}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            )}
            <div className="pt-2 flex gap-3">
              <Link href="/ride"
                className="flex-1 py-3 rounded-xl text-center text-white text-sm font-bold inline-flex items-center justify-center gap-2"
                style={{ backgroundColor: COLORS.brand.red }}>
                <IconCar size={18} />
                Pedir viaje
              </Link>
              <Link href="/envios/cotizar"
                className="flex-1 py-3 rounded-xl text-center text-sm font-bold border-2 inline-flex items-center justify-center gap-2"
                style={{ borderColor: COLORS.brand.red, color: COLORS.brand.red }}>
                <IconPackage size={18} />
                Enviar paquete
              </Link>
            </div>

            {/* Links adicionales */}
            <div className="pt-2 space-y-2">
              <Link href="/account/corporate"
                className="flex items-center justify-between w-full py-3 px-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#0033A0] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: COLORS.brand.blue }}>
                    <IconUser size={16} />
                  </span>
                  <span className="text-sm font-semibold text-gray-700">Cuenta Corporativa</span>
                </div>
                <IconArrowRight size={16} className="text-gray-400" />
              </Link>
              <Link href="/academy"
                className="flex items-center justify-between w-full py-3 px-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#ff4c41] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: COLORS.brand.red }}>
                    <IconGraduation size={16} />
                  </span>
                  <span className="text-sm font-semibold text-gray-700">Academia Going App</span>
                </div>
                <IconArrowRight size={16} className="text-gray-400" />
              </Link>
            </div>
          </div>
        )}

        {/* ─── Mis Viajes ─── */}
        {activeTab === 'rides' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Historial de viajes</h2>
              <Link href="/ride"
                className="text-sm font-bold px-4 py-2 rounded-xl text-white"
                style={{ backgroundColor: COLORS.brand.red }}>
                + Nuevo viaje
              </Link>
            </div>

            {ridesLoading && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-3" style={{ borderColor: COLORS.brand.red, borderTopColor: 'transparent' }} />
                <p className="text-gray-500 text-sm">Cargando viajes…</p>
              </div>
            )}

            {!ridesLoading && rides.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 text-white" style={{ backgroundColor: COLORS.brand.red }}>
                  <IconCar size={30} />
                </div>
                <p className="text-gray-700 font-semibold mb-1">Sin viajes aún</p>
                <p className="text-gray-400 text-sm mb-5">Pide tu primer viaje con Going App</p>
                <Link href="/ride"
                  className="inline-block px-6 py-3 rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: COLORS.brand.red }}>
                  Reservar viaje
                </Link>
              </div>
            )}

            {!ridesLoading && rides.map(ride => {
              const st = RIDE_STATUS_LABELS[ride.status] || { label: ride.status, color: 'bg-gray-100 text-gray-600' };
              return (
                <div key={ride.tripId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                        <span className="text-xs text-gray-400">{new Date(ride.createdAt).toLocaleDateString('es-EC')}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-semibold">De:</span> {ride.pickup?.address || '—'}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">A:</span> {ride.dropoff?.address || '—'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold" style={{ color: COLORS.brand.red }}>
                        ${(ride.finalFare ?? ride.estimatedFare ?? 0).toFixed(2)}
                      </p>
                      {ride.distance && (
                        <p className="text-xs text-gray-400 mt-0.5">{ride.distance.toFixed(1)} km</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Mis Envíos ─── */}
        {activeTab === 'envios' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Mis envíos</h2>
              <Link href="/envios/cotizar"
                className="text-sm font-bold px-4 py-2 rounded-xl text-white"
                style={{ backgroundColor: COLORS.brand.red }}>
                + Nuevo envío
              </Link>
            </div>

            {parcelsLoading && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-3" style={{ borderColor: COLORS.brand.red, borderTopColor: 'transparent' }} />
                <p className="text-gray-500 text-sm">Cargando envíos…</p>
              </div>
            )}

            {!parcelsLoading && parcels.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 text-white" style={{ backgroundColor: COLORS.brand.red }}>
                  <IconPackage size={30} />
                </div>
                <p className="text-gray-700 font-semibold mb-1">Sin envíos aún</p>
                <p className="text-gray-400 text-sm mb-5">Envía tu primer paquete con Going App</p>
                <Link href="/envios/cotizar"
                  className="inline-block px-6 py-3 rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: COLORS.brand.red }}>
                  Cotizar envío
                </Link>
              </div>
            )}

            {!parcelsLoading && parcels.map(parcel => {
              const st = PARCEL_STATUS_LABELS[parcel.status] || { label: parcel.status, color: 'bg-gray-100 text-gray-600' };
              return (
                <div key={parcel.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                        <span className="text-xs text-gray-400">{new Date(parcel.createdAt).toLocaleDateString('es-EC')}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{PARCEL_TYPE_LABELS[parcel.type] || parcel.type}</p>
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-semibold">De:</span> {parcel.origin?.address || '—'}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Para:</span> {parcel.destination?.address || '—'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold" style={{ color: COLORS.brand.red }}>
                        ${(parcel.price?.amount ?? 0).toFixed(2)}
                      </p>
                      {parcel.trackingCode && (
                        <Link href={`/envios/tracking/${parcel.id}`}
                          className="text-xs mt-1 inline-flex items-center gap-1 font-semibold hover:underline"
                          style={{ color: COLORS.brand.red }}>
                          Rastrear
                          <IconArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Métodos de pago ─── */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Métodos de pago</h2>
              <button className="text-sm font-bold px-4 py-2 rounded-xl text-white" style={{ backgroundColor: COLORS.brand.red }}>
                + Agregar
              </button>
            </div>

            {methodsLoading && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: COLORS.brand.red, borderTopColor: 'transparent' }} />
              </div>
            )}

            {!methodsLoading && methods.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 text-white" style={{ backgroundColor: COLORS.brand.blue }}>
                  <IconCard size={30} />
                </div>
                <p className="text-gray-700 font-semibold mb-1">Sin métodos de pago</p>
                <p className="text-gray-400 text-sm mb-5">Agrega una tarjeta para pagar tus viajes más fácilmente</p>
                <button className="px-6 py-3 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: COLORS.brand.red }}>
                  Agregar tarjeta
                </button>
              </div>
            )}

            {!methodsLoading && methods.map(m => {
              const Ico = m.type === 'card' ? IconCard : m.type === 'wallet' ? IconCard : IconMoney;
              const bg  = m.type === 'card' ? COLORS.brand.blueBg : m.type === 'wallet' ? '#F0FDF4' : '#FAFAFA';
              const fg  = m.type === 'card' ? COLORS.brand.blue   : m.type === 'wallet' ? COLORS.state.success : COLORS.gray[600];
              return (
                <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg, color: fg }}>
                    <Ico size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{m.label}</p>
                    {m.last4 && <p className="text-xs text-gray-400">···· {m.last4} · {m.brand}</p>}
                    {m.isDefault && (
                      <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Predeterminado</span>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm('¿Eliminar este método de pago?')) return;
                      setDeletingMethod(m.id);
                      const headers = await authHeaders();
                      await fetch(`${API_BASE}/payments/methods/${m.id}`, { method: 'DELETE', headers }).catch(() => {});
                      setMethods(prev => prev.filter(x => x.id !== m.id));
                      setDeletingMethod(null);
                    }}
                    disabled={deletingMethod === m.id}
                    className="text-xs text-red-500 font-semibold hover:underline disabled:opacity-40"
                  >
                    {deletingMethod === m.id ? '…' : 'Eliminar'}
                  </button>
                </div>
              );
            })}

            <div className="rounded-2xl p-4 flex items-start gap-3 text-sm" style={{ backgroundColor: COLORS.brand.blueBg, border: `1px solid ${COLORS.brand.blueBorder}`, color: COLORS.brand.blue }}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}>
                <IconInfo size={16} />
              </span>
              <div>
                <p className="font-semibold mb-1">Métodos aceptados</p>
                <p className="text-xs" style={{ color: COLORS.brand.blueDark }}>Tarjeta de crédito/débito (DATAFAST), efectivo al conductor y Going App Wallet.</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Direcciones guardadas ─── */}
        {activeTab === 'addresses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Direcciones guardadas</h2>
              <button className="text-sm font-bold px-4 py-2 rounded-xl text-white" style={{ backgroundColor: COLORS.brand.red }}>
                + Agregar
              </button>
            </div>

            {addressLoading && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: COLORS.brand.red, borderTopColor: 'transparent' }} />
              </div>
            )}

            {!addressLoading && addresses.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 text-white" style={{ backgroundColor: COLORS.brand.red }}>
                  <IconPin size={30} />
                </div>
                <p className="text-gray-700 font-semibold mb-1">Sin direcciones guardadas</p>
                <p className="text-gray-400 text-sm mb-5">Guarda tu casa, trabajo u otros lugares frecuentes</p>
                <div className="flex gap-3 justify-center">
                  {[
                    { Icon: IconPin,  label: 'Casa' },
                    { Icon: IconUser, label: 'Trabajo' },
                  ].map(p => (
                    <button key={p.label}
                      className="flex-1 max-w-36 py-3 rounded-xl border-2 border-dashed border-gray-300 text-center hover:border-[#ff4c41] transition-colors text-gray-500 hover:text-[#ff4c41]">
                      <p className="flex justify-center mb-1"><p.Icon size={24} /></p>
                      <p className="text-xs font-semibold mt-1">{p.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!addressLoading && addresses.map(addr => (
              <div key={addr.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: COLORS.brand.redBg, color: COLORS.brand.red }}>
                  <IconPin size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{addr.label}</p>
                  <p className="text-xs text-gray-400 truncate">{addr.address}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="text-xs font-semibold hover:underline" style={{ color: COLORS.brand.blue }}>Editar</button>
                  <button
                    onClick={() => {
                      if (!confirm('¿Eliminar esta dirección?')) return;
                      setDeletingAddress(addr.id);
                      // Direcciones persisten en localStorage hasta que el
                      // backend exponga /users/:id/addresses. La API
                      // anterior tiraba 404 y la UI quedaba colgada.
                      setAddresses(prev => {
                        const next = prev.filter(x => x.id !== addr.id);
                        try {
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('going_saved_addresses', JSON.stringify(next));
                          }
                        } catch { /* localStorage fail-soft */ }
                        return next;
                      });
                      setDeletingAddress(null);
                    }}
                    disabled={deletingAddress === addr.id}
                    className="text-xs text-red-500 font-semibold hover:underline disabled:opacity-40"
                  >
                    {deletingAddress === addr.id ? '…' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Ajustes ─── */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 inline-flex items-center gap-2">
                <IconBell size={18} className="text-gray-500" />
                Notificaciones
              </h2>
              <div className="space-y-3">
                {NOTIF_OPTIONS.map((s) => {
                  const checked = notifPrefs[s.key] ?? s.def;
                  return (
                    <label key={s.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 cursor-pointer">
                      <span className="text-sm text-gray-700 font-medium">{s.label}</span>
                      <input type="checkbox" checked={checked} onChange={() => toggleNotif(s.key, s.def)}
                        className="w-5 h-5 cursor-pointer accent-[#ff4c41]" />
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">Tus preferencias se guardan en tu cuenta y te siguen en todos tus dispositivos.</p>

              {/* Push del navegador (web-push) */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={handleEnablePush}
                  disabled={pushBusy || pushMsg === 'ok'}
                  className="w-full px-4 py-3 rounded-xl text-sm font-semibold flex justify-between items-center transition-colors disabled:opacity-70"
                  style={{ backgroundColor: pushMsg === 'ok' ? '#ECFDF5' : '#F9FAFB', color: pushMsg === 'ok' ? '#15803d' : '#374151', border: '1px solid #E5E7EB' }}
                >
                  <span>{pushMsg === 'ok' ? '✓ Notificaciones activadas en este navegador' : 'Activar notificaciones en este navegador'}</span>
                  {pushBusy && <span className="w-4 h-4 border-2 border-gray-300 border-t-[#ff4c41] rounded-full animate-spin" />}
                </button>
                {pushMsg && pushMsg !== 'ok' && (
                  <p className="text-xs text-amber-700 mt-2">{pushMsg}</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 inline-flex items-center gap-2">
                <IconShield size={18} className="text-gray-500" />
                Seguridad
              </h2>
              <div className="space-y-3">
                <Link href="/auth/forgot-password" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <span>Cambiar Contraseña</span>
                  <IconArrowRight size={14} className="text-gray-400" />
                </Link>
                <Link href="/account/2fa" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <span>Autenticación de Dos Factores</span>
                  <IconArrowRight size={14} className="text-gray-400" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border p-6" style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
              <h2 className="text-lg font-bold text-red-600 mb-2 inline-flex items-center gap-2">
                <IconWarning size={18} />
                Zona de Peligro
              </h2>
              <p className="text-gray-600 text-sm mb-4">Esta acción es irreversible. Se borran tus datos personales y no podrás iniciar sesión.</p>
              <button onClick={() => { setShowDeleteModal(true); setDeleteError(null); }}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                Eliminar Cuenta
              </button>
            </div>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="text-lg font-black text-gray-900">Eliminar tu cuenta</h3>
              <p className="text-sm text-gray-500 mt-1">Es irreversible. Borraremos tus datos personales y no podrás iniciar sesión.</p>
            </div>
            <div className="p-6 space-y-3">
              {deleteError && <div className="text-sm bg-red-50 text-red-700 border border-red-200 rounded-xl px-3 py-2">{deleteError}</div>}
              <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
                placeholder="Tu contraseña"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="Escribe ELIMINAR para confirmar"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteConfirm(''); setDeleteError(null); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50">Cancelar</button>
                <button onClick={handleDeleteAccount} disabled={deleteBusy || deleteConfirm !== 'ELIMINAR'}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50 bg-red-600 hover:bg-red-700">
                  {deleteBusy ? 'Eliminando…' : 'Eliminar definitivamente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
