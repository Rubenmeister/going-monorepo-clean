'use client';

import React from 'react';

interface AlertProps {
  type: 'critical' | 'operational' | 'informative';
  title: string;
  description?: string;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }[];
  onDismiss?: () => void;
  className?: string;
}

const alertStyles = {
  critical: {
    container: 'bg-going-red/10 border-going-red/30',
    icon: '🚨',
    title: 'text-going-red',
  },
  operational: {
    container: 'bg-going-yellow/10 border-going-yellow/30',
    icon: '⚠️',
    title: 'text-going-yellow',
  },
  informative: {
    container: 'bg-info/10 border-info/30',
    icon: 'ℹ️',
    title: 'text-info',
  },
};

export function Alert({
  type,
  title,
  description,
  actions,
  onDismiss,
  className = '',
}: AlertProps) {
  const styles = alertStyles[type];

  return (
    <div
      className={`
        rounded-lg border p-4
        ${styles.container}
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{styles.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${styles.title}`}>{title}</h4>
          {description && (
            <p className="text-white/60 text-sm mt-1">{description}</p>
          )}
          {actions && actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-md transition
                    ${action.variant === 'secondary'
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : type === 'critical'
                        ? 'bg-going-red hover:bg-going-red-dark text-white'
                        : type === 'operational'
                          ? 'bg-going-yellow hover:bg-going-yellow-dark text-going-black'
                          : 'bg-info hover:bg-info/80 text-white'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-white/40 hover:text-white/80 transition"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
