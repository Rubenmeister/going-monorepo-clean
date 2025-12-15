'use client';

import React from 'react';

export type ServiceType = 'private' | 'shared' | 'shipment';

interface ServiceSwitcherProps {
  value: ServiceType;
  onChange: (service: ServiceType) => void;
  disabled?: boolean;
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const services: { type: ServiceType; icon: string; label: string; description: string }[] = [
  { type: 'private', icon: '🚗', label: 'Privado', description: 'Solo para ti' },
  { type: 'shared', icon: '🚐', label: 'Compartido', description: 'Comparte y ahorra' },
  { type: 'shipment', icon: '📦', label: 'Envío', description: 'Paquetes y documentos' },
];

export function ServiceSwitcher({
  value,
  onChange,
  disabled = false,
  className = '',
  showLabels = true,
  size = 'md',
}: ServiceSwitcherProps) {
  const sizeClasses = {
    sm: 'p-2 text-xs gap-1',
    md: 'p-3 text-sm gap-2',
    lg: 'p-4 text-base gap-3',
  };

  const iconSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {services.map((service) => {
        const isActive = value === service.type;
        return (
          <button
            key={service.type}
            onClick={() => !disabled && onChange(service.type)}
            disabled={disabled}
            className={`
              flex-1 flex flex-col items-center justify-center rounded-xl border-2 transition-all
              ${sizeClasses[size]}
              ${isActive 
                ? 'border-going-red bg-going-red/5 text-going-red' 
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={service.description}
          >
            <span className={iconSizes[size]}>{service.icon}</span>
            {showLabels && (
              <>
                <span className="font-medium mt-1">{service.label}</span>
                {size === 'lg' && (
                  <span className="text-xs text-gray-400 mt-0.5">{service.description}</span>
                )}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ServiceSwitcher;
