import React from 'react';
import Link from 'next/link';

const newsPosts = [
  {
    id: 1,
    title: 'Going se prepara para transformar la movilidad en Ecuador',
    date: '2026-03-01',
    category: 'Empresa',
    excerpt:
      'Estamos próximos a lanzar oficialmente nuestra plataforma en Ecuador, conectando pasajeros y conductores de manera segura y eficiente.',
  },
  {
    id: 2,
    title: 'Going: tecnología de seguridad en tiempo real para cada viaje',
    date: '2026-02-15',
    category: 'Producto',
    excerpt:
      'Nuestra plataforma incorpora monitoreo en tiempo real y verificación de conductores para garantizar la seguridad de todos los viajes.',
  },
  {
    id: 3,
    title: '¿Qué hace diferente a Going del resto?',
    date: '2026-02-01',
    category: 'Comunidad',
    excerpt:
      'Going nace con un enfoque local: entendemos las rutas, la cultura y las necesidades de movilidad del Ecuador.',
  },
];

export const metadata = {
  title: 'Noticias Going — Novedades y Anuncios',
  description: 'Mantente al día con las últimas noticias y anuncios de Going Ecuador.',
};

export default function NewsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Noticias Going</h1>
          <p className="text-xl text-primary-100">
            Novedades, anuncios y actualizaciones de nuestra plataforma
          </p>
        </div>
      </section>

      {/* Feed de noticias */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-6">
          {newsPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-primary-500"
            >
              <div className="flex items-center gap-4 mb-3">
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-semibold rounded-full">
                  {post.category}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(post.date).toLocaleDateString('es-EC', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {post.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {post.excerpt}
              </p>
              <span className="text-primary-400 text-sm italic">Próximamente más detalles</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
