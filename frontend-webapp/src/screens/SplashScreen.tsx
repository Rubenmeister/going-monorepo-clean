import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [phase, setPhase] = useState<'car' | 'logo' | 'finish'>('car');

  useEffect(() => {
    // Phase 1: Car Animation (2.5s)
    const carTimer = setTimeout(() => {
      setPhase('logo');
    }, 2000); // Switch to logo slightly before car animation finishes completely

    // Phase 2: Logo Animation (2.5s more) then finish
    const finishTimer = setTimeout(() => {
        if (phase !== 'car') { // Only finish if we moved past car
             onFinish();
        }
    }, 4500); // 2000 + 2500

    return () => {
      clearTimeout(carTimer);
      clearTimeout(finishTimer);
    };
  }, []); // Run once on mount

  // Watch for phase change to trigger finish sequence manually if needed
  useEffect(() => {
     if (phase === 'logo') {
         setTimeout(onFinish, 3000);
     }
  }, [phase, onFinish]);

  if (phase === 'car') {
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-red overflow-hidden">
            <div className="animate-drive-in">
                <img 
                    src="/assets/suv.png" 
                    alt="Approaching SUV" 
                    className="w-64 h-auto md:w-96 object-contain drop-shadow-2xl"
                />
            </div>
        </div>
      );
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-red transition-opacity duration-700 ${phase === 'finish' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="animate-zoom-in flex flex-col items-center">
        {/* Icon only - Cropped using clip-path */}
        <div className="flex items-center justify-center">
           <img 
            src={`/assets/logo-full.png?v=${new Date().getTime()}`} 
            alt="Going Icon" 
            className="w-48 h-auto object-contain brightness-0 invert [clip-path:polygon(0_0,100%_0,100%_60%,0_60%)] -mb-12" 
          />
        </div>
        
        {/* Text - Black */}
        <h1 className="mt-2 text-5xl md:text-6xl font-bold text-black tracking-wider">
          Going
        </h1>
      </div>
      <div className="opacity-0 animate-fade-in flex flex-col items-center">
        <p className="mt-4 text-white/90 font-medium text-lg">Nos movemos contigo</p>
      </div>
    </div>
  );
};
