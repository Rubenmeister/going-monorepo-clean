'use client';

import React from 'react';

interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  comingSoon?: boolean;
  className?: string;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  comingSoon = false,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {/* Icon */}
      <div className="mb-4">
        {typeof icon === 'string' ? (
          <span className="text-5xl">{icon}</span>
        ) : (
          icon
        )}
      </div>

      {/* Coming Soon Badge */}
      {comingSoon && (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-going-yellow/20 text-going-yellow-dark text-xs font-medium mb-3">
          🚀 Próximamente
        </span>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className={`
            inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition
            ${action.variant === 'secondary'
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-going-red text-white hover:bg-going-red-dark'
            }
          `}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Preset empty states for common scenarios
export function EmptyStateNoTrips() {
  return (
    <EmptyState
      icon="🚗"
      title="Sin viajes aún"
      description="Cuando solicites tu primer viaje, aparecerá aquí."
      action={{ label: 'Solicitar viaje', onClick: () => window.location.href = '/c/ride/new' }}
    />
  );
}

export function EmptyStateNoShipments() {
  return (
    <EmptyState
      icon="📦"
      title="Sin envíos aún"
      description="Tus envíos de paquetes aparecerán aquí."
      action={{ label: 'Enviar paquete', onClick: () => window.location.href = '/c/shipment/new' }}
    />
  );
}

export function EmptyStateComingSoon({ title, feature }: { title: string; feature: string }) {
  return (
    <EmptyState
      icon="🇪🇨"
      title={title}
      description={`${feature} estará disponible pronto en Ecuador. ¡Mantente atento!`}
      comingSoon={true}
    />
  );
}

export default EmptyState;
