'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com/api';

const PROPERTY_TYPES = [
  { value: 'casa', label: 'Casa completa', icon: '🏠', desc: 'Toda la propiedad para el huésped' },
  { value: 'apartamento', label: 'Apartamento', icon: '🏢', desc: 'Departamento independiente' },
  { value: 'habitacion', label: 'Habitación privada', icon: '🛏️', desc: 'Habitación con acceso compartido' },
  { value: 'cabana', label: 'Cabaña / Chalet', icon: '🏕️', desc: 'Espacio rústico o de naturaleza' },
  { value: 'finca', label: 'Finca / Hacienda', icon: '🌿', desc: 'Propiedad rural o agrícola' },
  { value: 'hostal', label: 'Hostal / Lodge', icon: '🏨', desc: 'Establecimiento con múltiples habitaciones' },
];

const AMENITIES = [
  { key: 'wifi', label: 'WiFi' },
  { key: 'parking', label: 'Parqueadero' },
  { key: 'ac', label: 'Aire / Calefacción' },
  { key: 'kitchen', label: 'Cocina' },
  { key: 'pool', label: 'Piscina' },
  { key: 'breakfast', label: 'Desayuno incluido' },
  { key: 'pets', label: 'Acepta mascotas' },
  { key: 'accessible', label: 'Accesible' },
];

type DocKey = 'cedula' | 'titulo_propiedad' | 'permiso_funcionamiento' | 'foto_exterior' | 'foto_habitacion' | 'foto_bano';

const REQUIRED_DOCS: { key: DocKey; label: string; desc: string; icon: string; required: boolean }[] = [
  { key: 'cedula', label: 'Cédula de Identidad', desc: 'Ambos lados. Confirma tu identidad como anfitrión.', icon: '🪪', required: true },
  { key: 'titulo_propiedad', label: 'Título de propiedad o contrato de arrendamiento', desc: 'Demuestra que tienes derecho a hospedar en el espacio.', icon: '📄', required: true },
  { key: 'permiso_funcionamiento', label: 'Permiso de Funcionamiento (Ministerio de Turismo)', desc: 'Requerido para establecimientos comerciales. Casas privadas pueden presentarlo después.', icon: '📋', required: false },
  { key: 'foto_exterior', label: 'Foto exterior del espacio', desc: 'Fachada, jardín o área de ingreso. Buena iluminación natural.', icon: '📸', required: true },
  { key: 'foto_habitacion', label: 'Foto de la habitación o espacio principal', desc: 'Interior limpio, ordenado, con luz natural si es posible.', icon: '🛏️', required: true },
  { key: 'foto_bano', label: 'Foto del baño', desc: 'Limpio y bien iluminado.', icon: '🚿', required: true },
];

interface DocStatus { file: File | null; error: string }

