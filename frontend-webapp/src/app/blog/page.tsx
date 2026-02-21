import React from 'react';
import Link from 'next/link';

// Mock blog data - will be replaced with API
const blogPosts = [
  {
    id: 1,
    slug: 'safe-driving-tips',
    title: 'Top 10 Tips for Safe Driving on Going Platform',
    excerpt:
      'Learn essential safety practices that will keep you and your passengers safe on every ride.',
    author: 'Maria Santos',
    date: '2026-02-15',
    category: 'Popular',
    readTime: 8,
  },
  {
    id: 2,
    slug: 'maximize-driver-earnings',
    title: 'How to Maximize Your Earnings as a Driver',
    excerpt:
      'Discover proven strategies to increase your income and optimize your driving schedule.',
    author: 'Carlos López',
    date: '2026-02-12',
    category: 'Tips',
    readTime: 6,
  },
  {
    id: 3,
    slug: 'first-time-riders',
    title: 'Everything First-Time Riders Need to Know',
    excerpt:
      'A comprehensive guide to help new users get the most out of the Going platform.',
    author: 'Ana García',
    date: '2026-02-10',
    category: 'Popular',
    readTime: 10,
  },
];

export const metadata = {
  title: 'Going Platform Blog - Tips & Insights',
  description:
    'Read the latest tips, stories, and insights from the Going community.',
};

export default function BlogPage() {
  const categories = ['All', 'Popular', 'Tips', 'News', 'Community'];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Going Platform Blog
          </h1>
          <p className="text-lg md:text-xl text-primary-100">
            Tips, stories, and insights from our community
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  category === 'All'
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

      {/* Blog Posts Grid */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Image Placeholder */}
              <div className="relative h-48 bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center">
                <span className="text-4xl">📝</span>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900 px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {post.readTime} min
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <p className="font-medium">{post.author}</p>
                    <p>{new Date(post.date).toLocaleDateString()}</p>
                  </div>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-semibold text-sm"
                  >
                    Read →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors">
            Load More Articles
          </button>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-primary-50 dark:bg-gray-800 py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Stay Updated
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Get the latest tips delivered to your inbox every week.
          </p>
          <form className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
