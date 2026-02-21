'use client';

import { useState } from 'react';
import { useRideStore, type Location, type Ride } from '@/stores/rideStore';
import { LocationSelector } from './LocationSelector';

interface RideRequestFormProps {
  onRideCreated?: (ride: Ride) => void;
}

export function RideRequestForm({ onRideCreated }: RideRequestFormProps) {
  const {
    pickupLocation,
    dropoffLocation,
    estimatedFare,
    loading,
    error,
    setPickupLocation,
    setDropoffLocation,
    setEstimatedFare,
    createRide,
    setLoading,
    setError,
  } = useRideStore();

  const [selectedRideType, setSelectedRideType] = useState<
    'economy' | 'comfort' | 'premium'
  >('economy');

  // Calculate fare based on distance
  const calculateFare = (pickup: Location, dropoff: Location) => {
    const distance =
      Math.sqrt(
        Math.pow(dropoff.lat - pickup.lat, 2) +
          Math.pow(dropoff.lon - pickup.lon, 2)
      ) * 111; // Rough conversion to km

    const baseFare = 2.5;
    const perKm = 0.5;
    const perMin = 0.1;

    // Estimate 2.5 min per km
    const estimatedMinutes = distance * 2.5;
    const fare = baseFare + distance * perKm + estimatedMinutes * perMin;

    // Apply surge pricing (mock: 1.5x during peak hours)
    const hour = new Date().getHours();
    const isPeakHour = (hour >= 8 && hour <= 9) || (hour >= 17 && hour <= 19);
    const multiplier = isPeakHour ? 1.5 : 1;

    return Math.round(fare * multiplier * 100) / 100;
  };

  const handlePickupChange = (location: Location) => {
    setPickupLocation(location);
    if (dropoffLocation) {
      const fare = calculateFare(location, dropoffLocation);
      setEstimatedFare(fare);
    }
  };

  const handleDropoffChange = (location: Location) => {
    setDropoffLocation(location);
    if (pickupLocation) {
      const fare = calculateFare(pickupLocation, location);
      setEstimatedFare(fare);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pickupLocation || !dropoffLocation || !estimatedFare) {
      setError('Please select both pickup and dropoff locations');
      return;
    }

    try {
      setLoading(true);

      // Mock API call
      const newRide: Ride = {
        tripId: `trip-${Date.now()}`,
        passengerId: 'passenger-001',
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        estimatedFare,
        distance:
          Math.sqrt(
            Math.pow(dropoffLocation.lat - pickupLocation.lat, 2) +
              Math.pow(dropoffLocation.lon - pickupLocation.lon, 2)
          ) * 111,
        duration: Math.round(
          Math.sqrt(
            Math.pow(dropoffLocation.lat - pickupLocation.lat, 2) +
              Math.pow(dropoffLocation.lon - pickupLocation.lon, 2)
          ) *
            111 *
            2.5
        ),
        status: 'pending',
        createdAt: new Date(),
      };

      createRide(newRide);
      onRideCreated?.(newRide);
    } catch (err) {
      setError('Failed to create ride. Please try again.');
    } finally {
      setLoading(false);
    }
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
          onChange={handlePickupChange}
          placeholder="Where are you?"
        />

        <LocationSelector
          type="dropoff"
          value={dropoffLocation || undefined}
          onChange={handleDropoffChange}
          placeholder="Where to?"
        />

        {/* Ride type selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose ride type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['economy', 'comfort', 'premium'] as const).map((type) => (
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
                <p className="font-semibold text-gray-800 capitalize">{type}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {type === 'economy' && '🚗'}
                  {type === 'comfort' && '🚙'}
                  {type === 'premium' && '🚘'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Fare estimate */}
        {estimatedFare && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Estimated fare</p>
                <p className="text-3xl font-bold text-going-primary">
                  ${estimatedFare}
                </p>
              </div>
              <div className="text-right text-sm text-gray-600">
                {dropoffLocation && pickupLocation && (
                  <>
                    <p>
                      {Math.round(
                        Math.sqrt(
                          Math.pow(
                            dropoffLocation.lat - pickupLocation.lat,
                            2
                          ) +
                            Math.pow(
                              dropoffLocation.lon - pickupLocation.lon,
                              2
                            )
                        ) * 111
                      )}{' '}
                      km
                    </p>
                    <p>
                      ~
                      {Math.round(
                        Math.sqrt(
                          Math.pow(
                            dropoffLocation.lat - pickupLocation.lat,
                            2
                          ) +
                            Math.pow(
                              dropoffLocation.lon - pickupLocation.lon,
                              2
                            )
                        ) *
                          111 *
                          2.5
                      )}{' '}
                      min
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Peak hour indicator */}
            {new Date().getHours() >= 8 && new Date().getHours() <= 9 && (
              <p className="text-xs text-yellow-600 mt-2">
                ⚠️ Peak hours - 1.5x surge pricing applied
              </p>
            )}
          </div>
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

      {/* Trip ID display */}
      {/* This will be shown in parent component after ride creation */}
    </form>
  );
}
