'use client';

import { useState } from 'react';

// ── EDITABLE CONTENT ───────────────────────────────────────────────
const CONTACT_INFO = [
  {
    icon: '📍',
    title: 'Dirección',
    lines: [
      'Av. República del El Salvador N35-88',
      'Torre Atiria, Piso 10',
      'Quito, Ecuador',
    ],
    link: null,
  },
  {
    icon: '📞',
    title: 'Teléfono',
    lines: ['+593 2 600-1234', 'Lun – Vie: 8:00 – 20:00', 'Sáb: 9:00 – 14:00'],
    link: 'tel:+59326001234',
  },
  {
    icon: '✉️',
    title: 'Email',
    lines: ['hola@goingec.com', 'soporte@goingec.com'],
    link: 'mailto:hola@goingec.com',
  },
  {
    icon: '💬',
    title: 'WhatsApp',
    lines: ['+593 99 123-4567', 'Respuesta en minutos', 'Disponible 24/7'],
    link: 'https://wa.me/593991234567',
  },
];

const TOPICS = [
  'Reserva de transporte',
  'Alojamiento',
  'Tours y experiencias',
  'Envíos',
  'Pagos y facturación',
  'Ser proveedor / anfitrión',
  'Prensa y medios',
  'Otro',
];

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    href: 'https://facebook.com/goingec',
    color: '#1877F2',
    icon: '📘',
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/goingec',
    color: '#E4405F',
    icon: '📸',
  },
  {
    name: 'WhatsApp',
    href: 'https://wa.me/593991234567',
    color: '#25D366',
    icon: '💬',
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com/@goingec',
    color: '#010101',
    icon: '🎵',
  },
];
// ── END EDITABLE CONTENT ───────────────────────────────────────────

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    topic: '',
    message: '',
  });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', phone: '', topic: '', message: '' });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section
        className="relative py-20 px-4 text-white text-center overflow-hidden"
        style={{ backgroundColor: '#011627' }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white opacity-5 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white opacity-5 translate-y-1/2 -translate-x-1/3" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="text-5xl mb-4">👋</div>
          <h1 className="text-5xl font-bold mb-4">Contáctanos</h1>
          <p className="text-xl text-white/75">
            Estamos aquí para ayudarte. Cuéntanos cómo podemos hacer tu
            experiencia Going aún mejor.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 grid lg:grid-cols-5 gap-12">
        {/* Contact Info — left column */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Información de contacto
          </h2>
          {CONTACT_INFO.map((c) => (
            <div
              key={c.title}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex gap-4 items-start"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: '#fff5f5' }}
              >
                {c.icon}
              </div>
              <div>
                <div className="font-bold text-gray-900 mb-1">{c.title}</div>
                {c.lines.map((line, i) =>
                  i === 0 && c.link ? (
                    <a
                      key={i}
                      href={c.link}
                      className="text-sm font-semibold hover:underline block"
                      style={{ color: '#ff4c41' }}
                    >
                      {line}
                    </a>
                  ) : (
                    <div key={i} className="text-sm text-gray-500">
                      {line}
                    </div>
                  )
                )}
              </div>
            </div>
          ))}

          {/* Social links */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="font-bold text-gray-900 mb-3">Síguenos</div>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.name}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-gray-100 hover:shadow-md transition-all"
                  style={{ backgroundColor: '#f9fafb' }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form — right column */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {sent ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  ¡Mensaje enviado!
                </h3>
                <p className="text-gray-500 mb-6">
                  Gracias por escribirnos. Te respondemos en menos de 24 horas
                  hábiles.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="px-6 py-3 font-bold rounded-xl text-white text-sm transition-all hover:shadow-md"
                  style={{ backgroundColor: '#ff4c41' }}
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Envíanos un mensaje
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="Tu nombre"
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        placeholder="+593 99 ···"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="tu@email.com"
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Tema
                    </label>
                    <select
                      value={form.topic}
                      onChange={(e) =>
                        setForm({ ...form, topic: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent bg-white"
                    >
                      <option value="">Selecciona un tema…</option>
                      {TOPICS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Mensaje *
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                      rows={5}
                      placeholder="Cuéntanos cómo podemos ayudarte…"
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 font-bold rounded-xl text-white text-sm transition-all hover:shadow-md"
                    style={{ backgroundColor: '#ff4c41' }}
                  >
                    Enviar mensaje →
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    Te respondemos en menos de 24 horas hábiles.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
