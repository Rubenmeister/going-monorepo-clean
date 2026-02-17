import React from 'react';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from './design-tokens';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, loading, className, children, ...props }, ref) => {
    const baseStyles = `
      font-family: ${Typography.fontFamily.sans};
      font-weight: ${Typography.fontWeight.semibold};
      border: none;
      border-radius: ${BorderRadius.lg};
      transition: ${require('./design-tokens').Transitions.normal};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: ${Spacing[2]};
      ${fullWidth ? 'width: 100%;' : ''}
      ${loading ? 'opacity: 0.7; cursor: not-allowed;' : ''}
    `;

    const sizeStyles = {
      sm: `padding: ${Spacing[2]} ${Spacing[4]}; font-size: ${Typography.fontSize.sm};`,
      md: `padding: ${Spacing[3]} ${Spacing[6]}; font-size: ${Typography.fontSize.base};`,
      lg: `padding: ${Spacing[4]} ${Spacing[8]}; font-size: ${Typography.fontSize.lg};`,
    }[size];

    const variantStyles = {
      primary: `background-color: ${Colors.primary}; color: ${Colors.white}; box-shadow: ${Shadows.md};
                 &:hover { background-color: ${Colors.primaryLight}; box-shadow: ${Shadows.lg}; }
                 &:active { background-color: ${Colors.primaryDark}; }`,
      secondary: `background-color: ${Colors.secondary}; color: ${Colors.white};
                  &:hover { background-color: ${Colors.secondaryLight}; }
                  &:active { background-color: ${Colors.secondaryDark}; }`,
      outline: `background-color: transparent; border: 2px solid ${Colors.primary}; color: ${Colors.primary};
                 &:hover { background-color: ${Colors.gray50}; }`,
      ghost: `background-color: transparent; color: ${Colors.primary};
               &:hover { background-color: ${Colors.gray100}; }`,
    }[variant];

    return (
      <button
        ref={ref}
        className={className}
        style={{
          ...eval(`({ ${baseStyles} ${sizeStyles} ${variantStyles} })`),
        }}
        disabled={loading || props.disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div style={{ width: '100%' }}>
        {label && (
          <label
            style={{
              display: 'block',
              marginBottom: Spacing[2],
              fontWeight: Typography.fontWeight.medium,
              color: Colors.gray700,
              fontSize: Typography.fontSize.sm,
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          style={{
            width: '100%',
            padding: `${Spacing[3]} ${Spacing[4]}`,
            borderRadius: BorderRadius.lg,
            border: `2px solid ${error ? Colors.error : Colors.gray200}`,
            fontSize: Typography.fontSize.base,
            fontFamily: Typography.fontFamily.sans,
            transition: 'all 200ms ease-in-out',
            boxSizing: 'border-box',
          }}
          className={className}
          {...props}
        />
        {error && (
          <p style={{ color: Colors.error, fontSize: Typography.fontSize.sm, marginTop: Spacing[1] }}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p style={{ color: Colors.gray500, fontSize: Typography.fontSize.sm, marginTop: Spacing[1] }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg';
  border?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ padding = 'md', border = false, className, children, ...props }, ref) => {
    const paddingMap = {
      sm: Spacing[4],
      md: Spacing[6],
      lg: Spacing[8],
    };

    return (
      <div
        ref={ref}
        style={{
          backgroundColor: Colors.white,
          borderRadius: BorderRadius.xl,
          boxShadow: Shadows.md,
          padding: paddingMap[padding],
          border: border ? `1px solid ${Colors.gray200}` : 'none',
        }}
        className={className}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    const variantColors = {
      primary: { bg: Colors.primary, text: Colors.white },
      success: { bg: Colors.success, text: Colors.white },
      warning: { bg: Colors.warning, text: Colors.white },
      error: { bg: Colors.error, text: Colors.white },
      info: { bg: Colors.info, text: Colors.white },
    }[variant];

    const sizeStyles = {
      sm: { padding: `${Spacing[1]} ${Spacing[2]}`, fontSize: Typography.fontSize.xs },
      md: { padding: `${Spacing[2]} ${Spacing[3]}`, fontSize: Typography.fontSize.sm },
    }[size];

    return (
      <span
        ref={ref}
        style={{
          backgroundColor: variantColors.bg,
          color: variantColors.text,
          borderRadius: BorderRadius.full,
          display: 'inline-flex',
          alignItems: 'center',
          fontWeight: Typography.fontWeight.semibold,
          ...sizeStyles,
        }}
        className={className}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
