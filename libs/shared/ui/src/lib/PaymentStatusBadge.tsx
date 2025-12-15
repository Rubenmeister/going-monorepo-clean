'use client';

import React from 'react';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<PaymentStatus, { label: string; bg: string; text: string; icon: string }> = {
  pending: { label: 'Pendiente', bg: 'bg-amber-100', text: 'text-amber-700', icon: '⏳' },
  processing: { label: 'Procesando', bg: 'bg-blue-100', text: 'text-blue-700', icon: '🔄' },
  completed: { label: 'Pagado', bg: 'bg-green-100', text: 'text-green-700', icon: '✓' },
  failed: { label: 'Fallido', bg: 'bg-red-100', text: 'text-red-700', icon: '✗' },
  refunded: { label: 'Reembolsado', bg: 'bg-gray-100', text: 'text-gray-700', icon: '↩' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function PaymentStatusBadge({
  status,
  amount,
  currency = '$',
  size = 'md',
  showIcon = true,
  className = '',
}: PaymentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${config.bg} ${config.text} ${sizeClasses[size]} ${className}
      `}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
      {amount !== undefined && (
        <span className="font-semibold">
          {currency}{amount.toFixed(2)}
        </span>
      )}
    </span>
  );
}

export default PaymentStatusBadge;
