'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch, getStoredToken, parseJwtPayload } from '@/lib/providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';

interface Profile {
  id:         string;
  firstName:  string;
  lastName?:  string;
  email?:     string;
  phone?:     string;
  vehiclePlate?: string;
  vehicleModel?: string;
  rating?:    number;
  createdAt?: string;
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [form, setForm]       = useState({ firstName: '', lastName: '', phone: '' });

  useEffect(() => {
    if (profile) setForm({ firstName: profile.firstName || '', lastName: profile.lastName || '', phone: profile.phone || '' });
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await authFetch(`${API_URL}/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(String(res.status));
      setProfile(p => (p ? { ...p, ...form } : p));
      setMsg({ type: 'ok', text: 'Datos actualizados.' });
      setEditing(false);
    } catch {
      setMsg({ type: 'err', text: 'No se pudo guardar. Intenta más tarde.' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // /auth/me devuelve los datos del usuario autenticado.
    // Si por algún motivo falla, fallback al payload del JWT local.
    authFetch(`${API_URL}/auth/me`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setProfile({
            id:           d.id ?? d._id ?? d.sub ?? '',
            firstName:    d.firstName ?? '',
            lastName:     d.lastName,
            email:        d.email,
            phone:        d.phone,
            vehiclePlate: d.vehiclePlate,
            vehicleModel: d.vehicleModel,
            rating:       d.rating,
            createdAt:    d.createdAt,
          });
        } else {
          const token = getStoredToken();
          if (token) {
            const p = parseJwtPayload<any>(token);
            if (p) setProfile({
              id:           p.sub ?? p.userId ?? '',
              firstName:    p.firstName ?? p.name?.split(' ')[0] ?? 'Conductor',
              lastName:     p.lastName,
              email:        p.email,
              phone:        p.phone,
              vehiclePlate: p.vehiclePlate,
              vehicleModel: p.vehicleModel,
              rating:       p.rating,
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <p className="text-gray-700">No pudimos cargar tu perfil.</p>
      </div>
    );
  }

  const initials = `${profile.firstName[0] ?? 'C'}${profile.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Mi perfil</h1>
        <p className="text-gray-400 text-sm mt-0.5">Información personal y de tu vehículo.</p>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0033A0, #ff4c41)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-black text-gray-900 truncate">
              {profile.firstName} {profile.lastName ?? ''}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span className="text-yellow-500">⭐</span>
              <span className="font-bold">{profile.rating?.toFixed(1) ?? '—'}</span>
              <span className="text-xs bg-blue-100 text-[#0033A0] px-2 py-0.5 rounded-full font-bold">
                Conductor
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Datos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Datos personales</p>
            {!editing && (
              <button onClick={() => { setEditing(true); setMsg(null); }}
                className="text-xs font-bold text-[#0033A0] hover:underline">Editar</button>
            )}
          </div>

          {msg && (
            <div className={`text-xs rounded-lg px-3 py-2 mb-3 ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {msg.text}
            </div>
          )}

          {editing ? (
            <div className="space-y-3">
              <EditField label="Nombre"   value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} />
              <EditField label="Apellido" value={form.lastName}  onChange={v => setForm(f => ({ ...f, lastName: v }))} />
              <EditField label="Teléfono" value={form.phone}     onChange={v => setForm(f => ({ ...f, phone: v }))} type="tel" />
              <Field label="Email" value={profile.email ?? '—'} />
              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-60" style={{ backgroundColor: '#0033A0' }}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
                <button onClick={() => { setEditing(false); setMsg(null); setForm({ firstName: profile.firstName || '', lastName: profile.lastName || '', phone: profile.phone || '' }); }}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <Field label="Nombre"    value={`${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}`} />
              <Field label="Email"     value={profile.email ?? '—'} />
              <Field label="Teléfono"  value={profile.phone ?? '—'} />
              <Field label="Miembro desde" value={profile.createdAt
                ? new Date(profile.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—'} />
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Vehículo</p>
          <Field label="Modelo" value={profile.vehicleModel ?? '—'} />
          <Field label="Placa"  value={profile.vehiclePlate
            ? <span className="font-mono font-bold tracking-widest">{profile.vehiclePlate}</span>
            : '—'} />
          <Link href="/dashboard/conductor/documentos"
            className="inline-block mt-2 text-xs font-bold text-[#0033A0] hover:underline">
            Ver documentos del vehículo →
          </Link>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-800">
        💡 Puedes editar tus datos personales aquí. Para cambiar tu vehículo o documentos,
        hazlo desde la app móvil de Going App Conductor — esos cambios pasan por revisión del equipo.
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-800 font-medium text-right">{value}</span>
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-semibold mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0033A0]" />
    </div>
  );
}
