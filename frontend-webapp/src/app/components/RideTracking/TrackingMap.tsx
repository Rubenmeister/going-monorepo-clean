'use client';

import { useRideStore } from '@/app/stores/rideStore';

export function TrackingMap() {
  const { activeRide } = useRideStore();

  if (!activeRide) {
    return null;
  }

  // Simple text-based map visualization
  const lat1 = activeRide.pickup.lat;
  const lon1 = activeRide.pickup.lon;
  const lat2 = activeRide.dropoff.lat;
  const lon2 = activeRide.dropoff.lon;
  const driverLat = activeRide.driverLocation?.lat || lat1;
  const driverLon = activeRide.driverLocation?.lon || lon1;

  return (
    <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg p-6 mb-6 relative h-64 overflow-hidden">
      {/* Map placeholder - In production, use Mapbox/Google Maps */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 300"
        className="absolute inset-0"
      >
        {/* Grid background */}
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e0e7ff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill="url(#grid)" />

        {/* Pickup location */}
        <circle
          cx="50"
          cy="80"
          r="8"
          fill="#10b981"
          opacity="0.8"
        />
        <text x="65" y="85" fontSize="12" fill="#1f2937">
          Pickup
        </text>

        {/* Dropoff location */}
        <circle
          cx="350"
          cy="220"
          r="8"
          fill="#ef4444"
          opacity="0.8"
        />
        <text x="280" y="225" fontSize="12" fill="#1f2937">
          Dropoff
        </text>

        {/* Route line */}
        <line
          x1="50"
          y1="80"
          x2="350"
          y2="220"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.6"
        />

        {/* Driver location (animated) */}
        <circle
          cx="200"
          cy="150"
          r="10"
          fill="#ff6b35"
          opacity="0.9"
        />
        <circle
          cx="200"
          cy="150"
          r="10"
          fill="none"
          stroke="#ff6b35"
          strokeWidth="2"
          opacity="0.5"
        >
          <animate
            attributeName="r"
            from="10"
            to="20"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            from="0.5"
            to="0"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        <text x="220" y="155" fontSize="12" fill="#1f2937" fontWeight="bold">
          🚗 Driver
        </text>
      </svg>

      {/* Map info overlay */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-md z-10">
        <p className="text-xs font-semibold text-gray-700">
          Distance: {activeRide.distance.toFixed(1)} km
        </p>
        <p className="text-xs text-gray-600">Duration: ~{activeRide.duration} min</p>
      </div>

      <div data-testid="live-tracking-map" className="hidden">
        Map component
      </div>
    </div>
  );
}
