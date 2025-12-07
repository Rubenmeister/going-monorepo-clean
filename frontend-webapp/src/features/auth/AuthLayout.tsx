import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image/Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-brand-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-red/90 to-brand-black/90 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2021&q=80" 
          alt="Travel" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 flex flex-col justify-between h-full p-12 text-white">
          <div className="flex items-center space-x-3">
             {/* Logo Placeholder - You might want to import a real logo SVG here */}
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="font-bold text-lg">G</span>
            </div>
            <span className="text-2xl font-bold tracking-wide">Going</span>
          </div>
          <div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Descubre el mundo <br/> a tu manera.
            </h1>
            <p className="text-lg text-white/80 max-w-md">
              Únete a nuestra comunidad de viajeros y vive experiencias inolvidables.
            </p>
          </div>
          <div className="text-sm text-white/40">
            © 2024 Going Inc.
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-brand-black">
              {title}
            </h2>
            <p className="mt-2 text-gray-500">
              {subtitle}
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
