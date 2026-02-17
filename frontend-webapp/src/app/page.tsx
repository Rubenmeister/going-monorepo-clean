'use client';

import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import Link from 'next/link';

export default function DashboardPage() {
  const { auth, domain } = useMonorepoApp();

  const handleTestLogin = () => {
    domain.auth.login({ email: 'user@test.com', password: 'password123' });
  };

  const handleTestTrip = () => {
    if (auth.user) {
      domain.transport.requestTrip({
        userId: auth.user.id,
        origin: {
          address: 'Quito',
          city: 'Quito',
          country: 'EC',
          latitude: -0.18,
          longitude: -78.47,
        },
        destination: {
          address: 'Guayaquil',
          city: 'Guayaquil',
          country: 'EC',
          latitude: -2.18,
          longitude: -79.88,
        },
        price: { amount: 5000, currency: 'USD' },
      });
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-going-primary mb-2">
            Welcome to Going
          </h1>
          <p className="text-gray-600">
            Your all-in-one platform for transport, tours, and accommodation
          </p>
        </div>

        {/* Auth Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border-l-4 border-going-primary">
          {auth.isLoading && (
            <p className="text-gray-600">Loading your session...</p>
          )}
          {auth.error && (
            <p className="text-going-danger font-semibold">
              Authentication Error: {auth.error}
            </p>
          )}

          {auth.user ? (
            <div className="space-y-4">
              <div>
                <p className="text-xl font-semibold text-gray-800">
                  ¡Bienvenido, {auth.user.firstName}!
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Roles: {auth.user.roles.join(', ')}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleTestTrip}
                  className="px-4 py-2 bg-going-primary text-white rounded-lg hover:bg-going-dark transition-colors"
                >
                  Request a Trip
                </button>
                <button
                  onClick={auth.logout}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">You are currently logged out</p>
              <button
                onClick={handleTestLogin}
                className="px-4 py-2 bg-going-primary text-white rounded-lg hover:bg-going-dark transition-colors"
              >
                Login (Test)
              </button>
            </div>
          )}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ServiceCard
            title="Services"
            description="Explore our range of services"
            icon="🚗"
            href="/services"
          />
          <ServiceCard
            title="Account"
            description="Manage your profile and settings"
            icon="👤"
            href="/account"
          />
          <ServiceCard
            title="Going Academy"
            description="Learn and grow with us"
            icon="📚"
            href="/academy"
          />
          <ServiceCard
            title="SOS"
            description="Emergency assistance available 24/7"
            icon="🚨"
            href="/sos"
          />
        </div>
      </div>
    </div>
  );
}

function ServiceCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-going-primary cursor-pointer h-full">
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}