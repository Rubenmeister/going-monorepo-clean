'use client';

import { useState } from 'react';
import { Location } from '@/app/stores/rideStore';

interface LocationSelectorProps {
  type: 'pickup' | 'dropoff';
  value?: Location;
  onChange: (location: Location) => void;
  placeholder?: string;
}

export function LocationSelector({
  type,
  value,
  onChange,
  placeholder = `Select ${type} location`,
}: LocationSelectorProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Mock location suggestions
  const mockLocations: Record<string, Location[]> = {
    'times': [
      {
        address: 'Times Square, New York',
        lat: 40.758,
        lon: -73.9855,
        city: 'New York',
      },
    ],
    'central': [
      {
        address: 'Central Park, New York',
        lat: 40.7829,
        lon: -73.9654,
        city: 'New York',
      },
    ],
    'empire': [
      {
        address: 'Empire State Building, New York',
        lat: 40.7484,
        lon: -73.9857,
        city: 'New York',
      },
    ],
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Find matching suggestions
    const matches = Object.values(mockLocations)
      .flat()
      .filter((loc) =>
        loc.address.toLowerCase().includes(value.toLowerCase())
      );

    setSuggestions(matches);
    setShowSuggestions(true);
  };

  const handleSelectLocation = (location: Location) => {
    onChange(location);
    setInput(location.address);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {type === 'pickup' ? '📍 Pickup' : '📍 Dropoff'}
      </label>
      <div className="relative">
        <input
          type="text"
          value={input || value?.address || ''}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-going-primary focus:border-transparent outline-none transition"
          data-testid={`${type}-location-input`}
        />

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
            {suggestions.map((location, index) => (
              <button
                key={index}
                onClick={() => handleSelectLocation(location)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition"
                data-testid={`location-suggestion-${index}`}
              >
                <p className="font-medium text-gray-800">{location.address}</p>
                <p className="text-sm text-gray-500">
                  {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {value && (
        <p className="mt-2 text-xs text-gray-500">
          {value.lat.toFixed(4)}, {value.lon.toFixed(4)}
        </p>
      )}
    </div>
  );
}
