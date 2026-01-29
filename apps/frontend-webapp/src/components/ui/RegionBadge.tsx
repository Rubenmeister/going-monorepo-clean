import React from 'react';
import { ECUADOR_REGIONS, EcuadorRegion } from '../../constants/ecuador-regions';

interface RegionBadgeProps {
  region: EcuadorRegion;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RegionBadge: React.FC<RegionBadgeProps> = ({ region, className = '', size = 'md' }) => {
  const regionData = ECUADOR_REGIONS[region];
  
  if (!regionData) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const getRegionStyles = (r: EcuadorRegion) => {
    switch (r) {
      case EcuadorRegion.COSTA:
        return 'bg-region-costa/20 text-text-primary border-region-costa';
      case EcuadorRegion.SIERRA:
        return 'bg-region-sierra/20 text-text-primary border-region-sierra';
      case EcuadorRegion.AMAZONIA:
        return 'bg-region-amazonia/20 text-text-primary border-region-amazonia';
      case EcuadorRegion.GALAPAGOS:
        return 'bg-region-galapagos/20 text-text-primary border-region-galapagos';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium border ${getRegionStyles(region)} ${sizeClasses[size]} ${className}`}
    >
      {regionData.label}
    </span>
  );
};
