import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden font-inter">
      {/* Background Layer */}
      <img 
        src="/assets/ecuador_landscape_bg.png" 
        alt="Ecuador Landscape" 
        className="absolute inset-0 w-full h-full object-cover" 
      />
      <div className="absolute inset-0 bg-brand-red/85" />
      
      {/* Andean Pattern Layer */}
      <div 
        className="absolute inset-0 opacity-10" 
        style={{ 
          backgroundImage: 'url(/assets/andean_pattern.png)', 
          backgroundRepeat: 'repeat',
          backgroundSize: '300px'
        }} 
      />
      
      {/* Auth Card - Glassmorphism */}
      <div className="relative z-10 w-full max-w-xl p-8 md:p-12 mx-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[40px] p-8 md:p-12 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <img 
              src="/assets/logo.png" 
              alt="Going" 
              className="h-20 w-auto brightness-0 invert"
            />
          </div>
          
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
              {title}
            </h2>
            <p className="text-white/70 text-lg font-medium">
              {subtitle}
            </p>
          </div>
          
          {/* Children (Form) */}
          <div className="auth-form-container">
            {children}
          </div>
          
          {/* Footer Footer */}
          <div className="mt-12 text-center text-white/30 text-xs font-bold tracking-widest uppercase">
            Ecuador en Movimiento • 2024
          </div>
        </div>
      </div>
    </div>
  );
};
