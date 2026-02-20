/**
 * EmptyState component - Display when no data is available
 */

import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  fullHeight?: boolean;
}

/**
 * Empty state component for no data scenarios
 * @example
 * <EmptyState
 *   icon="📭"
 *   title="No results found"
 *   description="Try adjusting your filters"
 *   action={<Button>Reset Filters</Button>}
 * />
 */
export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  fullHeight = false,
}: EmptyStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        ${fullHeight ? 'h-full' : 'py-12 px-4'}
        text-center
      `}
    >
      {icon && <div className="text-5xl mb-4 opacity-50">{icon}</div>}

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

      {description && (
        <p className="text-gray-500 mb-6 max-w-sm">{description}</p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
