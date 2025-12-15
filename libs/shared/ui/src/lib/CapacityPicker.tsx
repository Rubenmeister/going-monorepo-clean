'use client';

import React from 'react';

interface CapacityPickerProps {
  value: number;
  onChange: (capacity: number) => void;
  min?: number;
  max?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function CapacityPicker({
  value,
  onChange,
  min = 1,
  max = 8,
  label = 'Pasajeros',
  disabled = false,
  className = '',
}: CapacityPickerProps) {
  const decrement = () => {
    if (value > min && !disabled) {
      onChange(value - 1);
    }
  };

  const increment = () => {
    if (value < max && !disabled) {
      onChange(value + 1);
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {label && (
        <span className="text-gray-600 font-medium">{label}</span>
      )}
      <div className="flex items-center bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={decrement}
          disabled={disabled || value <= min}
          className={`
            w-10 h-10 flex items-center justify-center text-lg font-medium transition
            ${value <= min || disabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
            }
          `}
        >
          −
        </button>
        <div className="w-12 h-10 flex items-center justify-center border-x border-gray-200">
          <span className="text-lg font-semibold text-gray-900">{value}</span>
        </div>
        <button
          onClick={increment}
          disabled={disabled || value >= max}
          className={`
            w-10 h-10 flex items-center justify-center text-lg font-medium transition
            ${value >= max || disabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
            }
          `}
        >
          +
        </button>
      </div>
      <span className="text-sm text-gray-400">
        {value === 1 ? 'persona' : 'personas'}
      </span>
    </div>
  );
}

export default CapacityPicker;
