'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { COLORS } from '../../components/design-tokens';
import { IconPackage, IconMailbox, IconCard, IconMoney, IconMobile, IconUsers } from '../../components/icons';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

// Borrador del formulario: si el usuario debe iniciar sesión al solicitar,
// guardamos lo que llevaba lleno y lo restauramos al volver (no perder datos).
const ENVIO_DRAFT_KEY = 'going_envio_draft';

// ── Constantes ────────────────────────────────────────────────────────────────
const RED   = COLORS.brand.red;   // rojo Going App — origen/CTA principales
const GREEN = COLORS.state.success; // verde de sistema (estados entregado/pagado/verificado), NO marca
const BLUE  = COLORS.brand.blue;  // azul Going App — destino, info secundario
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Tarifas oficiales Going App (urbano flat). Para envíos interurbanos el backend
// /parcels/quote sobrescribe con tarifa real por corredor — los precios acá
// son el fallback / estimado urbano.
//   pequeño  ≤5 kg     → $8
//   mediano  6–15 kg   → $12
//   grande   16–30 kg  → $15
const PACKAGE_TYPES = [
  { id: 'small',  label: 'Pequeño', desc: '0–5 kg',   price: 8  },
  { id: 'medium', label: 'Mediano', desc: '6–15 kg',  price: 12 },
  { id: 'large',  label: 'Grande',  desc: '16–30 kg', price: 15 },
] as const;
type PkgId = typeof PACKAGE_TYPES[number]['id'];
type ScreenView = 'form' | 'tracking' | 'delivered';

interface Suggestion { display_name: string; lat: string; lon: string; }

// ── Inline SVGs ───────────────────────────────────────────────────────────────
const IcoUp    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 16"/><polyline points="8 12 12 8 16 12"/></svg>;
const IcoDown  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 16 12 8"/><polyline points="16 12 12 16 8 12"/></svg>;
const IcoCube  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L11 21.73a2 2 0 0 0 2 0L20 17.73A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IcoLock  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IcoCheck = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoPin   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>;
const IcoPhone = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.28h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IcoPerson = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoArrow = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

