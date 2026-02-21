import React from 'react';

export const metadata = {
  title: 'About Going Platform',
  description: 'Learn about the Going Platform mission, vision, and impact.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Going</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Transforming mobility and creating opportunities for millions
            worldwide
          </p>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-primary-50 dark:bg-gray-800 p-8 rounded-xl">
            <h3 className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-3">
              🎯 Mission
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              To provide reliable, safe, and affordable mobility for everyone.
            </p>
          </div>
          <div className="bg-accent-50 dark:bg-gray-800 p-8 rounded-xl">
            <h3 className="text-2xl font-bold text-accent-600 dark:text-accent-400 mb-3">
              🌍 Vision
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              A world where mobility empowers communities and creates unlimited
              opportunities.
            </p>
          </div>
          <div className="bg-green-50 dark:bg-gray-800 p-8 rounded-xl">
            <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-3">
              💚 Impact
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Serving millions, creating jobs, and building sustainable
              communities.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: '50+', label: 'Countries' },
              { number: '1M+', label: 'Drivers' },
              { number: '100M+', label: 'Rides' },
              { number: '10M+', label: 'Users' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-primary-500 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
