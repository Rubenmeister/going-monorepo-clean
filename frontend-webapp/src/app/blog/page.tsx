import React from 'react';
import Link from 'next/link';

// Datos de blog — se reemplazarán con la API
const blogPosts = [
  {
    id: 1,
    slug: 'consejos-conduccion-segura',
    title: 'Los 10 mejores consejos para conducir con seguridad en Going',
    excerpt:
      'Aprende las prácticas esenciales de seguridad que te protegerán a ti y a tus pasajeros en cada viaje.',
    author: 'María Santos',
    date: '2026-02-15',
    category: 'Popular',
    readTime: 8,
  },
  {
    id: 2,
    slug: 'maximiza-ganancias-conductor',
    title: 'Cómo maximizar tus ganancias como conductora o conductor',
    excerpt:
      'Descubre estrategias probadas para aumentar tus ingresos y optimizar tu horario de manejo.',
    author: 'Carlos López',
    date: '2026-02-12',
    category: 'Consejos',
    readTime: 6,
  },
  {
    id: 3,
    slug: 'guia-nuevos-pasajeros',
    title: 'Todo lo que necesitas saber como nuevo pasajero',
    excerpt:
      'Una guía completa para ayudar a los nuevos usuarios a sacarle el máximo provecho a Going.',
    author: 'Ana García',
    date: '2026-02-10',
    category: 'Popular',
    readTime: 10,
  },
];

export const metadata = {
  title: 'Blog Going — Consejos e Historias',
  description:
    'Lee los últimos consejos, historias e ideas de la comunidad Going Ecuador.',
};

export default function BlogPage() {
  const categories = ['Todos', 'Popular', 'Consejos', 'Noticias', 'Comunidad'];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Blog Going
          </h1>
          <p className="text-lg md:text-xl text-primary-100">
            Consejos, historias e ideas de nuestra comunidad
          </p>
        </div>
      </section>

      {/* Filtro por categoría */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  category === 'Todos'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Artículos */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="h-48 bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center">
                <span className="text-white text-5xl">✍️</span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-semibold rounded-full">
                    {post.category}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {post.readTime} min de lectura
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold">
                      {post.author[0]}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {post.author}
                    </span>
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-primary-500 hover:text-primary-600 text-sm font-semibold"
                  >
                    Leer más →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA — contribuir al blog */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            ¿Tienes algo que compartir con la comunidad?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Comparte tu historia como conductora, conductor, anfitrión o viajero Going.
          </p>
          <Link
            href="/contact"
            className="bg-primary-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
          >
            Contáctanos →
          </Link>
        </div>
      </section>
    </main>
  );
}
