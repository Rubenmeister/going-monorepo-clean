'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * Footer component
 * Main footer with links, newsletter signup, and social media
 */
export function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement newsletter subscription
    setEmail('');
  };

  const services = [
    { name: 'Going', href: '/' },
    { name: 'Transporte', href: '/services/transport' },
    { name: 'Tours', href: '/services/tours' },
    { name: 'Alojamiento', href: '/services/accommodation' },
    { name: 'Experiencias', href: '/services/experiences' },
    { name: 'Academia Going', href: '/academy' },
    { name: 'Blog', href: '/blog' },
    { name: 'Noticias', href: '/news' },
  ];

  const company = [
    { name: 'Quiénes Somos', href: '/about' },
    { name: 'Comunidad Going', href: '/community' },
    { name: 'Carreras', href: '/careers' },
    { name: 'Sostenibilidad', href: '/sustainability' },
  ];

  const legal = [
    { name: 'Términos de Servicio', href: '/legal/terms' },
    { name: 'Política de Privacidad', href: '/legal/privacy' },
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
    { icon: '🐦', name: 'Twitter', url: 'https://twitter.com/goingecuador' },
    { icon: '📘', name: 'Facebook', url: 'https://facebook.com/goingecuador' },
    {
      icon: '📷',
      name: 'Instagram',
      url: 'https://instagram.com/goingecuador',
    },
    { icon: '🎥', name: 'YouTube', url: 'https://youtube.com/@going' },
    { icon: '💼', name: 'LinkedIn', url: 'https://linkedin.com/company/going' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Newsletter */}
        <div className="mb-12 pb-8 border-b border-gray-800">
          <h3 className="text-white font-bold mb-4">
            ¡Suscribete a nuestro boletín!
          </h3>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="flex-1 px-4 py-2 rounded-lg text-gray-900"
              required
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Suscribir
            </button>
          </form>
        </div>

        {/* Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          <FooterSection title="Servicios" links={services} />
          <FooterSection title="Empresa" links={company} />
          <FooterSection title="Legal" links={legal} />
          <FooterSection title="Soporte" links={support} />

          {/* Social Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Síguenos</h4>
            <div className="space-y-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <span>{social.icon}</span>
                  <span>{social.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} Going. All rights reserved. Made
            with ❤️
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * Footer section component
 */
function FooterSection({
  title,
  links,
}: {
  title: string;
  links: Array<{ name: string; href: string }>;
}) {
  return (
    <div>
      <h4 className="text-white font-bold mb-4">{title}</h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.name}>
            <Link
              href={link.href}
              className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
