'use client';

import { useRideStore } from '@/app/stores/rideStore';

export function RideStatus() {
  const { activeRide } = useRideStore();

  if (!activeRide) {
    return null;
  }

  const statusConfig = {
    pending: {
      icon: '🔍',
      label: 'Finding driver',
      color: 'bg-blue-100',
      textColor: 'text-blue-800',
    },
    accepted: {
      icon: '👤',
      label: 'Driver accepted',
      color: 'bg-purple-100',
      textColor: 'text-purple-800',
    },
    in_progress: {
      icon: '🚗',
      label: 'On the way',
      color: 'bg-orange-100',
      textColor: 'text-orange-800',
    },
    completed: {
      icon: '✅',
      label: 'Ride completed',
      color: 'bg-green-100',
      textColor: 'text-green-800',
    },
    cancelled: {
      icon: '❌',
      label: 'Cancelled',
      color: 'bg-red-100',
      textColor: 'text-red-800',
    },
  };

  const config = statusConfig[activeRide.status];

  return (
    <div
      className={`rounded-lg p-4 ${config.color} border-2 ${config.textColor.replace('text', 'border')}`}
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
          <div className="text-right">
            <p className="text-xs opacity-75">Driver arriving in</p>
            <p className="font-bold text-lg" data-testid="eta-remaining">
              ~5 min
            </p>
          </div>
        )}

        {activeRide.status === 'in_progress' && (
          <div className="text-right">
            <p className="text-xs opacity-75">ETA to destination</p>
            <p className="font-bold text-lg" data-testid="eta-remaining">
              ~{activeRide.duration} min
            </p>
          </div>
        )}
      </div>

      {/* Driver info when accepted */}
      {activeRide.driverInfo && activeRide.status !== 'pending' && (
        <div className="mt-4 pt-4 border-t" data-testid="driver-info">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl">
                {activeRide.driverInfo.photo || '👤'}
              </div>
              <div>
                <p className="font-semibold" data-testid="driver-name">
                  {activeRide.driverInfo.name}
                </p>
                <div className="flex items-center gap-1">
                  <span>⭐</span>
                  <span data-testid="driver-rating">
                    {activeRide.driverInfo.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right" data-testid="vehicle-info">
              <p className="text-sm font-medium">{activeRide.driverInfo.vehicle}</p>
              <p className="text-xs text-gray-600">
                {activeRide.driverInfo.licensePlate}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
