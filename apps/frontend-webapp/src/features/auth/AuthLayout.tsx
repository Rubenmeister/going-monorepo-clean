import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex bg-brand-red">
      {/* Left Side - Brand Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-red via-brand-red to-red-700 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2021&q=80" 
          alt="Travel" 
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        
        {/* Content */}
        <div className="relative z-20 flex flex-col justify-between h-full p-12 text-white">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/assets/logo-full.png" 
              alt="Going" 
              className="h-12 w-auto brightness-0 invert"
            />
          </div>
          
          {/* Hero Text */}
          <div>
            <h1 className="text-6xl font-bold mb-6 leading-tight">
              Nos movemos<br/>contigo.
            </h1>
            <p className="text-xl text-white/80 max-w-md">
              Únete a la plataforma de movilidad más innovadora de Colombia.
            </p>
          </div>
          
          {/* Footer */}
          <div className="text-sm text-white/50">
            © 2024 Going Inc. Todos los derechos reservados.
          </div>
        </div>
      </div>

      {/* Right Side - Form (Mobile: Full Screen Red) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 lg:bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo (visible only on mobile) */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img 
              src="/assets/logo_white_symbol_black_text.png" 
              alt="Going" 
              className="h-24 w-auto"
            />
          </div>
          
          {/* Title */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-white lg:text-brand-black">
              {title}
            </h2>
            <p className="mt-2 text-white/80 lg:text-gray-500">
              {subtitle}
            </p>
          </div>
          
          {/* Form Content */}
          <div className="bg-white/90 lg:bg-transparent p-6 lg:p-0 rounded-2xl lg:rounded-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
