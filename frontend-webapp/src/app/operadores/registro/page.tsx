'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';

const OPERATOR_TYPES = [
  { value: 'trekking', label: 'Trekking / Senderismo', icon: '🥾', desc: 'Volcanes, páramos, senderos' },
  { value: 'kayak_rafting', label: 'Kayak / Rafting', icon: '🚣', desc: 'Ríos, ríos clase III–V, canotaje' },
  { value: 'escalada', label: 'Escalada', icon: '🧗', desc: 'Escalada en roca y hielo' },
  { value: 'ciclismo', label: 'Ciclismo de montaña', icon: '🚵', desc: 'Rutas en downhill y XC' },
  { value: 'buceo', label: 'Buceo / Snorkel', icon: '🤿', desc: 'Galápagos, costa ecuatoriana' },
  { value: 'parapente', label: 'Parapente / Canopy', icon: '🪂', desc: 'Deportes aéreos' },
  { value: 'camping', label: 'Camping / Glamping', icon: '⛺', desc: 'Experiencias de noche al aire libre' },
  { value: 'observacion', label: 'Observación de flora/fauna', icon: '🦉', desc: 'Birdwatching, biodiversidad' },
];

const CERTIFICATIONS = [
  { key: 'rnt', label: 'RNT (Reg. Nac. Turismo)' },
  { key: 'luae', label: 'LUAE Municipal' },
  { key: 'mintur', label: 'Operadora MINTUR' },
  { key: 'iso', label: 'ISO 9001 / Calidad' },
  { key: 'seguro', label: 'Seguro de responsabilidad civil' },
];

type DocKey = 'cedula_ruc' | 'rnt' | 'seguro' | 'foto_actividad' | 'lista_equipos';

const REQUIRED_DOCS: { key: DocKey; label: string; desc: string; icon: string; required: boolean }[] = [
  { key: 'cedula_ruc', label: 'Cédula o RUC', desc: 'Cédula si eres persona natural. RUC si operas como empresa.', icon: '🪪', required: true },
  { key: 'rnt', label: 'Registro Nacional de Turismo (RNT) o LUAE', desc: 'Habilitación legal para operar. Si no lo tienes aún, puedes aplicar provisionalmente.', icon: '📋', required: false },
  { key: 'seguro', label: 'Póliza de seguro de responsabilidad civil', desc: 'Obligatoria para actividades de riesgo. Debe cubrir a los participantes durante las actividades.', icon: '🛡️', required: true },
  { key: 'foto_actividad', label: 'Foto de tu operación en acción', desc: 'Una foto de una actividad real. Transmite confianza a los viajeros.', icon: '📸', required: true },
  { key: 'lista_equipos', label: 'Lista de equipos de seguridad', desc: 'PDF o foto de tu inventario: cascos, arneses, chalecos, kit de primeros auxilios, etc.', icon: '🎒', required: false },
];

interface DocStatus { file: File | null; error: string }

