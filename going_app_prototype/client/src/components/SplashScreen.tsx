import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    // Sequence:
    // 0s: Start
    // 0.2s: SUV starts moving (No sound)
    // 2.5s: SUV exits, Logo starts appearing (Slower animation needs more time)
    // 5.0s: Animation complete
    
    // Sound removed as per user request

    const logoTimer = setTimeout(() => {
      setShowLogo(true);
    }, 2500); // Delayed logo appearance to allow slower car to pass

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 5500); // Extended total time

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Background Elements - Minimalist White */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000012_1px,transparent_1px),linear-gradient(to_bottom,#00000012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* SUV Animation Container - Centered Vertically (Media Altura) */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        {/* Speed Lines / Motion Blur Effect - Left to Right */}
        <motion.div 
          className="absolute w-full h-32 flex flex-col justify-center gap-8 opacity-20"
          initial={{ x: "100%" }}
          animate={{ x: "-100%" }}
          transition={{ duration: 2.5, ease: "linear" }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          <div className="h-0.5 w-3/4 self-end bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
        </motion.div>

        {/* The SUV - Moving Left to Right Slower */}
        <motion.img
          src="/suv_black_right_v2.png"
          alt="Going SUV"
          className="absolute w-32 h-auto object-contain drop-shadow-2xl" // Small size (distant)
          initial={{ x: "-120vw", opacity: 0 }}
          animate={{ 
            x: "120vw", // Move across full screen width (Left to Right)
            opacity: [0, 1, 1, 0]
          }}
          transition={{ 
            duration: 2.5, // Slower speed
            ease: "linear",
            delay: 0.2
          }}
          // No flip needed as image natively faces right
        />
      </div>

      {/* Logo Reveal */}
      <AnimatePresence>
        {showLogo && (
          <motion.div
            className="absolute z-20 flex flex-col items-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 20,
              duration: 0.5
            }}
          >
            {/* Using the official color logo for white background */}
            <img 
              src="/logo.png" 
              alt="Going Logo" 
              className="w-56 h-auto mb-6 drop-shadow-xl"
            />
            <motion.h2
              className="text-black font-display mt-2 text-xl font-bold tracking-[0.2em] uppercase"
              style={{ fontFamily: "'Nunito Sans', sans-serif" }} // Explicitly enforcing Nunito Sans
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              NOS MOVEMOS CONTIGO
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
