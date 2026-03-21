import React from 'react';

const categories = [
  { id: 1, name: 'Getting Started', icon: '🚀', count: 5 },
  { id: 2, name: 'Account & Settings', icon: '⚙️', count: 8 },
  { id: 3, name: 'Bookings & Payments', icon: '💳', count: 10 },
  { id: 4, name: 'Safety & Support', icon: '🛡️', count: 7 },
  { id: 5, name: 'Technical Help', icon: '🔧', count: 6 },
];

export const metadata = {
  title: 'Help Center - Going Platform Support',
  description: 'Get answers to your questions about the Going Platform.',
};

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <div className="max-w-2xl mx-auto">
            <input
              type="search"
              placeholder="Search for help..."
              className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-12">
          Browse Topics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl hover:shadow-lg transition-shadow cursor-pointer text-center"
            >
              <div className="text-4xl mb-3">{cat.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {cat.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {cat.count} articles
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Support */}
      <section className="bg-primary-50 dark:bg-gray-800 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Still need help?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get in touch with our support team
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors">
              Contact Support
            </button>
            <button className="px-6 py-3 border-2 border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors">
              Chat with Us
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
