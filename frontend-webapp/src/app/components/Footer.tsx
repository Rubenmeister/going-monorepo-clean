'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Subscribe:', email);
    setEmail('');
  };

  const services = [
    { name: 'Going',              href: '/' },
    { name: 'Transporte',         href: '/services/transport' },
    { name: 'Tours',              href: '/services/tours' },
    { name: 'Alojamiento',        href: '/services/accommodation' },
    { name: 'Experiencias',       href: '/services/experiences' },
    { name: 'Envíos',             href: '/services/envios' },
    { name: 'Academia Going',     href: '/academy' },
    { name: 'Blog',               href: '/blog' },
    { name: 'Noticias',           href: '/news' },
  ];

  const company = [
    { name: 'Quiénes Somos',  href: '/quienes-somos' },
    { name: 'Comunidad Going', href: '/comunidad' },
    { name: 'Carreras',        href: '/careers' },
    { name: 'Sostenibilidad',  href: '/sustainability' },
    { name: 'Empresas',        href: '/empresas' },
  ];

  const legal = [
    { name: 'Términos de Servicio', href: '/legal/terms' },
    { name: 'Política de Privacidad', href: '/legal/privacy' },
    { name: 'Cookies', href: '/legal/cookies' },
    { name: 'Contacto Legal', href: '/legal/contact' },
  ];

  const support = [
    { name: 'Centro de Ayuda',     href: '/help' },
    { name: 'Contacto',            href: '/contact' },
    { name: 'Estado del Servicio', href: '/status' },
    { name: 'Seguridad',           href: '/security' },
    { name: 'Documentación',       href: '/documentation' },
    { name: 'SOS Emergencias',     href: '/sos' },
  ];

  const socialLinks = [
    { icon: '🐦', name: 'Twitter', url: 'https://twitter.com/goingecuador' },
    { icon: '📘', name: 'Facebook', url: 'https://facebook.com/goingecuador' },
    {
      icon: '📷',
      name: 'Instagram',
      url: 'https://instagram.com/goingecuador',
    },
    { icon: '▶️', name: 'YouTube', url: 'https://youtube.com/goingecuador' },
    {
      icon: '💼',
      name: 'LinkedIn',
      url: 'https://linkedin.com/company/goingecuador',
    },
    { icon: '🎵', name: 'TikTok', url: 'https://tiktok.com/@goingecuador' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-100 mt-20">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        {/* Top Section - Services */}
        <div className="mb-12 pb-8 border-b border-gray-800">
          <h3 className="text-white font-bold text-lg mb-6">
            Nuestros Servicios
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {services.map((service) => (
              <Link
                key={service.name}
                href={service.href}
                className="text-gray-400 hover:text-white transition-colors text-sm font-medium py-2"
              >
                {service.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Subscribe Section */}
        <div className="mb-12 pb-8 border-b border-gray-800">
          <div className="max-w-md">
            <h3 className="text-white font-bold text-lg mb-3">
              📧 Suscríbete a Nuestro Newsletter
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Recibe las mejores ofertas, tips de viaje y noticias exclusivas
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4c41] text-sm"
                required
              />
              <button
                type="submit"
                className="px-6 py-2 bg-[#ff4c41] text-white rounded-lg hover:bg-[#e63a2f] transition-colors font-semibold text-sm whitespace-nowrap"
              >
                Suscribirse
              </button>
            </form>
          </div>
        </div>

        {/* Middle Section - Links Grid */}
        <div className="grid md:grid-cols-4 gap-8 mb-12 pb-8 border-b border-gray-800">
          {/* Company */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wide">
              Empresa
            </h4>
            <ul className="space-y-3">
              {company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wide">
              Legal
            </h4>
            <ul className="space-y-3">
              {legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wide">
              Soporte
            </h4>
            <ul className="space-y-3">
              {support.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wide">
              Contacto
            </h4>
            <ul className="space-y-3">
              <li>
                <p className="text-gray-400 text-sm">
                  <strong className="text-white">Dirección:</strong>
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Calle Principal 123, Quito, Ecuador
                </p>
              </li>
              <li>
                <p className="text-gray-400 text-sm">
                  <strong className="text-white">Teléfono:</strong>
                </p>
                <a
                  href="tel:+593123456789"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  +593 (1) 234-5678
                </a>
              </li>
              <li>
                <p className="text-gray-400 text-sm">
                  <strong className="text-white">Email:</strong>
                </p>
                <a
                  href="mailto:hola@goingec.com"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  hola@goingec.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Download App Section */}
        <div className="mb-12 pb-8 border-b border-gray-800">
          <h3 className="text-white font-bold text-lg mb-6">
            📱 Obtén Nuestra App
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Web */}
            <a
              href="https://app.goingec.com"
              className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all"
            >
              <span className="text-3xl">🌐</span>
              <div>
                <p className="text-white font-semibold text-sm">Going Web</p>
                <p className="text-gray-400 text-xs">
                  Acceso desde cualquier navegador
                </p>
              </div>
            </a>

            {/* Android */}
            <a
              href="https://play.google.com/store/apps/details?id=com.goingappecuador"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all"
            >
              <span className="text-3xl">🤖</span>
              <div>
                <p className="text-white font-semibold text-sm">Android</p>
                <p className="text-gray-400 text-xs">Google Play Store</p>
              </div>
            </a>

            {/* Apple */}
            <a
              href="https://apps.apple.com/app/going-ecuador/id6743619765"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all"
            >
              <span className="text-3xl">🍎</span>
              <div>
                <p className="text-white font-semibold text-sm">iOS</p>
                <p className="text-gray-400 text-xs">App Store</p>
              </div>
            </a>
          </div>
        </div>

        {/* Social Media & Bottom Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-8">
          {/* Logo & Description */}
          <div className="md:flex-1">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              🌍 Going
            </div>
            <p className="text-gray-400 text-sm max-w-xs">
              Conectando viajeros con experiencias inolvidables en Ecuador y el
              mundo
            </p>
            <p className="text-gray-600 text-xs mt-4">
              © 2026 Going Ecuador. Todos los derechos reservados.
            </p>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wide">
              Síguenos
            </h4>
            <div className="flex gap-3 flex-wrap">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.name}
                  className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full hover:bg-[#ff4c41] transition-colors text-lg"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <div>Made with ❤️ for travelers around the world</div>
          <div className="flex gap-6">
            <Link
              href="/legal/terms"
              className="hover:text-white transition-colors"
            >
              Términos
            </Link>
            <Link
              href="/legal/privacy"
              className="hover:text-white transition-colors"
            >
              Privacidad
            </Link>
            <Link
              href="/legal/cookies"
              className="hover:text-white transition-colors"
            >
              Cookies
            </Link>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
