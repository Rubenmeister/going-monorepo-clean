import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Blog Post - Going Platform',
  description: 'Read the latest article from Going Platform blog.',
};

export default function BlogPostPage() {
  const post = {
    title: 'Top 10 Tips for Safe Driving on Going Platform',
    author: 'Maria Santos',
    date: '2026-02-15',
    readTime: 8,
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            href="/blog"
            className="text-primary-100 hover:text-white mb-4 inline-block"
          >
            ← Back
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-primary-100">
            <span>{post.author}</span>
            <span>•</span>
            <span>{new Date(post.date).toLocaleDateString()}</span>
            <span>•</span>
            <span>{post.readTime} min</span>
          </div>
        </div>
      </div>

      <article className="container mx-auto px-4 py-12 max-w-3xl">
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Article content here...
        </p>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-200 dark:bg-primary-900 flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {post.author}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Writer at Going
              </p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
