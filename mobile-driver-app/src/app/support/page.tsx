'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDriver } from '../store';
import AppShell from '../components/AppShell';

const FAQS = [
  {
    q: '¿Cómo recibo el pago por mis viajes?',
    a: 'Los pagos se acreditan diariamente en tu cuenta bancaria registrada, en días hábiles.',
  },
  {
    q: '¿Qué hago si un pasajero deja algo olvidado?',
    a: 'Repórtalo inmediatamente a través del botón de Soporte y te daremos instrucciones para la devolución.',
  },
  {
    q: '¿Cómo actualizo mi información vehicular?',
    a: 'Ve a Perfil → Mi vehículo y podrás actualizar los datos de tu vehículo registrado.',
  },
  {
    q: '¿Cómo se calcula mi calificación?',
    a: 'Tu calificación es el promedio de las últimas 100 reseñas de pasajeros. Los viajes sin calificación no afectan tu promedio.',
  },
];

export default function SupportPage() {
  const { token, isReady, init } = useDriver();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  const handleSend = () => {
    if (!message.trim()) return;
    setSent(true);
    setMessage('');
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <AppShell title="Soporte">
      <div
        className="px-5 py-8 relative overflow-hidden"
        style={{ backgroundColor: '#011627' }}
      >
        <div
          className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10"
          style={{ backgroundColor: '#ff4c41' }}
        />
        <p className="text-white/50 text-sm mb-1">Estamos para ayudarte</p>
        <h1 className="text-2xl font-black text-white">Centro de Soporte</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Quick contact */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: '📞',
              label: 'Llamar ahora',
              sub: 'Lun–Vie 8h–20h',
              action: 'tel:+5932123456',
            },
            {
              icon: '💬',
              label: 'Chat en vivo',
              sub: 'Disponible ahora',
              action: '#',
            },
          ].map((c) => (
            <a
              key={c.label}
              href={c.action}
              className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center gap-1.5 hover:shadow-md transition-shadow"
            >
              <span className="text-3xl">{c.icon}</span>
              <p className="text-sm font-bold text-gray-900">{c.label}</p>
              <p className="text-xs text-gray-400">{c.sub}</p>
            </a>
          ))}
        </div>

        {/* Send message */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-bold text-gray-900 mb-3">
            Enviar un mensaje
          </p>
          {sent ? (
            <div className="py-4 text-center">
              <span className="text-3xl block mb-2">✅</span>
              <p className="text-sm font-bold text-green-600">
                Mensaje enviado
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Te responderemos en menos de 24 horas
              </p>
            </div>
          ) : (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe tu problema o consulta..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-red-400"
                rows={3}
              />
              <button
                onClick={handleSend}
                className="mt-2 w-full py-3 rounded-xl font-bold text-sm text-white transition-opacity"
                style={{
                  backgroundColor: '#ff4c41',
                  opacity: message.trim() ? 1 : 0.5,
                }}
              >
                Enviar
              </button>
            </>
          )}
        </div>

        {/* FAQ */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Preguntas frecuentes
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                style={
                  i < FAQS.length - 1
                    ? { borderBottom: '1px solid #f3f4f6' }
                    : {}
                }
              >
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {faq.q}
                  </span>
                  <span
                    className="text-gray-400 transition-transform"
                    style={{
                      transform:
                        openFaq === i ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  >
                    ›
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-3.5">
                    <p className="text-sm text-gray-600">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
