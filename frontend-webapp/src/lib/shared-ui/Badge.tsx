/**
 * Badge component - Small labels for status or tags
 */

import React from 'react';

type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-red-100 text-blue-800',
  secondary: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-cyan-100 text-cyan-800',
};

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

/**
 * Badge component for labels and status
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning" size="sm">Pending</Badge>
 */
export function Badge({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`
        inline-block
        rounded-full
        font-semibold
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </span>
  );
}
