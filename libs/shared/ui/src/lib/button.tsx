import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const baseStyles = 'rounded-md font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};
const variants = {
  primary: 'bg-[#0033A0] text-white hover:bg-opacity-90',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  accent: 'bg-[#FFCD00] text-[#0033A0] hover:bg-yellow-400',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
};

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const classNames = `${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`;
  
  return (
    <button className={classNames} {...props}>
      {children}
    </button>
  );
};