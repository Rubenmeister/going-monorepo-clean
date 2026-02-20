/**
 * Input component - Text input with labels and validation
 */

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

/**
 * Input component with label, error, and helper text
 * @example
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="you@example.com"
 *   error={errors.email}
 * />
 */
export function Input({
  label,
  error,
  helperText,
  fullWidth = false,
  className,
  disabled,
  ...props
}: InputProps) {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <input
        className={`
          w-full px-4 py-2
          border rounded-lg
          text-gray-900
          placeholder-gray-500
          transition-colors
          ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-going-primary'
          }
          focus:outline-none focus:ring-2
          disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
          ${className || ''}
        `}
        disabled={disabled}
        {...props}
      />

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

/**
 * Textarea component with label and error
 */
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export function Textarea({
  label,
  error,
  helperText,
  fullWidth = false,
  className,
  disabled,
  ...props
}: TextareaProps) {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <textarea
        className={`
          w-full px-4 py-2
          border rounded-lg
          text-gray-900
          placeholder-gray-500
          transition-colors
          ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-going-primary'
          }
          focus:outline-none focus:ring-2
          disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
          resize-vertical
          ${className || ''}
        `}
        disabled={disabled}
        {...props}
      />

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

/**
 * Select component with label and error
 */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string }>;
}

export function Select({
  label,
  error,
  helperText,
  fullWidth = false,
  className,
  disabled,
  options,
  ...props
}: SelectProps) {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <select
        className={`
          w-full px-4 py-2
          border rounded-lg
          text-gray-900
          transition-colors
          ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-going-primary'
          }
          focus:outline-none focus:ring-2
          disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
          ${className || ''}
        `}
        disabled={disabled}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
