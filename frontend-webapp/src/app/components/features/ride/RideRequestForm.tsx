'use client';

import { useState } from 'react';
import { useRideService } from '@/hooks/features/useRideService';
import { LocationSelector } from './LocationSelector';
import type { RideType } from '@/types';
import { RIDE_TYPES } from '@/types';

/**
 * Form for requesting a ride
 * Handles location selection, ride type, and ride creation
 */
export function RideRequestForm() {
  const [selectedRideType, setSelectedRideType] = useState<RideType>('economy');

  const {
    pickupLocation,
    dropoffLocation,
    estimatedFare,
    loading,
    error,
    setPickupLocation,
    setDropoffLocation,
    createRide,
  } = useRideService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pickupLocation || !dropoffLocation) {
      return;
    }

    await createRide(selectedRideType);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Request a Ride</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Location selectors */}
        <LocationSelector
          type="pickup"
          value={pickupLocation || undefined}
          onChange={setPickupLocation}
          placeholder="Where are you?"
        />

        <LocationSelector
          type="dropoff"
          value={dropoffLocation || undefined}
          onChange={setDropoffLocation}
          placeholder="Where to?"
        />

        {/* Ride type selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose ride type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(
              Object.entries(RIDE_TYPES) as Array<
                [RideType, (typeof RIDE_TYPES)[RideType]]
              >
            ).map(([type, { label, emoji }]) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedRideType(type)}
                className={`p-3 rounded-lg border-2 transition ${
                  selectedRideType === type
                    ? 'border-going-primary bg-going-primary bg-opacity-10'
                    : 'border-gray-300 hover:border-going-primary'
                }`}
              >
                <p className="font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-500 mt-1">{emoji}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Fare estimate */}
        {estimatedFare && pickupLocation && dropoffLocation && (
          <FareEstimate
            fare={estimatedFare}
            pickup={pickupLocation}
            dropoff={dropoffLocation}
          />
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!pickupLocation || !dropoffLocation || loading}
          className="w-full bg-going-primary text-white py-3 rounded-lg font-semibold hover:bg-going-dark disabled:bg-gray-400 transition"
          data-testid="confirm-ride-button"
        >
          {loading ? 'Creating ride...' : 'Confirm Ride'}
        </button>
      </div>
    </form>
  );
}

/**
 * Sub-component to display fare estimate
 */
interface FareEstimateProps {
  fare: number;
  pickup: { lat: number; lon: number };
  dropoff: { lat: number; lon: number };
}

function FareEstimate({ fare, pickup, dropoff }: FareEstimateProps) {
  const distance = Math.round(
    Math.sqrt(
      Math.pow(dropoff.lat - pickup.lat, 2) +
        Math.pow(dropoff.lon - pickup.lon, 2)
    ) * 111
  );
  const duration = Math.round(distance * 2.5);

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">Estimated fare</p>
          <p className="text-3xl font-bold text-going-primary">${fare}</p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p>{distance} km</p>
          <p>~{duration} min</p>
        </div>
      </div>
    </div>
  );
}