export default function OperadoresRegistroPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profile, setProfile] = useState({
    companyName: '',
    operatorType: '',
    experience: '',
    maxGroupSize: '',
    minAge: '',
    difficulty: '',
    pricePerPerson: '',
    duration: '',
    description: '',
    meetingPoint: '',
  });
  const [certifications, setCertifications] = useState<Set<string>>(new Set());
  const [docs, setDocs] = useState<Record<DocKey, DocStatus>>(() =>
    Object.fromEntries(REQUIRED_DOCS.map(d => [d.key, { file: null, error: '' }])) as Record<DocKey, DocStatus>
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const toggleCert = (key: string) => {
    const next = new Set(certifications);
    next.has(key) ? next.delete(key) : next.add(key);
    setCertifications(next);
  };

  const handleFileChange = (key: DocKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 15 * 1024 * 1024) {
      setDocs(prev => ({ ...prev, [key]: { file: null, error: 'El archivo supera 15 MB' } }));
      return;
    }
    setDocs(prev => ({ ...prev, [key]: { file, error: '' } }));
  };

  const step1Valid = profile.operatorType && profile.experience && profile.maxGroupSize && profile.pricePerPerson && profile.duration && profile.description;
  const step2Valid = REQUIRED_DOCS.filter(d => d.required).every(d => docs[d.key].file !== null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setGlobalError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const formData = new FormData();
      Object.entries(profile).forEach(([k, v]) => formData.append(k, v));
      formData.append('certifications', JSON.stringify([...certifications]));
      REQUIRED_DOCS.forEach(d => { if (docs[d.key].file) formData.append(d.key, docs[d.key].file as File); });
      const res = await fetch(`${API_BASE}/operators/onboarding`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Error al enviar');
      setSubmitted(true);
    } catch {
      setGlobalError('Hubo un error al enviar. Intenta de nuevo o escríbenos a operadores@goingec.com');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-6" style={{ backgroundColor: '#fffbeb' }}>🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">¡Solicitud enviada!</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Revisaremos tu operación en <strong>2–4 días hábiles</strong>. Verificamos seguros, documentos y la experiencia ofrecida.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/academy" className="block w-full py-3 rounded-xl font-bold text-white text-center hover:opacity-90" style={{ backgroundColor: '#d97706' }}>
              📚 Academia para Operadores
            </Link>
            <Link href="/" className="block w-full py-3 rounded-xl font-bold text-gray-700 text-center bg-white border border-gray-200 hover:bg-gray-50">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const DIFFICULTY_LEVELS = [
    { value: 'facil', label: 'Fácil', icon: '🟢', desc: 'Sin experiencia previa' },
    { value: 'moderado', label: 'Moderado', icon: '🟡', desc: 'Buena condición física' },
    { value: 'dificil', label: 'Difícil', icon: '🔴', desc: 'Experiencia recomendada' },
    { value: 'experto', label: 'Experto', icon: '⚫', desc: 'Técnico y exigente' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-white py-10 px-6" style={{ background: 'linear-gradient(135deg, #451a03 0%, #78350f 70%, #d9770620 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <Link href="/auth/register" className="text-amber-300 text-sm hover:text-white mb-4 inline-block">← Volver al registro</Link>
          <h1 className="text-3xl font-bold mb-2">Activar tu perfil de Operador</h1>
          <p className="text-amber-200 text-sm">Lleva a viajeros a los rincones más increíbles de Ecuador con tu operación verificada.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[{ n: 1, label: 'Tu operación' }, { n: 2, label: 'Documentos' }, { n: 3, label: 'Confirmar' }].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: step >= s.n ? '#d97706' : '#e5e7eb', color: step >= s.n ? 'white' : '#9ca3af' }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${step >= s.n ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 mx-1 ${step > s.n ? 'bg-[#d97706]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">🎒 Tu operación turística</h2>
            <div className="space-y-5">

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nombre de la operadora (o tu nombre completo)</label>
                <input value={profile.companyName} onChange={e => setProfile({ ...profile, companyName: e.target.value })}
                  placeholder="Andes Wild Expeditions / Juan Pérez"
                  className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d97706] bg-gray-50 text-sm text-gray-900" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de actividad principal</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {OPERATOR_TYPES.map(ot => (
                    <button key={ot.value} type="button" onClick={() => setProfile({ ...profile, operatorType: ot.value })}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${profile.operatorType === ot.value ? 'border-[#d97706] bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-xl">{ot.icon}</span>
                      <div className="text-xs font-bold text-gray-900 mt-1 leading-tight">{ot.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nivel de dificultad</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DIFFICULTY_LEVELS.map(dl => (
                    <button key={dl.value} type="button" onClick={() => setProfile({ ...profile, difficulty: dl.value })}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${profile.difficulty === dl.value ? 'border-[#d97706] bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-lg">{dl.icon}</span>
                      <div className="text-xs font-bold text-gray-900 mt-1">{dl.label}</div>
                      <div className="text-xs text-gray-400">{dl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'experience', label: 'Años operando', placeholder: '5' },
                  { key: 'maxGroupSize', label: 'Grupo máx.', placeholder: '12' },
                  { key: 'minAge', label: 'Edad mín.', placeholder: '14' },
                  { key: 'pricePerPerson', label: 'Precio/pax ($)', placeholder: '45' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">{f.label}</label>
                    <input type="number" min="1" placeholder={f.placeholder}
                      value={(profile as Record<string, string>)[f.key]}
                      onChange={e => setProfile({ ...profile, [f.key]: e.target.value })}
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d97706] bg-gray-50 text-sm text-gray-900 text-center" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Duración</label>
                  <input value={profile.duration} onChange={e => setProfile({ ...profile, duration: e.target.value })}
                    placeholder="1 día / 3 días 2 noches"
                    className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d97706] bg-gray-50 text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Punto de encuentro</label>
                  <input value={profile.meetingPoint} onChange={e => setProfile({ ...profile, meetingPoint: e.target.value })}
                    placeholder="Quito norte, Parque Loma..."
                    className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d97706] bg-gray-50 text-sm text-gray-900" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Descripción de la experiencia</label>
                <textarea value={profile.description} onChange={e => setProfile({ ...profile, description: e.target.value })}
                  rows={3} placeholder="Describe la actividad, qué incluye, qué llevar, por qué es especial..."
                  className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d97706] bg-gray-50 text-sm text-gray-900 resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Certificaciones que posees</label>
                <div className="flex gap-2 flex-wrap">
                  {CERTIFICATIONS.map(c => (
                    <button key={c.key} type="button" onClick={() => toggleCert(c.key)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${certifications.has(c.key) ? 'border-[#d97706] bg-amber-50 text-[#d97706]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setStep(2)} disabled={!step1Valid}
                className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: '#d97706' }}>
                Continuar con documentos →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">📂 Documentos y verificación</h2>
            <p className="text-sm text-gray-500 mb-5">Los documentos de seguro son obligatorios para actividades de riesgo. Máx. 15 MB por archivo.</p>
            <div className="space-y-4">
              {REQUIRED_DOCS.map(doc => {
                const status = docs[doc.key];
                const uploaded = !!status.file;
                return (
                  <div key={doc.key} className={`rounded-xl border-2 p-4 ${uploaded ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{doc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-semibold text-sm text-gray-900">{doc.label}</span>
                          {doc.required ? <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Requerido</span>
                            : <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Opcional</span>}
                          {uploaded && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">✓ Listo</span>}
                        </div>
                        <p className="text-xs text-gray-500 mb-3">{doc.desc}</p>
                        <label className="cursor-pointer">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${uploaded ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>
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
              <button onClick={() => setStep(3)} disabled={!step2Valid} className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: '#d97706' }}>
                Revisar y enviar →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">✅ Resumen de tu operación</h2>
              <div className="grid grid-cols-2 gap-y-1 text-sm mb-3">
                {[
                  ['Operadora', profile.companyName || '—'],
                  ['Actividad', OPERATOR_TYPES.find(o => o.value === profile.operatorType)?.label || profile.operatorType],
                  ['Dificultad', DIFFICULTY_LEVELS.find(d => d.value === profile.difficulty)?.label || '—'],
                  ['Duración', profile.duration],
                  ['Grupo máx.', profile.maxGroupSize],
                  ['Precio/pax', `$${profile.pricePerPerson}`],
                ].map(([k, v]) => (
                  <div key={k}><span className="text-gray-400">{k}: </span><span className="font-medium text-gray-900">{v}</span></div>
                ))}
              </div>
              {certifications.size > 0 && (
                <p className="text-sm text-gray-500 mb-2">Certificaciones: {[...certifications].map(c => CERTIFICATIONS.find(cf => cf.key === c)?.label).join(', ')}</p>
              )}
              <div className="pt-3 border-t border-gray-100 mt-2">
                {REQUIRED_DOCS.filter(d => docs[d.key].file).map(doc => (
                  <div key={doc.key} className="flex items-center gap-2 text-sm">
                    <span className="text-amber-600">✓</span><span className="text-gray-700">{doc.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-800">
              <strong>⏱️ Revisión en 2–4 días hábiles.</strong> Por el tipo de actividad verificamos seguros y habilitaciones de seguridad antes de publicar tu perfil.
            </div>
            {globalError && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">⚠️ {globalError}</div>}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3.5 rounded-xl font-bold text-gray-700 border border-gray-200 hover:bg-gray-50">← Volver</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-[2] py-3.5 rounded-xl font-bold text-white disabled:opacity-60 hover:opacity-90" style={{ backgroundColor: '#d97706' }}>
                {submitting ? <span className="flex items-center justify-center gap-2"><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</span> : 'Enviar solicitud 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
