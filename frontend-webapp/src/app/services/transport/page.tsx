'use client';

import Link from 'next/link';

export default function TransportPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Transport</h1>
          <p className="text-xl text-gray-600">
            Explore our transport options for your trips
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Transport Options
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Link href="/ride" className="block border-2 border-blue-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all">
              <h3 className="text-2xl font-bold text-blue-600 mb-3">🚕 Ride-Hailing</h3>
              <p className="text-gray-600 mb-3">Book a private ride to your destination with our driver network</p>
              <span className="text-sm text-blue-600 font-medium">Book now →</span>
            </Link>

            <div className="border-2 border-gray-200 rounded-lg p-6 opacity-60">
              <h3 className="text-2xl font-bold text-gray-500 mb-3">✈️ Flights</h3>
              <p className="text-gray-500">Book domestic and international flights — coming soon</p>
            </div>

            <div className="border-2 border-gray-200 rounded-lg p-6 opacity-60">
              <h3 className="text-2xl font-bold text-gray-500 mb-3">🚌 Buses</h3>
              <p className="text-gray-500">Travel comfortably by bus between cities — coming soon</p>
            </div>

            <div className="border-2 border-gray-200 rounded-lg p-6 opacity-60">
              <h3 className="text-2xl font-bold text-gray-500 mb-3">🚗 Car Rentals</h3>
              <p className="text-gray-500">Rent vehicles to explore at your own pace — coming soon</p>
            </div>
          </div>
        </div>

        <Link
          href="/ride"
          className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
        >
          Book a Ride Now
        </Link>
      </div>
    </div>
  );
}
