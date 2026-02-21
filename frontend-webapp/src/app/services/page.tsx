import React from 'react';

const services = [
  {
    icon: '🚗',
    name: 'Ride',
    desc: 'Door-to-door transportation for daily commutes and trips',
    features: ['Fast pickup', 'Affordable pricing', 'Real-time tracking'],
  },
  {
    icon: '🏨',
    name: 'Accommodation',
    desc: 'Find verified hosts and comfortable places to stay',
    features: ['Verified hosts', 'Flexible booking', 'Best rates'],
  },
  {
    icon: '🗺️',
    name: 'Tours',
    desc: 'Explore destinations with local expert guides',
    features: ['Local guides', 'Custom itineraries', 'Group tours'],
  },
  {
    icon: '🎭',
    name: 'Experiences',
    desc: 'Book unique activities and memorable experiences',
    features: ['Verified experiences', 'Expert hosts', 'Reviews'],
  },
  {
    icon: '📦',
    name: 'Parcels',
    desc: 'Fast and reliable courier and parcel delivery',
    features: ['Same-day delivery', 'Tracking', 'Insurance'],
  },
  {
    icon: '💳',
    name: 'Payments',
    desc: 'Safe, secure, and convenient payment solutions',
    features: ['Multiple methods', 'Instant transfers', 'Protection'],
  },
];

export const metadata = {
  title: 'Going Services - Mobility Solutions',
  description: 'Explore all the services offered by Going Platform.',
};

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h1>
          <p className="text-xl text-primary-100">
            Everything you need for seamless mobility
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-5xl mb-4">{service.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {service.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {service.desc}
              </p>
              <ul className="space-y-2 mb-6">
                {service.features.map((feature, j) => (
                  <li
                    key={j}
                    className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                  >
                    <span className="text-primary-500">✓</span> {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors">
                Learn More
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-50 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Download the Going app and access all our services in one place.
          </p>
          <button className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors">
            Download Now
          </button>
        </div>
      </section>
    </main>
  );
}
