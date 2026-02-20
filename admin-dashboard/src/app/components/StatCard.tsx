/**
 * StatCard component - Display metrics and statistics
 */

import React from 'react';
import { Card, CardBody } from '@going-monorepo-clean/shared-ui';

interface StatCardProps {
  icon?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const colorStyles = {
  primary: 'bg-blue-50 border-l-blue-500',
  success: 'bg-green-50 border-l-green-500',
  warning: 'bg-yellow-50 border-l-yellow-500',
  error: 'bg-red-50 border-l-red-500',
  info: 'bg-cyan-50 border-l-cyan-500',
};

const textColorStyles = {
  primary: 'text-blue-900',
  success: 'text-green-900',
  warning: 'text-yellow-900',
  error: 'text-red-900',
  info: 'text-cyan-900',
};

/**
 * Stat card for displaying key metrics
 * @example
 * <StatCard
 *   icon="👥"
 *   title="Total Users"
 *   value={1234}
 *   subtitle="Active users"
 *   trend={{ direction: 'up', percentage: 12 }}
 *   color="success"
 * />
 */
export function StatCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  color = 'primary',
}: StatCardProps) {
  return (
    <Card
      className={`
        border-l-4
        ${colorStyles[color]}
      `}
      shadow="sm"
    >
      <CardBody className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${textColorStyles[color]}`}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
        </div>

        {icon && <div className="text-4xl ml-4 opacity-50">{icon}</div>}
      </CardBody>

      {trend && (
        <div className="px-6 py-2 border-t border-gray-200 bg-opacity-50">
          <span
            className={`
              text-sm font-semibold
              ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}
            `}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.percentage}%
          </span>
        </div>
      )}
    </Card>
  );
}
