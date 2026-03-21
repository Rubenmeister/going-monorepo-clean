'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com/api';

const GUIDE_TYPES = [
  { value: 'cultural', label: 'Cultural / Histórico', icon: '🏛️', desc: 'Ciudades, museos, patrimonio' },
  { value: 'naturaleza', label: 'Naturaleza', icon: '🌿', desc: 'Parques, aves, ecosistemas' },
  { value: 'aventura', label: 'Aventura', icon: '🧗', desc: 'Trekking, escalada, rafting' },
  { value: 'gastronomico', label: 'Gastronómico', icon: '🍽️', desc: 'Cocina local, mercados, fincas' },
  { value: 'comunitario', label: 'Turismo comunitario', icon: '🤝', desc: 'Comunidades indígenas, artesanías' },
  { value: 'fotografico', label: 'Fotográfico', icon: '📷', desc: 'Tours para fotógrafos' },
];

const LANGUAGES = [
  { key: 'es', label: 'Español' },
  { key: 'en', label: 'English' },
  { key: 'fr', label: 'Français' },
  { key: 'de', label: 'Deutsch' },
  { key: 'pt', label: 'Português' },
  { key: 'kichwa', label: 'Kichwa' },
];

const REGIONS = [
  'Quito y alrededores', 'Cuenca y Azuay', 'Galápagos', 'Amazonia (Oriente)',
  'Costa (Guayaquil)', 'Ruta del Spondylus', 'Volcanes del Ecuador', 'Nariz del Diablo',
];

type DocKey = 'cedula' | 'licencia_guia' | 'foto_perfil' | 'certificado_idioma';

const REQUIRED_DOCS: { key: DocKey; label: string; desc: string; icon: string; required: boolean }[] = [
  { key: 'cedula', label: 'Cédula de Identidad', desc: 'Ambos lados.', icon: '🪪', required: true },
  { key: 'licencia_guia', label: 'Licencia de Guía (Ministerio de Turismo)', desc: 'Si no tienes licencia aún, puedes aplicar como "guía local comunitario" mientras la obtienes.', icon: '📋', required: false },
  { key: 'foto_perfil', label: 'Foto de perfil profesional', desc: 'Fondo claro, buena luz. Tú en el contexto de tu tour si es posible.', icon: '🤳', required: true },
  { key: 'certificado_idioma', label: 'Certificado de idioma (opcional)', desc: 'Cambridge, TOEFL, DELF o similar. Suma visibilidad a tu perfil.', icon: '🌍', required: false },
];

interface DocStatus { file: File | null; error: string }

