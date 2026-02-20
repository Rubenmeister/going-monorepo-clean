'use client';

import { useRideStore } from '@/stores/rideStore';
import { STATUS_CONFIGS } from '@/types';

/**
 * Ride status display component
 * Shows current ride status with driver info
 */
export function RideStatus() {
  const { activeRide } = useRideStore();

  if (!activeRide) {
    return null;
  }

  const config = STATUS_CONFIGS[activeRide.status];

  return (
    <div
      className={`rounded-lg p-4 ${
        config.color
      } border-2 ${config.textColor.replace('text', 'border')}`}
      data-testid="ride-status"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <p className="font-semibold">{config.label}</p>
            <p className="text-sm opacity-75">Trip ID: {activeRide.tripId}</p>
          </div>
        </div>

        {/* ETA */}
        {activeRide.status === 'accepted' && (
          <ETA minutes={5} label="Driver arriving in" />
        )}
        {activeRide.status === 'in_progress' && (
          <ETA minutes={activeRide.duration} label="ETA to destination" />
        )}
      </div>

      {/* Driver info when accepted */}
      {activeRide.driverInfo && activeRide.status !== 'pending' && (
        <DriverInfo driverInfo={activeRide.driverInfo} />
      )}
    </div>
  );
}

/**
 * ETA display component
 */
function ETA({ minutes, label }: { minutes: number; label: string }) {
  return (
    <div className="text-right">
      <p className="text-xs opacity-75">{label}</p>
      <p className="font-bold text-lg" data-testid="eta-remaining">
        ~{minutes} min
      </p>
    </div>
  );
}

/**
 * Driver info display component
 */
function DriverInfo({
  driverInfo,
}: {
  driverInfo: {
    name: string;
    rating: number;
    photo: string;
    vehicle: string;
    licensePlate: string;
  };
}) {
  return (
    <div className="mt-4 pt-4 border-t" data-testid="driver-info">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl">
            {driverInfo.photo || '👤'}
          </div>
          <div>
            <p className="font-semibold" data-testid="driver-name">
              {driverInfo.name}
            </p>
            <div className="flex items-center gap-1">
              <span>⭐</span>
              <span data-testid="driver-rating">
                {driverInfo.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right" data-testid="vehicle-info">
          <p className="text-sm font-medium">{driverInfo.vehicle}</p>
          <p className="text-xs text-gray-600">{driverInfo.licensePlate}</p>
        </div>
      </div>
    </div>
  );
}
