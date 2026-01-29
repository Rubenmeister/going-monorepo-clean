import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden font-inter bg-white">
      {/* Auth Card - Red background */}
      <div className="relative z-10 w-full max-w-xl p-6 md:p-8 mx-4">
        <div className="bg-brand-red rounded-3xl p-8 md:p-10 shadow-2xl">
          {/* Logo - Using image, inverted for red background */}
          <div className="flex justify-center mb-8">
            <img 
              src="/assets/logo.png" 
              alt="Going" 
              className="h-16 w-auto brightness-0 invert"
            />
          </div>
          
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
              {title}
            </h2>
            <p className="text-white/70 text-base">
              {subtitle}
            </p>
          </div>
          
          {/* Children (Form) */}
          <div className="auth-form-container">
            {children}
          </div>
          
          {/* Footer */}
          <div className="mt-10 text-center text-white/50 text-xs font-medium tracking-wide">
            goingec.com • Ecuador en Movimiento
          </div>
        </div>
      </div>
    </div>
  );
};