export default function AnfitrionesRegistroPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [property, setProperty] = useState({
    type: '',
    address: '',
    city: '',
    guests: '',
    bedrooms: '',
    beds: '',
    bathrooms: '',
    description: '',
    pricePerNight: '',
  });
  const [amenities, setAmenities] = useState<Set<string>>(new Set());
  const [docs, setDocs] = useState<Record<DocKey, DocStatus>>(() =>
    Object.fromEntries(REQUIRED_DOCS.map(d => [d.key, { file: null, error: '' }])) as Record<DocKey, DocStatus>
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const toggleAmenity = (key: string) => {
    const next = new Set(amenities);
    next.has(key) ? next.delete(key) : next.add(key);
    setAmenities(next);
  };

  const handleFileChange = (key: DocKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 10 * 1024 * 1024) {
      setDocs(prev => ({ ...prev, [key]: { file: null, error: 'El archivo supera 10 MB' } }));
      return;
    }
    setDocs(prev => ({ ...prev, [key]: { file, error: '' } }));
  };

  const step1Valid = property.type && property.address && property.city && property.guests && property.beds && property.bathrooms;
  const step2Valid = REQUIRED_DOCS.filter(d => d.required).every(d => docs[d.key].file !== null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setGlobalError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const formData = new FormData();
      Object.entries(property).forEach(([k, v]) => formData.append(k, v));
      formData.append('amenities', JSON.stringify([...amenities]));
      REQUIRED_DOCS.forEach(d => { if (docs[d.key].file) formData.append(d.key, docs[d.key].file as File); });
      const res = await fetch(`${API_BASE}/hosts/onboarding`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Error al enviar');
      setSubmitted(true);
    } catch {
      setGlobalError('Hubo un error al enviar tu solicitud. Intenta de nuevo o escríbenos a anfitriones@goingec.com');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-6" style={{ backgroundColor: '#f5f3ff' }}>🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">¡Solicitud enviada!</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Nuestro equipo revisará tu espacio en <strong>2–3 días hábiles</strong>. Te avisaremos cuando esté activo y listo para recibir huéspedes.
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 text-left space-y-3">
            {[
              { icon: '📧', text: 'Recibirás confirmación por correo' },
              { icon: '🔍', text: 'Verificamos fotos y documentos' },
              { icon: '✅', text: 'Activamos tu listing en Going' },
              { icon: '📚', text: 'Completa la Academia para anfitriones' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 text-sm text-gray-700">
                <span className="text-lg">{item.icon}</span><span>{item.text}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/academy" className="block w-full py-3 rounded-xl font-bold text-white text-center hover:opacity-90 transition-opacity" style={{ backgroundColor: '#7c3aed' }}>
              📚 Academia para Anfitriones
            </Link>
            <Link href="/" className="block w-full py-3 rounded-xl font-bold text-gray-700 text-center bg-white border border-gray-200 hover:bg-gray-50">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-white py-10 px-6" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 70%, #7c3aed20 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <Link href="/auth/register" className="text-purple-300 text-sm hover:text-white mb-4 inline-block">← Volver al registro</Link>
          <h1 className="text-3xl font-bold mb-2">Activar tu perfil de Anfitrión</h1>
          <p className="text-purple-200 text-sm">Publica tu espacio y empieza a recibir huéspedes de todo el mundo.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[{ n: 1, label: 'Tu espacio' }, { n: 2, label: 'Documentos' }, { n: 3, label: 'Confirmar' }].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: step >= s.n ? '#7c3aed' : '#e5e7eb', color: step >= s.n ? 'white' : '#9ca3af' }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${step >= s.n ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 mx-1 ${step > s.n ? 'bg-[#7c3aed]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">🏠 Tu espacio</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de alojamiento</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PROPERTY_TYPES.map(pt => (
                    <button key={pt.value} type="button" onClick={() => setProperty({ ...property, type: pt.value })}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${property.type === pt.value ? 'border-[#7c3aed] bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-xl">{pt.icon}</span>
                      <div className="text-xs font-bold text-gray-900 mt-1">{pt.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{pt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ciudad</label>
                  <input value={property.city} onChange={e => setProperty({ ...property, city: e.target.value })}
                    placeholder="Quito, Cuenca, Guayaquil..."
                    className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed] bg-gray-50 text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Precio/noche (USD)</label>
                  <input type="number" value={property.pricePerNight} onChange={e => setProperty({ ...property, pricePerNight: e.target.value })}
                    placeholder="35"
                    className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed] bg-gray-50 text-sm text-gray-900" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Dirección (no se muestra en público hasta confirmar la reserva)</label>
                <input value={property.address} onChange={e => setProperty({ ...property, address: e.target.value })}
                  placeholder="Av. República E7-47 y Diego de Almagro"
                  className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed] bg-gray-50 text-sm text-gray-900" />
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { key: 'guests', label: 'Huéspedes' },
                  { key: 'bedrooms', label: 'Hab.' },
                  { key: 'beds', label: 'Camas' },
                  { key: 'bathrooms', label: 'Baños' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">{f.label}</label>
                    <input type="number" min="1" value={(property as Record<string, string>)[f.key]}
                      onChange={e => setProperty({ ...property, [f.key]: e.target.value })}
                      placeholder="1"
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed] bg-gray-50 text-sm text-gray-900 text-center" />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-3">Comodidades disponibles</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AMENITIES.map(a => (
                    <button key={a.key} type="button" onClick={() => toggleAmenity(a.key)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all ${amenities.has(a.key) ? 'border-[#7c3aed] bg-purple-50 text-[#7c3aed]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Descripción del espacio</label>
                <textarea value={property.description} onChange={e => setProperty({ ...property, description: e.target.value })}
                  rows={3} placeholder="Describe lo especial de tu espacio: ubicación, vistas, ambiente..."
                  className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed] bg-gray-50 text-sm text-gray-900 resize-none" />
              </div>

              <button onClick={() => setStep(2)} disabled={!step1Valid}
                className="w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: '#7c3aed' }}>
                Continuar con documentos →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">📂 Documentos y fotos</h2>
            <p className="text-sm text-gray-500 mb-5">Fotos JPG/PNG o documentos PDF. Máx. 10 MB por archivo.</p>
            <div className="space-y-4">
              {REQUIRED_DOCS.map(doc => {
                const status = docs[doc.key];
                const uploaded = !!status.file;
                return (
                  <div key={doc.key} className={`rounded-xl border-2 p-4 ${uploaded ? 'border-purple-200 bg-purple-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{doc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-semibold text-sm text-gray-900">{doc.label}</span>
                          {doc.required && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Requerido</span>}
                          {!doc.required && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Opcional</span>}
                          {uploaded && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">✓ Listo</span>}
                        </div>
                        <p className="text-xs text-gray-500 mb-3">{doc.desc}</p>
                        <label className="cursor-pointer">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${uploaded ? 'border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>
                            {uploaded ? `📎 ${status.file?.name.slice(0, 25)}...` : '📤 Subir archivo'}
                          </div>
                          <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={e => handleFileChange(doc.key, e)} />
                        </label>
                        {status.error && <p className="text-xs text-red-600 mt-1">⚠️ {status.error}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold text-gray-700 border border-gray-200 hover:bg-gray-50">← Volver</button>
              <button onClick={() => setStep(3)} disabled={!step2Valid} className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: '#7c3aed' }}>
                Revisar y enviar →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">✅ Resumen de tu espacio</h2>
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Alojamiento</h3>
                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  {[
                    ['Tipo', PROPERTY_TYPES.find(p => p.value === property.type)?.label || property.type],
                    ['Ciudad', property.city],
                    ['Precio/noche', `$${property.pricePerNight}`],
                    ['Huéspedes', property.guests],
                    ['Camas', property.beds],
                    ['Baños', property.bathrooms],
                  ].map(([k, v]) => (
                    <div key={k}><span className="text-gray-400">{k}: </span><span className="font-medium text-gray-900">{v}</span></div>
                  ))}
                </div>
                {amenities.size > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Comodidades: {[...amenities].map(a => AMENITIES.find(am => am.key === a)?.label).join(', ')}
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Documentos</h3>
                {REQUIRED_DOCS.filter(d => docs[d.key].file).map(doc => (
                  <div key={doc.key} className="flex items-center gap-2 text-sm">
                    <span className="text-purple-600">✓</span><span className="text-gray-700">{doc.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-800">
              <strong>⏱️ Revisión en 2–3 días hábiles.</strong> Verificamos las fotos, documentos y aprobamos tu listing. Luego podrás fijar tu disponibilidad y empezar a recibir reservas.
            </div>
            {globalError && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">⚠️ {globalError}</div>}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3.5 rounded-xl font-bold text-gray-700 border border-gray-200 hover:bg-gray-50">← Volver</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-[2] py-3.5 rounded-xl font-bold text-white disabled:opacity-60 hover:opacity-90" style={{ backgroundColor: '#7c3aed' }}>
                {submitting ? <span className="flex items-center justify-center gap-2"><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</span> : 'Enviar solicitud 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
