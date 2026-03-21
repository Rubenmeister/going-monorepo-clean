import React from 'react';
import Link from 'next/link';

const newsPosts = [
  {
    id: 1,
    title: 'Going Expands Operations to South America',
    date: '2026-02-18',
    category: 'Expansion',
    excerpt: 'Launching in 15 new cities across Brazil, Argentina, and Chile.',
  },
  {
    id: 2,
    title: 'New AI Safety Features Launch',
    date: '2026-02-15',
    category: 'Product',
    excerpt: 'Introducing advanced safety detection and real-time monitoring.',
  },
  {
    id: 3,
    title: 'Platform Reaches 1 Million Drivers',
    date: '2026-02-10',
    category: 'Milestone',
    excerpt: 'A celebration of our fastest-growing milestone achievement.',
  },
];

export const metadata = {
  title: 'Going News & Updates',
  description: 'Stay updated with the latest news from Going Platform.',
};

export default function NewsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Latest News</h1>
          <p className="text-xl text-primary-100">
            Stay updated with Company announcements and milestones
          </p>
        </div>
      </section>

      {/* News Feed */}
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
                  {new Date(post.date).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {post.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {post.excerpt}
              </p>
              <Link
                href="#"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-semibold"
              >
                Read full story →
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