// ── Geocoding ─────────────────────────────────────────────────────────────────
async function fetchSuggestions(query: string): Promise<Suggestion[]> {
  if (query.length < 2) return [];
  try {
    if (MAPBOX_TOKEN) {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
        + `?country=ec&language=es&limit=5&types=place,locality,neighborhood,address,poi&access_token=${MAPBOX_TOKEN}`;
      const res  = await fetch(url);
      const json = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (json.features as any[]).map((f: any) => ({
        display_name: f.place_name,
        lat: String(f.geometry.coordinates[1]),
        lon: String(f.geometry.coordinates[0]),
      }));
    }
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=ec&format=json&limit=5`,
      { headers: { 'User-Agent': 'GoingApp/1.0' } }
    );
    return await res.json();
  } catch { return []; }
}

function generateRef() {
  return `ENV-${Date.now().toString(36).toUpperCase().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

// ── Saved Addresses (localStorage) ───────────────────────────────────────────
// Compatible con el store que usa /account → 'going_saved_addresses'.
// Cada vez que el user selecciona una dirección via geocoding la persistimos
// para auto-llenado posterior. Máximo 10 entradas (rotación LRU).
interface SavedAddress {
  label?: string;          // ej. "Casa", "Oficina" si lo nombró en /account
  display_name: string;
  lat: number;
  lon: number;
  usedAt: number;          // epoch ms — para ordenar por más reciente
}

const SAVED_ADDRESSES_KEY = 'going_saved_addresses';

function loadSavedAddresses(): SavedAddress[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_ADDRESSES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedAddress[];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function persistAddress(addr: { display_name: string; lat: number; lon: number; label?: string }) {
  if (typeof window === 'undefined') return;
  const current = loadSavedAddresses();
  // Dedup por display_name normalizado
  const norm = addr.display_name.trim().toLowerCase();
  const filtered = current.filter(a => a.display_name.trim().toLowerCase() !== norm);
  const next: SavedAddress[] = [
    { ...addr, usedAt: Date.now() },
    ...filtered,
  ].slice(0, 10);
  try { localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(next)); } catch {}
}

// ── Reverse geocoding GPS → dirección legible ────────────────────────────────
async function reverseGeocode(lat: number, lon: number): Promise<Suggestion | null> {
  try {
    if (MAPBOX_TOKEN) {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?country=ec&language=es&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const json = await res.json();
      const f = json.features?.[0];
      if (f) return { display_name: f.place_name, lat: String(lat), lon: String(lon) };
    }
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18`,
      { headers: { 'User-Agent': 'GoingApp/1.0' } },
    );
    const json = await res.json();
    if (json?.display_name) return { display_name: json.display_name, lat: String(lat), lon: String(lon) };
  } catch { /* swallow */ }
  return null;
}

// ── Location Input ────────────────────────────────────────────────────────────
function LocationInput({
  label, placeholder, value, onChange, onSelect, accent = RED, allowGps = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: Suggestion) => void;
  accent?: string;
  /** Si true, muestra botón "📍 Usar mi ubicación" (solo en origen, no destino). */
  allowGps?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [saved,       setSaved]       = useState<SavedAddress[]>([]);
  const [open,        setOpen]        = useState(false);
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const [gpsError,    setGpsError]    = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // Cargar direcciones guardadas al montar
  useEffect(() => {
    setSaved(loadSavedAddresses());
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const s = await fetchSuggestions(v);
      setSuggestions(s);
      setOpen(s.length > 0);
    }, 300);
  };

  const handleSelectAndPersist = (s: Suggestion) => {
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);
    persistAddress({ display_name: s.display_name, lat, lon });
    onSelect(s);
    setSaved(loadSavedAddresses());
    setSuggestions([]);
    setOpen(false);
  };

  const handleUseGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Tu navegador no soporta geolocalización');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const result = await reverseGeocode(latitude, longitude);
        if (result) {
          handleSelectAndPersist(result);
        } else {
          // Si reverse geocoding falla, igual usamos las coords sin label fancy
          handleSelectAndPersist({
            display_name: `Mi ubicación (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            lat: String(latitude),
            lon: String(longitude),
          });
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Permiso de ubicación denegado. Habilítalo en ajustes del navegador.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError('No pudimos detectar tu ubicación. Intenta escribirla manualmente.');
        } else {
          setGpsError('Tardó demasiado. Intenta escribir la dirección.');
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  // Muestra panel inicial con saved + GPS si el input está vacío y al foco;
  // suggestions de typing al escribir.
  const showSavedPanel = open && !value && saved.length > 0;
  const showSuggestionsPanel = open && suggestions.length > 0;

  return (
    <div className="relative">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5"
        style={{ color: accent }}>
        {label}
      </label>
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-3 border-2 border-gray-100 focus-within:border-opacity-60"
        style={{ '--tw-border-opacity': '1' } as React.CSSProperties}>
        <span className="text-gray-400"><IcoPin /></span>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none font-medium"
        />
        {value && (
          <button type="button" onClick={() => { onChange(''); setSuggestions([]); }}
            className="text-gray-300 hover:text-gray-500 text-xs font-bold">✕</button>
        )}
      </div>

      {/* Botón GPS (solo origen) — fuera del input, debajo */}
      {allowGps && (
        <div className="flex items-center gap-2 mt-1.5">
          <button
            type="button"
            onClick={handleUseGps}
            disabled={gpsLoading}
            className="text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-60"
            style={{ color: accent }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="2" x2="12" y2="4"/>
              <line x1="12" y1="20" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="4" y2="12"/>
              <line x1="20" y1="12" x2="22" y2="12"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            </svg>
            {gpsLoading ? 'Detectando…' : 'Usar mi ubicación actual'}
          </button>
          {gpsError && <span className="text-xs text-amber-700">{gpsError}</span>}
        </div>
      )}

      {/* Panel: direcciones guardadas (sin texto en input) */}
      {showSavedPanel && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide bg-gray-50 border-b">
            Direcciones recientes
          </p>
          {saved.slice(0, 6).map((a, i) => (
            <button key={i} type="button"
              onMouseDown={() => handleSelectAndPersist({ display_name: a.display_name, lat: String(a.lat), lon: String(a.lon) })}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 border-b last:border-b-0 flex items-center gap-2">
              <span className="text-gray-400 text-base">📍</span>
              <span className="flex-1 truncate">
                {a.label && <span className="font-bold text-gray-900 mr-2">{a.label}</span>}
                <span className="text-gray-600">{a.display_name}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Panel: sugerencias de typing */}
      {showSuggestionsPanel && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <button key={i} type="button"
              onMouseDown={() => handleSelectAndPersist(s)}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 border-b last:border-b-0">
              {s.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-3"
      style={{ borderLeftWidth: 4, borderLeftColor: RED }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        {icon}
        <span className="text-xs font-black tracking-widest uppercase" style={{ color: RED }}>{title}</span>
      </div>
      <div className="px-4 py-4 space-y-3">{children}</div>
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────
function FieldRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-3 border border-gray-100">
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EnviosCotizarPage() {
  const router = useRouter();
  const { auth } = useMonorepoApp();
  // Nombre real del remitente (sesión ya iniciada) en lugar de "Tú (sesión activa)".
  const senderName = ((auth.user as any)?.firstName || (auth.user as any)?.name || 'Tú') as string;

  const [view,           setView]           = useState<ScreenView>('form');
  const [pkgType,        setPkgType]        = useState<PkgId>('small');
  const [pkgDesc,        setPkgDesc]        = useState('');
  const [senderAddr,     setSenderAddr]     = useState('');
  const [senderLat,      setSenderLat]      = useState<number | null>(null);
  const [senderLon,      setSenderLon]      = useState<number | null>(null);
  const [recipientName,  setRecipientName]  = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddr,  setRecipientAddr]  = useState('');
  const [recipientLat,   setRecipientLat]   = useState<number | null>(null);
  const [recipientLon,   setRecipientLon]   = useState<number | null>(null);
  const [loading,        setLoading]        = useState(false);
  const [otpCode,        setOtpCode]        = useState('');
  const [trackingRef,    setTrackingRef]    = useState('');
  const [errors,         setErrors]         = useState<string[]>([]);
  // Esquema de pago — A/B/C/D (igual que mobile EnviosScreen).
  // 'A' por default (sender + card) es el más rápido y seguro para el sender.
  const [paymentScheme,  setPaymentScheme]  = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [quotedPrice,    setQuotedPrice]    = useState<number | null>(null);
  const [photoPreview,   setPhotoPreview]   = useState<string | null>(null);

  // Restaurar borrador al volver de login (si lo hubiera) y limpiarlo.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(ENVIO_DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.pkgType)        setPkgType(d.pkgType);
      if (d.pkgDesc)        setPkgDesc(d.pkgDesc);
      if (d.senderAddr)     setSenderAddr(d.senderAddr);
      if (d.senderLat != null) setSenderLat(d.senderLat);
      if (d.senderLon != null) setSenderLon(d.senderLon);
      if (d.recipientName)  setRecipientName(d.recipientName);
      if (d.recipientPhone) setRecipientPhone(d.recipientPhone);
      if (d.recipientAddr)  setRecipientAddr(d.recipientAddr);
      if (d.recipientLat != null) setRecipientLat(d.recipientLat);
      if (d.recipientLon != null) setRecipientLon(d.recipientLon);
      if (d.paymentScheme)  setPaymentScheme(d.paymentScheme);
    } catch { /* ignore */ }
    finally { sessionStorage.removeItem(ENVIO_DRAFT_KEY); }
  }, []);

  const selectedPkg = PACKAGE_TYPES.find(p => p.id === pkgType)!;
  // Precio mostrado: cotización autoritativa del backend si ya está disponible;
  // si no, el estimado local por tamaño (fallback antes de elegir direcciones).
  const totalPrice  = quotedPrice ?? selectedPkg.price;
  // Etiqueta de pago según el esquema elegido (NO asumir "Pagado").
  const paymentLabel = { A: 'Tarjeta', B: 'Efectivo al recoger', C: 'Paga destinatario', D: 'Contra entrega' }[paymentScheme];

  // Cotización autoritativa: cuando hay origen + destino + tamaño, pedimos el
  // precio real al backend (urbano flat / interurbano por tier). /parcels/quote
  // es público (no requiere login). Es lo que se cobrará al crear el envío.
  useEffect(() => {
    if (senderLat == null || senderLon == null || recipientLat == null || recipientLon == null) {
      setQuotedPrice(null);
      return;
    }
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';
    const size = pkgType; // ya es 'small' | 'medium' | 'large'
    let cancelled = false;
    fetch(`${API}/parcels/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: { lat: senderLat, lng: senderLon },
        destination: { lat: recipientLat, lng: recipientLon },
        packageSize: size,
      }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled) setQuotedPrice(d && typeof d.price === 'number' ? d.price : null); })
      .catch(() => { if (!cancelled) setQuotedPrice(null); });
    return () => { cancelled = true; };
  }, [senderLat, senderLon, recipientLat, recipientLon, pkgType]);

  const validate = () => {
    const errs: string[] = [];
    if (!senderAddr)     errs.push('Dirección de recogida requerida');
    if (!recipientName)  errs.push('Nombre del destinatario requerido');
    if (!recipientPhone) errs.push('Teléfono del destinatario requerido');
    if (!recipientAddr)  errs.push('Dirección de entrega requerida');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSolicitar = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Auth requerido para crear parcels — sin token no funciona.
      // Si no hay token, redirigimos a login con returnUrl.
      const { getStoredToken, redirectToLogin } = await import('@/lib/providers/auth-client');
      const token = getStoredToken();
      if (!token) {
        // Guardar borrador para restaurarlo al volver del login (no perder datos).
        try {
          sessionStorage.setItem(ENVIO_DRAFT_KEY, JSON.stringify({
            pkgType, pkgDesc, senderAddr, senderLat, senderLon,
            recipientName, recipientPhone, recipientAddr, recipientLat, recipientLon,
            paymentScheme,
          }));
        } catch { /* ignore */ }
        redirectToLogin('/envios/cotizar');
        return;
      }

      // Mapeo del esquema A/B/C/D a fields del backend
      const apiPayment = {
        A: { paymentMethod: 'card' as const, payerRole: 'sender' as const },
        B: { paymentMethod: 'cash' as const, payerRole: 'sender' as const },
        C: { paymentMethod: 'card' as const, payerRole: 'recipient' as const },
        D: { paymentMethod: 'cash' as const, payerRole: 'recipient' as const },
      }[paymentScheme];

      const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';
      // FIX: el endpoint correcto es /parcels (no /envios/parcels que no existe).
      const res = await fetch(`${API}/parcels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          origin:      { address: senderAddr,    latitude: senderLat,    longitude: senderLon },
          destination: { address: recipientAddr, latitude: recipientLat, longitude: recipientLon },
          description: pkgDesc || `Envío ${selectedPkg.label}`,
          recipientName,
          recipientPhone,
          price: { amount: totalPrice, currency: 'USD' as const },
          packageSize: pkgType,
          paymentMethod: apiPayment.paymentMethod,
          payerRole:     apiPayment.payerRole,
        }),
      });

      // FIX: NO enmascarar errors con tracking codes falsos.
      // Si la API rechaza, mostrar al usuario el error real.
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg = errBody?.message || `Error ${res.status} al crear el envío`;
        setErrors([msg]);
        return;
      }

      const data = await res.json();
      setTrackingRef(data?.trackingCode ?? data?.id ?? '');
      setOtpCode(data?.otpPin ?? '');

      // Caso A: backend devuelve paymentUrl. Abrimos en nueva tab para pagar.
      if (data?.paymentUrl) {
        window.open(data.paymentUrl, '_blank', 'noopener');
      }

      setView('tracking');
    } catch (err: any) {
      setErrors([err?.message || 'No se pudo conectar con el servidor.']);
    } finally {
      setLoading(false);
    }
  };

  // ── TRACKING VIEW ──────────────────────────────────────────────────────────
  if (view === 'tracking') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b-4 sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{ borderBottomColor: RED }}>
          <button onClick={() => setView('form')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: '#FFF0EF', color: RED }}>
            ←
          </button>
          <span className="font-black text-gray-900">Seguimiento del envío</span>
          <span className="ml-auto text-xs text-gray-400 font-mono">#{trackingRef}</span>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
          {/* Status banner */}
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5 border"
            style={{ backgroundColor: '#FFF0EF', borderColor: '#FECACA' }}>
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: RED }} />
            <div className="flex-1">
              <p className="text-sm font-black" style={{ color: RED }}>Conductor recogiendo el paquete</p>
              <p className="text-xs text-amber-700 mt-0.5">Estimado: ~15 minutos</p>
            </div>
            <span className="text-gray-400 text-xs">›</span>
          </div>

          {/* Remitente / Destinatario */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            style={{ borderLeftWidth: 4, borderLeftColor: RED }}>
            {/* Remitente */}
            <div className="flex items-start gap-3 p-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFF0EF' }}>
                <IcoUp />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Remitente</p>
                <p className="text-sm font-black text-gray-900">Remitente</p>
                <p className="text-xs text-gray-500 truncate">{senderAddr}</p>
              </div>
            </div>
            <div className="h-px bg-gray-50 mx-4" />
            {/* Destinatario */}
            <div className="flex items-start gap-3 p-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F0FDF4' }}>
                <IcoDown />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Destinatario</p>
                <p className="text-sm font-black text-gray-900">{recipientName}</p>
                <p className="text-xs text-gray-500 truncate">{recipientAddr}</p>
                <p className="text-xs font-bold" style={{ color: RED }}>{recipientPhone}</p>
              </div>
              {/* OTP Box */}
              <div className="flex-shrink-0 rounded-xl px-3 py-2 border text-center"
                style={{ backgroundColor: '#FFF0EF', borderColor: '#FECACA' }}>
                <p className="text-xs font-black" style={{ color: RED }}>CÓDIGO OTP</p>
                <p className="text-2xl font-black" style={{ color: RED }}>{otpCode}</p>
              </div>
            </div>
          </div>

          {/* Ruta */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            style={{ borderLeftWidth: 4, borderLeftColor: RED }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
              <IcoPin />
              <span className="text-xs font-black tracking-widest uppercase" style={{ color: RED }}>Ruta del envío</span>
            </div>
            <div className="px-4 py-4 space-y-2">
              <div className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: RED }} />
                <div>
                  <p className="text-sm font-bold text-gray-900 truncate">{senderAddr || 'Origen'}</p>
                  <p className="text-xs text-gray-500">Recogida · Ahora</p>
                </div>
              </div>
              <div className="w-px h-4 ml-1" style={{ backgroundColor: '#FEE2E2' }} />
              <div className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: GREEN }} />
                <div>
                  <p className="text-sm font-bold text-gray-900 truncate">{recipientAddr || 'Destino'}</p>
                  <p className="text-xs text-gray-500">Entrega estimada · ~2h 30min</p>
                </div>
              </div>
            </div>
          </div>

          {/* Paquete */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            style={{ borderLeftWidth: 4, borderLeftColor: RED }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
              <IcoCube />
              <span className="text-xs font-black tracking-widest uppercase" style={{ color: RED }}>
                Paquete · {selectedPkg.label.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 text-gray-700">
                <IconPackage size={22} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{selectedPkg.label} · {selectedPkg.desc}</p>
                <p className="text-xs text-gray-500">${totalPrice.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-1 rounded-full px-3 py-1 border border-gray-200" style={{ backgroundColor: '#F9FAFB' }}>
                <span className="text-xs font-bold text-gray-600">{paymentLabel}</span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => { if (recipientPhone) window.location.href = `tel:${recipientPhone}`; }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 border font-bold text-sm"
              style={{ backgroundColor: '#FFF0EF', borderColor: '#FECACA', color: RED }}>
              <IcoPhone /> Llamar
            </button>
            <button
              type="button"
              onClick={async () => {
                const text = `Seguimiento de mi envío Going App: #${trackingRef}`;
                try {
                  if (typeof navigator !== 'undefined' && navigator.share) {
                    await navigator.share({ title: 'Envío Going App', text });
                  } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    await navigator.clipboard.writeText(text);
                  }
                } catch { /* usuario canceló */ }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 border font-bold text-sm border-gray-200 text-gray-700 bg-gray-50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Compartir
            </button>
            <button onClick={() => setView('delivered')}
              className="flex-2 flex items-center justify-center gap-1.5 rounded-xl py-3 px-4 font-bold text-sm text-white shadow-md"
              style={{ backgroundColor: RED, flex: 2 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Confirmar entrega
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DELIVERED VIEW ─────────────────────────────────────────────────────────
  if (view === 'delivered') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b-4 sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{ borderBottomColor: RED }}>
          <button onClick={() => router.push('/envios')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: '#FFF0EF', color: RED }}>
            ←
          </button>
          <span className="font-black text-gray-900">Entrega confirmada</span>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          {/* Success */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center"
            style={{ borderLeftWidth: 4, borderLeftColor: GREEN }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#ECFDF5' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill={GREEN} stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/><polyline fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="text-2xl font-black text-gray-900 mb-1">¡Paquete entregado!</p>
            <p className="text-sm text-gray-500">Entregado a <strong>{recipientName}</strong> · Confirmado con código OTP</p>
          </div>

          {/* Resumen */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            style={{ borderLeftWidth: 4, borderLeftColor: RED }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <span className="text-xs font-black tracking-widest uppercase" style={{ color: RED }}>Resumen</span>
            </div>
            <div className="px-4 py-2 divide-y divide-gray-50">
              {[
                { label: 'Estado',        value: '✓ Entregado',             color: GREEN },
                { label: 'Destinatario',  value: recipientName,              color: undefined },
                { label: 'Referencia',    value: trackingRef,                color: undefined },
                { label: 'Hora',          value: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }), color: undefined },
                { label: 'OTP',           value: '✓ Verificado',             color: GREEN },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className="text-sm font-bold" style={{ color: row.color ?? '#111827' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => { setView('form'); setPkgDesc(''); setSenderAddr(''); setRecipientName(''); setRecipientPhone(''); setRecipientAddr(''); }}
            className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 shadow-md"
            style={{ backgroundColor: RED }}>
            Nuevo envío <IcoArrow />
          </button>
        </div>
      </div>
    );
  }

  // ── FORM VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header */}
      <div className="bg-white border-b-4 sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{ borderBottomColor: RED }}>
        <Link href="/envios"
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: '#FFF0EF', color: RED }}>
          ←
        </Link>
        <span className="font-black text-gray-900 flex-1">Envíos Going App</span>
        <span className="flex items-center gap-1 rounded-full px-2.5 py-1 border text-xs font-black"
          style={{ backgroundColor: '#FFF0EF', borderColor: '#FECACA', color: RED }}>
          <IcoCube /> ENVÍOS
        </span>
      </div>
      <p className="text-xs text-gray-400 text-center py-1.5 bg-white border-b border-gray-50">
        De punto a punto · Rastreo en tiempo real · Registro de entrega
      </p>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-0">

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
            {errors.map(e => <p key={e} className="text-sm text-red-600 font-medium">· {e}</p>)}
          </div>
        )}

        {/* QUIÉN ENVÍA */}
        <SectionCard icon={<IcoUp />} title="Quién envía">
          <FieldRow icon={<IcoPerson />}>
            <span className="text-sm font-semibold text-gray-700">{senderName}</span>
            <span className="text-xs text-gray-400 ml-1">(tú)</span>
          </FieldRow>
          <LocationInput
            label="Dirección de recogida"
            placeholder="Ej: Quito, La Y, Amazonas 2406..."
            value={senderAddr}
            onChange={setSenderAddr}
            onSelect={s => { setSenderAddr(s.display_name); setSenderLat(parseFloat(s.lat)); setSenderLon(parseFloat(s.lon)); }}
            accent={RED}
            allowGps  // ← botón "Usar mi ubicación" en origen
          />
        </SectionCard>

        {/* QUIÉN RECIBE */}
        <SectionCard icon={<IcoDown />} title="Quién recibe">
          <FieldRow icon={<IcoPerson />}>
            <input
              type="text"
              placeholder="Nombre del destinatario"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none font-medium"
            />
          </FieldRow>
          <FieldRow icon={<IcoPhone />}>
            <input
              type="tel"
              placeholder="Teléfono del destinatario"
              value={recipientPhone}
              onChange={e => setRecipientPhone(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none font-medium"
            />
          </FieldRow>
          <LocationInput
            label="Dirección de entrega"
            placeholder="Ej: Guayaquil, Urdesa..."
            value={recipientAddr}
            onChange={setRecipientAddr}
            onSelect={s => { setRecipientAddr(s.display_name); setRecipientLat(parseFloat(s.lat)); setRecipientLon(parseFloat(s.lon)); }}
            accent={BLUE}
          />
          {/* OTP note */}
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 border"
            style={{ backgroundColor: '#FFF0EF', borderColor: '#FECACA' }}>
            <IcoLock />
            <p className="text-xs font-semibold" style={{ color: RED }}>
              El destinatario confirmará con código OTP al recibir
            </p>
          </div>
        </SectionCard>

        {/* EL PAQUETE */}
        <SectionCard icon={<IcoCube />} title="El paquete">
          {/* Tipo — 3 categorías por peso (oficial Going App) */}
          <div className="grid grid-cols-3 gap-2">
            {PACKAGE_TYPES.map(p => {
              const active = pkgType === p.id;
              // Visual size hint: SVG escalado según el tier. Refuerza el
              // tamaño relativo sin emojis. small=18px, medium=24px, large=30px.
              const iconSize = p.id === 'small' ? 22 : p.id === 'medium' ? 28 : 34;
              // Mismo icon (IconPackage) o diferenciar:
              //   small/medium → IconPackage
              //   large → IconMailbox (más grande/buzón)
              const Icon = p.id === 'large' ? IconMailbox : IconPackage;
              return (
                <button key={p.id} type="button"
                  onClick={() => setPkgType(p.id)}
                  className="rounded-xl p-3 text-center border-2 transition-all flex flex-col items-center"
                  style={{
                    borderColor:      active ? RED : '#F3F4F6',
                    backgroundColor:  active ? '#FFF0EF' : '#F9FAFB',
                    color:            active ? RED : '#374151',
                  }}>
                  <Icon size={iconSize} />
                  <p className="text-xs font-black mt-1" style={{ color: active ? RED : '#374151' }}>{p.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
                  <p className="text-sm font-black mt-1" style={{ color: active ? RED : '#374151' }}>${p.price}</p>
                </button>
              );
            })}
          </div>

          {/* Descripción */}
          <textarea
            placeholder="Descripción del contenido (ej: documentos, ropa, electrónicos...)"
            value={pkgDesc}
            onChange={e => setPkgDesc(e.target.value)}
            maxLength={120}
            rows={2}
            className="w-full bg-gray-50 rounded-xl px-3 py-3 border border-gray-100 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none focus:border-red-200"
          />

          {/* Foto opcional — funcional: previsualización local del paquete */}
          <label className="flex items-center gap-3 rounded-xl px-3 py-3 border-2 border-dashed cursor-pointer hover:bg-red-50 transition-colors"
            style={{ borderColor: '#FECACA' }}>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setPhotoPreview(typeof reader.result === 'string' ? reader.result : null);
                reader.readAsDataURL(file);
              }}
            />
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Foto del paquete" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            )}
            <div className="flex-1">
              <p className="text-xs font-bold" style={{ color: RED }}>
                {photoPreview ? 'Foto añadida · toca para cambiar' : 'Foto del paquete'}
              </p>
              <p className="text-xs text-gray-400">Opcional · recomendado para reclamaciones</p>
            </div>
          </label>
        </SectionCard>

        {/* CÓMO SE PAGA — 4 escenarios (mismo que mobile) */}
        <SectionCard
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
          title="CÓMO SE PAGA"
        >
          {([
            { id: 'A' as const, label: 'Pago ahora con tarjeta',                Icon: IconCard,   sub: 'Datafast/DeUna · El más rápido' },
            { id: 'B' as const, label: 'Pago en efectivo al recoger',           Icon: IconMoney,  sub: 'Le pagas al conductor cuando llegue' },
            { id: 'C' as const, label: 'Que pague el destinatario (tarjeta)',   Icon: IconMobile, sub: 'Recibe link de pago por SMS' },
            { id: 'D' as const, label: 'Contra entrega (efectivo del destinatario)', Icon: IconUsers, sub: 'Cobra al recibir' },
          ]).map((scheme) => {
            const active = paymentScheme === scheme.id;
            const Icon = scheme.Icon;
            return (
              <button
                key={scheme.id}
                type="button"
                onClick={() => setPaymentScheme(scheme.id)}
                className="flex items-center gap-3 w-full rounded-xl px-3 py-3 border-2 transition-all text-left"
                style={{
                  borderColor:     active ? RED : '#F3F4F6',
                  backgroundColor: active ? '#FFF0EF' : '#F9FAFB',
                }}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: active ? RED : '#D1D5DB' }}
                >
                  {active && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RED }} />}
                </div>
                <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: active ? '#FFE5E2' : '#F3F4F6', color: active ? RED : '#6B7280' }}>
                  <Icon size={22} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: active ? RED : '#111827' }}>
                    {scheme.label}
                  </p>
                  <p className="text-xs text-gray-500">{scheme.sub}</p>
                </div>
              </button>
            );
          })}
        </SectionCard>

      </div>

      {/* ── FOOTER FIJO ────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 px-4 py-4 z-20 shadow-xl"
        style={{ borderTopColor: '#FEE2E2' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div>
            <p className="text-xs text-gray-400 font-semibold">Estimado</p>
            <p className="text-2xl font-black text-gray-900">${totalPrice.toFixed(2)}</p>
          </div>
          <button
            onClick={handleSolicitar}
            disabled={loading}
            className="flex-1 flex items-center justify-between rounded-2xl py-4 px-5 font-black text-white text-base shadow-lg transition-all active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: RED }}>
            {loading ? (
              <span className="flex items-center gap-2 mx-auto">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Procesando…
              </span>
            ) : (
              <>
                <span>Solicitar envío</span>
                <IcoArrow />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
