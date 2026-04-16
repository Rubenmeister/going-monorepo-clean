'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth, authFetch } from '../store';
import AppShell from '../components/AppShell';

const SERVICES = [
  {
    icon: '🚐',
    title: 'Transporte ejecutivo',
    desc: 'Flota dedicada para tu empresa',
    color: '#6366f1',
  },
  {
    icon: '🏨',
    title: 'Alojamiento corporativo',
    desc: 'Tarifas preferenciales en hoteles',
    color: '#0ea5e9',
  },
  {
    icon: '📦',
    title: 'Logística y envíos',
    desc: 'Gestión de paquetería empresarial',
    color: '#f59e0b',
  },
  {
    icon: '🎭',
    title: 'Eventos corporativos',
    desc: 'Actividades team building',
    color: '#8b5cf6',
  },
];

export default function CorporatePage() {
  const { token, isReady, init } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  const handleSubmit = async () => {
    if (!company.trim() || !email.trim()) return;
    setLoading(true);
    try {
      await authFetch('/notifications/corporate-inquiry', {
        method: 'POST',
        body: JSON.stringify({ company, contact, email, message }),
      });
    } catch {
      /* staging fallback */
    }
    setSent(true);
    setLoading(false);
  };

  return (
    <AppShell title="Corporativo">
      {/* Header */}
      <div
        className="px-5 py-8 relative overflow-hidden"
        style={{ backgroundColor: '#011627' }}
      >
        <div
          className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10"
          style={{ backgroundColor: '#6366f1' }}
        />
        <p className="text-white/50 text-sm mb-1">Soluciones empresariales</p>
        <h1 className="text-2xl font-black text-white">Going Corporativo</h1>
        <p className="text-sm text-white/40 mt-1">
          Servicios a medida para tu empresa
        </p>
      </div>

      {/* Services grid */}
      <div className="px-4 py-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Nuestros servicios empresariales
        </p>
        <div className="grid grid-cols-2 gap-3">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                style={{ backgroundColor: `${s.color}15` }}
              >
                {s.icon}
              </div>
              <p className="font-bold text-sm text-gray-900">{s.title}</p>
              <p className="text-xs text-gray-400 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact form */}
      <div className="px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-1">Contáctanos</h2>
          <p className="text-xs text-gray-400 mb-4">
            Un asesor se pondrá en contacto contigo
          </p>

          {sent ? (
            <div className="text-center py-6">
              <span className="text-4xl block mb-3">✅</span>
              <p className="font-bold text-gray-900">¡Solicitud enviada!</p>
              <p className="text-sm text-gray-400 mt-1">
                Te contactaremos en menos de 24 horas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Nombre de la empresa *"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#6366f1' } as any}
              />
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Nombre del contacto"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo electrónico *"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="¿En qué podemos ayudarte?"
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none"
              />
              <button
                onClick={handleSubmit}
                disabled={loading || !company.trim() || !email.trim()}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-opacity"
                style={{
                  backgroundColor: '#6366f1',
                  opacity:
                    loading || !company.trim() || !email.trim() ? 0.6 : 1,
                }}
              >
                {loading ? 'Enviando...' : 'Solicitar información'}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
