import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [phase, setPhase] = useState<'car' | 'logo' | 'finish'>('car');

  useEffect(() => {
    const carTimer = setTimeout(() => {
      setPhase('logo');
    }, 2800);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 6000);

    return () => {
      clearTimeout(carTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  // SCENE 1: SUV Animation
  if (phase === 'car') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden">
        <img 
          src="/assets/ecuador_landscape_bg.png" 
          alt="Ecuador Landscape" 
          className="absolute inset-0 w-full h-full object-cover opacity-60" 
        />
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Lines */}
        <div className="absolute top-[42%] left-0 right-0 h-0.5 bg-[#FF4D4D]" />
        <div className="absolute top-[51%] left-0 right-0 h-0.5 bg-[#F5A623]" />
        
        {/* SUV */}
        <div className="absolute top-[43.5%] left-0 w-full animate-drive-full">
          <img 
            src="/assets/suv_black_right_v3.png" 
            alt="Approaching SUV" 
            className="w-32 h-auto md:w-48 object-contain"
          />
        </div>
      </div>
    );
  }

  // SCENE 2: Logo Reveal
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden transition-opacity duration-1000">
      <img 
        src="/assets/ecuador_landscape_bg.png" 
        alt="Ecuador Landscape" 
        className="absolute inset-0 w-full h-full object-cover opacity-60" 
      />
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="relative z-10 animate-zoom-in flex flex-col items-center">
        <img 
          src="/assets/logo.png" 
          alt="Going Logo" 
          className="w-64 h-auto md:w-80 object-contain drop-shadow-2xl" 
        />
        <p className="mt-8 text-white font-bold text-xl md:text-2xl tracking-[0.4em] italic drop-shadow-lg text-center px-4 animate-fade-in">
          NOS MOVEMOS CONTIGO
        </p>
      </div>
    </div>
  );
};
