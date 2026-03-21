/**
 * Alert component - Display alerts with different types
 */

import React from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: AlertType;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  closeable?: boolean;
}

const alertStyles = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    title: 'text-green-900',
    icon: '✓',
    iconColor: 'text-green-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    title: 'text-red-900',
    icon: '✕',
    iconColor: 'text-red-600',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    title: 'text-yellow-900',
    icon: '⚠',
    iconColor: 'text-yellow-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    title: 'text-blue-900',
    icon: 'ℹ',
    iconColor: 'text-blue-600',
  },
};

/**
 * Alert component for displaying messages
 * @example
 * <Alert type="success" title="Success!">Operation completed</Alert>
 * <Alert type="error" closeable onClose={handleClose}>Error message</Alert>
 */
export function Alert({
  type = 'info',
  title,
  children,
  onClose,
  closeable = false,
  className,
  ...props
}: AlertProps) {
  const style = alertStyles[type];

  return (
    <div
      className={`
        ${style.bg}
        ${style.border}
        ${style.text}
        border rounded-lg p-4
        ${className || ''}
      `}
      {...props}
    >
      <div className="flex items-start gap-3">
        <span className={`text-lg font-bold ${style.iconColor}`}>
          {style.icon}
        </span>

        <div className="flex-1">
          {title && (
            <h3 className={`font-semibold ${style.title} mb-1`}>{title}</h3>
          )}
          <div className="text-sm">{children}</div>
        </div>

        {closeable && (
          <button
            onClick={onClose}
            className={`
              text-lg font-bold
              hover:opacity-70
              transition-opacity
              ${style.iconColor}
            `}
            aria-label="Close alert"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