export default function GuiasRegistroPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profile, setProfile] = useState({
    guideType: '',
    experience: '',
    groupSize: '',
    pricePerPerson: '',
    tourDuration: '',
    bio: '',
    tourDescription: '',
  });
  const [languages, setLanguages] = useState<Set<string>>(new Set(['es']));
  const [regions, setRegions] = useState<Set<string>>(new Set());
  const [docs, setDocs] = useState<Record<DocKey, DocStatus>>(() =>
    Object.fromEntries(REQUIRED_DOCS.map(d => [d.key, { file: null, error: '' }])) as Record<DocKey, DocStatus>
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const toggleLanguage = (key: string) => {
    const next = new Set(languages);
    next.has(key) ? next.delete(key) : next.add(key);
    setLanguages(next);
  };

  const toggleRegion = (r: string) => {
    const next = new Set(regions);
    next.has(r) ? next.delete(r) : next.add(r);
    setRegions(next);
  };

  const handleFileChange = (key: DocKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 10 * 1024 * 1024) {
      setDocs(prev => ({ ...prev, [key]: { file: null, error: 'El archivo supera 10 MB' } }));
      return;
    }
    setDocs(prev => ({ ...prev, [key]: { file, error: '' } }));
  };

  const step1Valid = profile.guideType && profile.experience && languages.size > 0 && regions.size > 0 && profile.bio;
  const step2Valid = REQUIRED_DOCS.filter(d => d.required).every(d => docs[d.key].file !== null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setGlobalError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const formData = new FormData();
      Object.entries(profile).forEach(([k, v]) => formData.append(k, v));
      formData.append('languages', JSON.stringify([...languages]));
      formData.append('regions', JSON.stringify([...regions]));
      REQUIRED_DOCS.forEach(d => { if (docs[d.key].file) formData.append(d.key, docs[d.key].file as File); });
      const res = await fetch(`${API_BASE}/guides/onboarding`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Error al enviar');
      setSubmitted(true);
    } catch {
      setGlobalError('Hubo un error al enviar. Intenta de nuevo o escríbenos a guias@goingec.com');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-6" style={{ backgroundColor: '#ecfeff' }}>🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">¡Solicitud enviada!</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Revisaremos tu perfil en <strong>1–2 días hábiles</strong>. Una vez activo podrás crear tus primeros tours y aparecer en búsquedas.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/academy" className="block w-full py-3 rounded-xl font-bold text-white text-center hover:opacity-90" style={{ backgroundColor: '#0891b2' }}>
              📚 Academia para Guías
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
      <div className="text-white py-10 px-6" style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #075985 70%, #0891b220 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <Link href="/auth/register" className="text-cyan-300 text-sm hover:text-white mb-4 inline-block">← Volver al registro</Link>
          <h1 className="text-3xl font-bold mb-2">Activar tu perfil de Guía Local</h1>
          <p className="text-cyan-200 text-sm">Diseña tus propios tours y conecta con viajeros que buscan experiencias auténticas.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[{ n: 1, label: 'Tu perfil' }, { n: 2, label: 'Documentos' }, { n: 3, label: 'Confirmar' }].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: step >= s.n ? '#0891b2' : '#e5e7eb', color: step >= s.n ? 'white' : '#9ca3af' }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${step >= s.n ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 mx-1 ${step > s.n ? 'bg-[#0891b2]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">🗺️ Tu perfil de guía</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de guía</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GUIDE_TYPES.map(gt => (
                    <button key={gt.value} type="button" onClick={() => setProfile({ ...profile, guideType: gt.value })}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${profile.guideType === gt.value ? 'border-[#0891b2] bg-cyan-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-xl">{gt.icon}</span>
                      <div className="text-xs font-bold text-gray-900 mt-1">{gt.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{gt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Idiomas que hablas</label>
                <div className="flex gap-2 flex-wrap">
                  {LANGUAGES.map(l => (
                    <button key={l.key} type="button" onClick={() => toggleLanguage(l.key)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${languages.has(l.key) ? 'border-[#0891b2] bg-cyan-50 text-[#0891b2]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Regiones donde operas</label>
                <div className="flex gap-2 flex-wrap">
                  {REGIONS.map(r => (
                    <button key={r} type="button" onClick={() => toggleRegion(r)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${regions.has(r) ? 'border-[#0891b2] bg-cyan-50 text-[#0891b2]' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'experience', label: 'Años de experiencia', placeholder: '3' },
                  { key: 'groupSize', label: 'Grupo máx.', placeholder: '8' },
                  { key: 'pricePerPerson', label: 'Precio/persona ($)', placeholder: '25' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">{f.label}</label>
                    <input type="number" min="1" placeholder={f.placeholder}
                      value={(profile as Record<string, string>)[f.key]}
                      onChange={e => setProfile({ ...profile, [f.key]: e.target.value })}
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-gray-50 text-sm text-gray-900 text-center" />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tu historia como guía (aparecerá en tu perfil público)</label>
                <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })}
                  rows={3} placeholder="Cuéntanos tu pasión por mostrar Ecuador. ¿Qué hace únicos a tus tours? ¿Cuánto llevas guiando?"
                  className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-gray-50 text-sm text-gray-900 resize-none" />
              </div>

              <button onClick={() => setStep(2)} disabled={!step1Valid}
                className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: '#0891b2' }}>
                Continuar con documentos →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">📂 Documentos</h2>
            <p className="text-sm text-gray-500 mb-5">Solo cédula y foto son obligatorios. Los demás suman credibilidad a tu perfil.</p>
            <div className="space-y-4">
              {REQUIRED_DOCS.map(doc => {
                const status = docs[doc.key];
                const uploaded = !!status.file;
                return (
                  <div key={doc.key} className={`rounded-xl border-2 p-4 ${uploaded ? 'border-cyan-200 bg-cyan-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{doc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-semibold text-sm text-gray-900">{doc.label}</span>
                          {doc.required ? <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Requerido</span>
                            : <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Opcional</span>}
                          {uploaded && <span className="text-xs bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded font-bold">✓ Listo</span>}
                        </div>
                        <p className="text-xs text-gray-500 mb-3">{doc.desc}</p>
                        <label className="cursor-pointer">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${uploaded ? 'border-cyan-300 text-cyan-700 bg-cyan-50 hover:bg-cyan-100' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>
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
              <button onClick={() => setStep(3)} disabled={!step2Valid} className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: '#0891b2' }}>
                Revisar y enviar →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">✅ Resumen de tu perfil</h2>
              <div className="grid grid-cols-2 gap-y-1 text-sm mb-3">
                {[
                  ['Tipo', GUIDE_TYPES.find(g => g.value === profile.guideType)?.label || profile.guideType],
                  ['Experiencia', `${profile.experience} años`],
                  ['Grupo máx.', `${profile.groupSize} personas`],
                  ['Precio/persona', `$${profile.pricePerPerson}`],
                ].map(([k, v]) => (
                  <div key={k}><span className="text-gray-400">{k}: </span><span className="font-medium text-gray-900">{v}</span></div>
                ))}
              </div>
              <p className="text-sm text-gray-500">Idiomas: {[...languages].map(l => LANGUAGES.find(lg => lg.key === l)?.label).join(', ')}</p>
              <p className="text-sm text-gray-500">Regiones: {[...regions].join(' · ')}</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                {REQUIRED_DOCS.filter(d => docs[d.key].file).map(doc => (
                  <div key={doc.key} className="flex items-center gap-2 text-sm">
                    <span className="text-cyan-600">✓</span><span className="text-gray-700">{doc.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-800">
              <strong>⏱️ Revisión en 1–2 días hábiles.</strong> Una vez activo podrás crear tours con fechas, itinerario y precios.
            </div>
            {globalError && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">⚠️ {globalError}</div>}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3.5 rounded-xl font-bold text-gray-700 border border-gray-200 hover:bg-gray-50">← Volver</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-[2] py-3.5 rounded-xl font-bold text-white disabled:opacity-60 hover:opacity-90" style={{ backgroundColor: '#0891b2' }}>
                {submitting ? <span className="flex items-center justify-center gap-2"><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</span> : 'Enviar solicitud 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
