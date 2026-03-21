'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

function FooterSection({ title, links, icon }: { title: string; icon?: string; links: Array<{ name: string; href: string; badge?: string }> }) {
  return (
    <div>
      <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider flex items-center gap-1.5">
        {icon && <span>{icon}</span>}
        {title}
      </h4>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.name} className="flex items-center gap-2">
            <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
              {link.name}
            </Link>
            {link.badge && (
              <span className="text-xs bg-[#ff4c41] text-white px-1.5 py-0.5 rounded-full font-bold leading-none">{link.badge}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  const services = [
    { name: 'Transporte', href: '/pasajeros' },
    { name: 'Alojamiento', href: '/services/accommodation' },
    { name: 'Tours', href: '/services/tours' },
    { name: 'Experiencias', href: '/services/experiences' },
    { name: 'Envíos', href: '/envios' },
    { name: 'Cotizar envío', href: '/envios/cotizar', badge: 'Nuevo' },
  ];

  const proveedores = [
    { name: '🚗 Conductores', href: '/conductores' },
    { name: '🏡 Anfitriones', href: '/anfitriones' },
    { name: '🏺 Promotores Locales', href: '/promotores-locales' },
    { name: '🧗 Operadores', href: '/operadores' },
    { name: 'Registro de proveedor', href: '/auth/register', badge: 'Gratis' },
  ];

  const empresa = [
    { name: 'Quiénes Somos', href: '/quienes-somos' },
    { name: 'Comunidad Going', href: '/comunidad' },
    { name: 'Academia Going', href: '/academy', badge: 'Gratis' },
    { name: 'Blog', href: '/blog' },
    { name: 'Noticias', href: '/news' },
    { name: 'Carreras', href: '/careers' },
  ];

  const localCommunity = [
    { name: 'Impacto en tu Ciudad', href: '/comunidad-local/impacto' },
    { name: 'Economía Colaborativa', href: '/comunidad-local/economia-colaborativa' },
    { name: 'Eventos Comunitarios', href: '/comunidad-local/eventos' },
    { name: 'Sostenibilidad 🌿', href: '/comunidad-local/sostenibilidad' },
    { name: 'Festividades Locales 🎊', href: '/comunidad-local/festividades' },
  ];

  const legal = [
    { name: 'Términos de Servicio', href: '/legal/terms' },
    { name: 'Privacidad', href: '/legal/privacy' },
    { name: 'Cookies', href: '/legal/cookies' },
    { name: 'Contacto Legal', href: '/legal/contact' },
  ];

  const support = [
    { name: 'Centro de Ayuda', href: '/help' },
    { name: 'Contacto', href: '/contact' },
    { name: 'Estado del Servicio', href: '/status' },
    { name: 'Seguridad', href: '/security' },
  ];

  const socialLinks = [
    { icon: '📘', name: 'Facebook', url: 'https://facebook.com/goingecuador' },
    { icon: '📷', name: 'Instagram', url: 'https://instagram.com/goingecuador' },
    { icon: '🎵', name: 'TikTok', url: 'https://tiktok.com/@goingecuador' },
    { icon: '▶️', name: 'YouTube', url: 'https://youtube.com/@going' },
    { icon: '🐦', name: 'X / Twitter', url: 'https://twitter.com/goingecuador' },
    { icon: '💼', name: 'LinkedIn', url: 'https://linkedin.com/company/going' },
  ];

  return (
    <footer className="bg-gray-950 text-gray-300">
      {/* Provider CTA bar */}
      <div className="border-b border-gray-800" style={{ background: 'linear-gradient(90deg, #1a0a0a, #3d1010)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-white font-bold text-sm mb-1">¿Quieres ganar con Going?</div>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: '🚗', label: 'Conductor', href: '/conductores' },
                  { icon: '🏡', label: 'Anfitrión', href: '/anfitriones' },
                  { icon: '🏺', label: 'Promotor Local', href: '/promotores-locales' },
                  { icon: '🧗', label: 'Operador', href: '/operadores' },
                ].map(item => (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-1.5 text-gray-300 hover:text-white text-xs font-medium transition-colors">
                    <span>{item.icon}</span>{item.label}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href="/auth/register"
              className="flex-shrink-0 text-sm font-bold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{ backgroundColor: '#ff4c41' }}
            >
              Registrarme gratis →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14">
        {/* Brand + social */}
        <div className="flex flex-col lg:flex-row items-start gap-10 mb-12 pb-12 border-b border-gray-800">
          <div className="flex-shrink-0 max-w-xs">
            <Image src="/going-logo-white-h.png" alt="Going" width={140} height={46} className="h-10 w-auto mb-4" />
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              La plataforma de movilidad y servicios de Ecuador. Transporte, alojamiento, tours y envíos — todo en un lugar.
            </p>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.name}
                  className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center text-lg transition-all"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* App download */}
          <div className="flex-shrink-0">
            <p className="text-white font-bold text-sm mb-3 uppercase tracking-wider">Descarga la App</p>
            <div className="flex gap-3">
              <a href="#" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-2.5 transition-all">
                <span className="text-xl">🍎</span>
                <div>
                  <div className="text-xs text-gray-400">App Store</div>
                  <div className="text-white text-sm font-bold">iPhone</div>
                </div>
              </a>
              <a href="#" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-2.5 transition-all">
                <span className="text-xl">🤖</span>
                <div>
                  <div className="text-xs text-gray-400">Google Play</div>
                  <div className="text-white text-sm font-bold">Android</div>
                </div>
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '1M+', label: 'Usuarios', icon: '👤' },
              { value: '50+', label: 'Ciudades', icon: '📍' },
              { value: '5K+', label: 'Conductores', icon: '🚗' },
              { value: '4.9★', label: 'Calificación', icon: '⭐' },
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-gray-900 rounded-xl p-3">
                <div className="text-base mb-0.5">{stat.icon}</div>
                <div className="text-white font-black text-lg" style={{ color: '#ff4c41' }}>{stat.value}</div>
                <div className="text-gray-500 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 6-Column Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          <FooterSection title="Servicios" links={services} />
          <FooterSection title="Proveedores" icon="🤝" links={proveedores} />
          <FooterSection title="Empresa" links={empresa} />
          <FooterSection title="Comunidad Local" icon="🏘️" links={localCommunity} />
          <FooterSection title="Legal" links={legal} />

          {/* Column 5: Soporte + Newsletter */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Soporte</h4>
            <ul className="space-y-2.5 mb-6">
              {support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Newsletter mini */}
            <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">📬 Boletín</h4>
            <p className="text-gray-400 text-xs mb-3">Ofertas y novedades directas a tu correo.</p>
            {subscribed ? (
              <div className="text-green-400 text-xs flex items-center gap-1.5">
                <span>✅</span>
                <span>¡Suscrito! Gracias.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-3 py-2 rounded-lg text-gray-900 text-sm bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff4c41]"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2 text-white rounded-lg font-bold text-sm transition-all hover:opacity-90"
                  style={{ backgroundColor: '#ff4c41' }}
                >
                  Suscribir
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span>© {new Date().getFullYear()} Going Ecuador</span>
            <span className="hidden md:block">·</span>
            <span className="text-xs">🇪🇨 Hecho en Ecuador para Ecuador</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Todos los servicios operativos</span>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1">
            <span className="text-xs text-gray-600">v2.0.0</span>
            <span className="text-xs text-gray-700">Powered by <span className="text-gray-500 font-medium">Thorn AI Technologies</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
