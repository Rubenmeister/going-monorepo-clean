import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Going Platform - Mobility & Services',
  description:
    'Book rides, find accommodation, book tours, and more on one platform.',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-500 via-primary-400 to-accent-500 text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Your Complete Mobility Solution
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8">
              Book rides, find accommodation, explore tours, and more — all in
              one platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-primary-600 font-bold rounded-lg hover:bg-gray-100 transition-colors">
                Get Started
              </button>
              <button className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-primary-600 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Animated background shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -ml-48 -mb-48" />
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
          Our Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: '🚗', name: 'Ride', desc: 'Fast & affordable rides' },
            {
              icon: '🏨',
              name: 'Accommodation',
              desc: 'Verified hosts & places',
            },
            { icon: '🗺️', name: 'Tours', desc: 'Explore with local guides' },
            { icon: '🎭', name: 'Experiences', desc: 'Unique activities' },
            { icon: '📦', name: 'Parcels', desc: 'Quick delivery' },
            { icon: '💳', name: 'Payments', desc: 'Safe & secure' },
          ].map((service, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-center group"
            >
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                {service.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {service.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary-50 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '50+', label: 'Countries' },
              { number: '1M+', label: 'Drivers' },
              { number: '100M+', label: 'Rides Completed' },
              { number: '10M+', label: 'Active Users' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
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

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              num: '1',
              title: 'Download App',
              desc: 'Get Going on iOS or Android',
            },
            {
              num: '2',
              title: 'Sign Up',
              desc: 'Create your account in seconds',
            },
            {
              num: '3',
              title: 'Browse',
              desc: 'Explore all available services',
            },
            { num: '4', title: 'Book', desc: 'Book and enjoy your experience' },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white font-bold text-2xl rounded-full flex items-center justify-center mx-auto mb-4">
                {step.num}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            What Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'John Doe',
                role: 'Driver',
                msg: 'Increased my income by 40%!',
              },
              {
                name: 'Jane Smith',
                role: 'Rider',
                msg: 'Most reliable service I use',
              },
              {
                name: 'Carlos López',
                role: 'Host',
                msg: 'Great platform for my business',
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white dark:bg-gray-700 p-8 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary-200 dark:bg-primary-900 flex items-center justify-center">
                    👤
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic">
                  "{testimonial.msg}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-primary-100 mb-8">
            Join millions of users experiencing the future of mobility
          </p>
          <button className="px-8 py-4 bg-white text-primary-600 font-bold rounded-lg hover:bg-gray-100 transition-colors">
            Download the App Today
          </button>
        </div>
      </section>

      {/* Quick Links */}
      <section className="container mx-auto px-4 py-12 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { title: 'Blog', href: '/blog' },
            { title: 'Academy', href: '/academy' },
            { title: 'Community', href: '/community' },
            { title: 'Help', href: '/help' },
          ].map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-semibold transition-colors"
            >
              {link.title}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
