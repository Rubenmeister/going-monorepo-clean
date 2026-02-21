/**
 * Card component - Container for grouped content
 */

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  shadow?: 'sm' | 'md' | 'lg' | 'none';
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const shadowStyles = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  none: 'shadow-none',
};

const paddingStyles = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  none: 'p-0',
};

/**
 * Card component for grouping related content
 * @example
 * <Card shadow="md">
 *   <CardHeader>Title</CardHeader>
 *   <CardBody>Content</CardBody>
 * </Card>
 */
export function Card({
  children,
  hoverable = false,
  shadow = 'md',
  padding,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-lg
        ${shadowStyles[shadow]}
        border border-gray-200
        ${padding ? paddingStyles[padding] : ''}
        ${hoverable ? 'hover:shadow-lg transition-shadow' : ''}
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card header component
 */
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={`
        px-6 py-4
        border-b border-gray-200
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card body component
 */
interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardBody({ children, className, ...props }: CardBodyProps) {
  return (
    <div
      className={`
        px-6 py-4
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card footer component
 */
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div
      className={`
        px-6 py-4
        border-t border-gray-200
        bg-gray-50
        rounded-b-lg
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
