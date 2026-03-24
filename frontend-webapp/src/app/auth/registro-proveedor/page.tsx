'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { submitProviderApplication, hasExistingApplication } from '@/services/firestore/applications';
import type { ProviderApplication, ProviderRole } from '@/services/firestore/applications';

const ROLES: { key: ProviderRole; icon: string; label: string; color: string }[] = [
  { key: 'conductor',  icon: '🚗', label: 'Conductor',        color: '#16a34a' },
  { key: 'anfitrion',  icon: '🏡', label: 'Anfitrión',        color: '#7c3aed' },
  { key: 'promotor',   icon: '🏺', label: 'Promotor Local',   color: '#0891b2' },
  { key: 'operador',   icon: '🧗', label: 'Operador',          color: '#d97706' },
];

const ECUADOR_CITIES = [
  'Quito','Guayaquil','Cuenca','Ambato','Loja','Riobamba','Machala','Ibarra',
  'Portoviejo','Manta','Esmeraldas','Santo Domingo','Babahoyo','Latacunga',
  'Tulcán','Azogues','Guaranda','Tena','Puyo','Coca','Lago Agrio','Macas',
  'Zamora','Santa Elena','La Libertad','Salinas',
];

function RegistroProveedorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get('role') as ProviderRole) || 'conductor';

  const [step, setStep]       = useState<1 | 2 | 3>(1);
  const [role, setRole]       = useState<ProviderRole>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  // Formulario
  const [form, setForm] = useState<Partial<ProviderApplication>>({
    role: initialRole,
    yearsExperience: 1,
    tourTypes: [],
    activityTypes: [],
  });

  const set = (key: keyof ProviderApplication, val: unknown) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleRoleSelect = (r: ProviderRole) => {
    setRole(r);
    set('role', r);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const already = await hasExistingApplication(form.email!, role);
      if (already) {
        setError('Ya tienes una solicitud activa para este rol. Te contactaremos pronto.');
        return;
      }
      await submitProviderApplication({ ...form, role } as ProviderApplication);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Error al enviar. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const currentRole = ROLES.find(r => r.key === role)!;

  /* ── ÉXITO ── */
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">¡Solicitud enviada!</h2>
          <p className="text-gray-500 mb-6">
            Revisaremos tu aplicación como <strong>{currentRole.label}</strong> y te contactaremos
            en los próximos días al correo <strong>{form.email}</strong>.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3.5 rounded-2xl font-bold text-white"
            style={{ backgroundColor: '#ff4c41' }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => step > 1 ? setStep(s => (s - 1) as 1|2|3) : router.back()}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
          ←
        </button>
        <Image src="/going-logo-h.png" alt="Going" width={100} height={34} className="h-8 w-auto object-contain" />
        <div className="ml-auto flex gap-2">
          {[1,2,3].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? 'w-8' : 'w-4'}`}
              style={{ backgroundColor: s <= step ? '#ff4c41' : '#e5e7eb' }} />
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── PASO 1: Elegir rol ── */}
        {step === 1 && (
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Únete como proveedor</h1>
            <p className="text-gray-500 mb-8">¿Con qué quieres ganar dinero en Going?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ROLES.map(r => (
                <button
                  key={r.key}
                  onClick={() => handleRoleSelect(r.key)}
                  className="p-6 bg-white rounded-3xl border-2 border-gray-100 hover:border-gray-300 shadow-sm text-left transition-all hover:shadow-md active:scale-[0.98] group"
                >
                  <div className="text-4xl mb-3">{r.icon}</div>
                  <div className="font-black text-gray-900 text-lg">{r.label}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {r.key === 'conductor'  && 'Transporta pasajeros entre ciudades'}
                    {r.key === 'anfitrion'  && 'Publica tu espacio para huéspedes'}
                    {r.key === 'promotor'   && 'Ofrece tours y experiencias locales'}
                    {r.key === 'operador'   && 'Ofrece aventuras y actividades'}
                  </div>
                  <div className="mt-4 text-xs font-bold px-3 py-1 rounded-full inline-block text-white"
                    style={{ backgroundColor: r.color }}>
                    Aplicar →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── PASO 2: Datos personales ── */}
        {step === 2 && (
          <form onSubmit={e => { e.preventDefault(); setStep(3); }}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{currentRole.icon}</span>
              <div>
                <h1 className="text-2xl font-black text-gray-900">Datos personales</h1>
                <p className="text-sm text-gray-400">Como {currentRole.label}</p>
              </div>
            </div>

            {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">{error}</div>}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nombres</label>
                  <input required value={form.firstName || ''} onChange={e => set('firstName', e.target.value)}
                    placeholder="Tu nombre" className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 text-sm bg-gray-50 focus:bg-white transition" style={{'--tw-ring-color': '#ff4c41'} as React.CSSProperties} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Apellidos</label>
                  <input required value={form.lastName || ''} onChange={e => set('lastName', e.target.value)}
                    placeholder="Tu apellido" className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 text-sm bg-gray-50 focus:bg-white transition" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Correo electrónico</label>
                <input required type="email" value={form.email || ''} onChange={e => set('email', e.target.value)}
                  placeholder="tu@correo.com" className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 text-sm bg-gray-50 focus:bg-white transition" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Teléfono / WhatsApp</label>
                <input required type="tel" value={form.phone || ''} onChange={e => set('phone', e.target.value)}
                  placeholder="+593 99 999 9999" className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 text-sm bg-gray-50 focus:bg-white transition" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ciudad</label>
                <select required value={form.city || ''} onChange={e => set('city', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 text-sm bg-gray-50 focus:bg-white transition">
                  <option value="">Selecciona tu ciudad…</option>
                  {ECUADOR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <button type="submit"
              className="mt-8 w-full py-4 rounded-2xl font-black text-white text-base shadow-lg active:scale-[0.98] transition"
              style={{ backgroundColor: '#ff4c41' }}>
              Continuar →
            </button>
          </form>
        )}

        {/* ── PASO 3: Datos específicos del rol ── */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{currentRole.icon}</span>
              <div>
                <h1 className="text-2xl font-black text-gray-900">Tu actividad</h1>
                <p className="text-sm text-gray-400">Cuéntanos sobre tu servicio</p>
              </div>
            </div>

            {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">{error}</div>}

            <div className="space-y-4">

              {/* CONDUCTOR */}
              {role === 'conductor' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipo de vehículo</label>
                    <select required value={form.vehicleType || ''} onChange={e => set('vehicleType', e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 text-sm bg-gray-50 focus:bg-white transition">
                      <option value="">Selecciona…</option>
                      {['Sedán','SUV','Camioneta','Van / Minibus','Bus'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Placa del vehículo</label>
                    <input required value={form.licensePlate || ''} onChange={e => set('licensePlate', e.target.value.toUpperCase())}
                      placeholder="ABC-1234" maxLength={8}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 text-sm bg-gray-50 focus:bg-white transition font-mono" />
                  </div>
                </>
              )}

              {/* ANFITRIÓN */}
              {role === 'anfitrion' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipo de espacio</label>
                    <select required value={form.propertyType || ''} onChange={e => set('propertyType', e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 text-sm bg-gray-50 focus:bg-white transition">
                      <option value="">Selecciona…</option>
                      {['Casa completa','Apartamento','Habitación privada','Cabaña','Hacienda','Lodge'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Dirección del espacio</label>
                    <input required value={form.propertyAddress || ''} onChange={e => set('propertyAddress', e.target.value)}
                      placeholder="Ej: Calle 10 y Av. 6 de Diciembre, Quito"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 text-sm bg-gray-50 focus:bg-white transition" />
                  </div>
                </>
              )}

              {/* PROMOTOR */}
              {role === 'promotor' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipos de tours que ofreces</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Gastronómico','Cultural','Naturaleza','Aventura','Fotografía','Historia','Artesanías','Nocturno'].map(t => {
                      const selected = (form.tourTypes || []).includes(t);
                      return (
                        <button key={t} type="button"
                          onClick={() => {
                            const cur = form.tourTypes || [];
                            set('tourTypes', selected ? cur.filter(x => x !== t) : [...cur, t]);
                          }}
                          className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition text-left ${selected ? 'border-[#0891b2] bg-cyan-50 text-[#0891b2]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* OPERADOR */}
              {role === 'operador' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipos de actividades que ofreces</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Senderismo','Escalada','Rafting','Ciclismo','Parapente','Kayak','Buceo','Canopy','Trekking','Camping'].map(t => {
                      const selected = (form.activityTypes || []).includes(t);
                      return (
                        <button key={t} type="button"
                          onClick={() => {
                            const cur = form.activityTypes || [];
                            set('activityTypes', selected ? cur.filter(x => x !== t) : [...cur, t]);
                          }}
                          className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition text-left ${selected ? 'border-[#d97706] bg-amber-50 text-[#d97706]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Años de experiencia — todos */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Años de experiencia</label>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => set('yearsExperience', Math.max(0, (form.yearsExperience || 1) - 1))}
                    className="w-11 h-11 rounded-2xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 text-xl flex items-center justify-center transition active:scale-95">−</button>
                  <span className="text-4xl font-black" style={{ color: currentRole.color }}>{form.yearsExperience ?? 1}</span>
                  <button type="button" onClick={() => set('yearsExperience', (form.yearsExperience || 1) + 1)}
                    className="w-11 h-11 rounded-2xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 text-xl flex items-center justify-center transition active:scale-95">+</button>
                  <span className="text-sm text-gray-400">años</span>
                </div>
              </div>

              {/* Sobre ti */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Cuéntanos sobre ti <span className="font-normal text-gray-400">(opcional)</span></label>
                <textarea value={form.about || ''} onChange={e => set('about', e.target.value)}
                  rows={3} placeholder="¿Por qué quieres ser proveedor Going? ¿Qué te hace especial?"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 text-sm bg-gray-50 focus:bg-white transition resize-none" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="mt-8 w-full py-4 rounded-2xl font-black text-white text-base shadow-lg active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ff4c41' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando solicitud…
                </span>
              ) : 'Enviar solicitud'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function RegistroProveedorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <RegistroProveedorForm />
    </Suspense>
  );
}
