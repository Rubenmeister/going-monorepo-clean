/**
 * Loading component - Loading states with spinner
 */

import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
  message?: string;
  overlay?: boolean;
}

const sizeStyles = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

/**
 * Loading spinner component
 * @example
 * <Loading size="md" message="Loading..." />
 * <Loading overlay fullHeight /> // Full-screen overlay
 */
export function Loading({
  size = 'md',
  fullHeight = false,
  message,
  overlay = false,
}: LoadingProps) {
  const containerClass = overlay
    ? 'fixed inset-0 bg-black bg-opacity-50 z-50'
    : fullHeight
    ? 'h-full'
    : '';

  const contentClass =
    overlay || fullHeight ? 'flex items-center justify-center h-full' : '';

  return (
    <div
      className={`${containerClass} ${contentClass} flex flex-col items-center justify-center p-4`}
    >
      <svg
        className={`${sizeStyles[size]} animate-spin text-going-primary`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>

      {message && (
        <p className="mt-4 text-gray-600 font-medium text-center">{message}</p>
      )}
    </div>
  );
}
