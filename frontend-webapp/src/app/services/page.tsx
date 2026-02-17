export default function ServicesPage() {
  const services = [
    {
      title: 'Transport',
      icon: '🚗',
      description: 'Fast and reliable transportation services',
      features: ['Real-time tracking', 'Safe drivers', 'Affordable pricing'],
    },
    {
      title: 'Tours',
      icon: '🎫',
      description: 'Explore Ecuador with guided tours',
      features: ['Expert guides', 'Small groups', 'Flexible scheduling'],
    },
    {
      title: 'Accommodation',
      icon: '🏠',
      description: 'Comfortable places to stay',
      features: ['Verified hosts', 'Best prices', 'Instant booking'],
    },
    {
      title: 'Shipping',
      icon: '📦',
      description: 'Quick and safe parcel delivery',
      features: ['Door-to-door', 'Insured', 'GPS tracking'],
    },
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-going-primary mb-2">
          Our Services
        </h1>
        <p className="text-gray-600 mb-12">
          Discover all the services available on the Going platform
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow p-8 border border-gray-200"
            >
              <div className="text-5xl mb-4">{service.icon}</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {service.title}
              </h2>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <ul className="space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center text-gray-700">
                    <span className="text-going-primary mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="mt-6 w-full px-4 py-2 bg-going-primary text-white rounded-lg hover:bg-going-dark transition-colors font-medium">
                Learn More
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
