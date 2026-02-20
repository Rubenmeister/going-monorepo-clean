'use client';

import { useRideStore } from '@/stores/rideStore';

/**
 * Ride tracking map component
 * Displays pickup, dropoff, and driver location on a map
 * TODO: Replace with real mapping library (Google Maps, Mapbox, etc.)
 */
export function TrackingMap() {
  const { activeRide } = useRideStore();

  if (!activeRide) {
    return null;
  }

  return (
    <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg p-6 mb-6 relative h-64 overflow-hidden">
      {/* Map visualization - currently using SVG, TODO: integrate real maps API */}
      <MapSVG
        pickup={activeRide.pickup}
        dropoff={activeRide.dropoff}
        driverLocation={activeRide.driverLocation}
      />

      {/* Map info overlay */}
      <MapInfo distance={activeRide.distance} duration={activeRide.duration} />

      <div data-testid="live-tracking-map" className="hidden">
        Map component
      </div>
    </div>
  );
}

/**
 * Map visualization component
 */
function MapSVG({
  pickup,
  dropoff,
  driverLocation,
}: {
  pickup: { lat: number; lon: number };
  dropoff: { lat: number; lon: number };
  driverLocation: { lat: number; lon: number } | undefined;
}) {
  const driverLat = driverLocation?.lat || pickup.lat;
  const driverLon = driverLocation?.lon || pickup.lon;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 400 300"
      className="absolute inset-0"
    >
      {/* Grid background */}
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="#e0e7ff"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="400" height="300" fill="url(#grid)" />

      {/* Pickup location */}
      <circle cx="50" cy="80" r="8" fill="#10b981" opacity="0.8" />
      <text x="65" y="85" fontSize="12" fill="#1f2937">
        Pickup
      </text>

      {/* Dropoff location */}
      <circle cx="350" cy="220" r="8" fill="#ef4444" opacity="0.8" />
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
      <circle cx="200" cy="150" r="10" fill="#ff6b35" opacity="0.9" />
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
  );
}

/**
 * Map info overlay
 */
function MapInfo({
  distance,
  duration,
}: {
  distance: number;
  duration: number;
}) {
  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-md z-10">
      <p className="text-xs font-semibold text-gray-700">
        Distance: {distance.toFixed(1)} km
      </p>
      <p className="text-xs text-gray-600">Duration: ~{duration} min</p>
    </div>
  );
}
