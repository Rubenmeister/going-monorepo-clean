'use client';

import React from 'react';

interface BadgeProps {
  variant?: 'active' | 'warning' | 'critical' | 'success' | 'neutral' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
  icon,
}: BadgeProps) {
  const variants = {
    active: 'bg-going-red/15 text-going-red',
    warning: 'bg-going-yellow/15 text-going-yellow',
    critical: 'bg-going-red/15 text-going-red border border-going-red/30',
    success: 'bg-success/15 text-success',
    neutral: 'bg-white/10 text-white/60',
    info: 'bg-info/15 text-info',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {icon}
      {children}
    </span>
  );
}
