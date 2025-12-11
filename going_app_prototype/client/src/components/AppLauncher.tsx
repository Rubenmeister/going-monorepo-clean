import { motion } from "framer-motion";
import { Wifi, Battery, Signal } from "lucide-react";

interface AppLauncherProps {
  onLaunchUserApp: () => void;
  onLaunchDriverApp: () => void;
}

export default function AppLauncher({ onLaunchUserApp, onLaunchDriverApp }: AppLauncherProps) {
  return (
    <div className="h-screen w-full bg-cover bg-center relative overflow-hidden flex flex-col items-center" 
         style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')" }}>
      
      {/* Status Bar Overlay */}
      <div className="w-full h-12 flex justify-between px-6 items-center text-white text-xs z-20 bg-black/20 backdrop-blur-sm">
        <span className="font-medium">12:30</span>
        <div className="flex gap-2 items-center">
          <Signal className="w-3 h-3" />
          <Wifi className="w-3 h-3" />
          <Battery className="w-4 h-4" />
        </div>
      </div>

      {/* Phone Screen Content */}
      <div className="flex-1 w-full flex flex-col justify-start pt-20 px-8 gap-12 z-10">
        
        {/* Date/Time Widget */}
        <div className="flex flex-col items-center text-white drop-shadow-md mb-8">
          <h1 className="text-6xl font-thin tracking-tighter">12:30</h1>
          <p className="text-lg font-medium opacity-90">Domingo, 8 de Diciembre</p>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-4 gap-x-6 gap-y-10 w-full">
          
          {/* User App Icon */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={onLaunchUserApp}>
            <motion.div 
              whileTap={{ scale: 0.9 }}
              className="w-16 h-16 rounded-2xl bg-[#FF4E43] flex items-center justify-center shadow-lg relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <img src="/logo_white.png" alt="Going" className="w-10 h-10 object-contain" />
            </motion.div>
            <span className="text-white text-xs font-medium drop-shadow-md">Going</span>
          </div>

          {/* Driver App Icon */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={onLaunchDriverApp}>
            <motion.div 
              whileTap={{ scale: 0.9 }}
              className="w-16 h-16 rounded-2xl bg-[#FFC107] flex items-center justify-center shadow-lg relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <img src="/logo_black_symbol_black_text.png" alt="Going Driver" className="w-10 h-10 object-contain" />
            </motion.div>
            <span className="text-white text-xs font-medium drop-shadow-md text-center leading-tight">Going<br/>Driver</span>
          </div>

          {/* Dummy Icons for realism */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 opacity-80">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md shadow-sm" />
              <div className="w-12 h-2 rounded-full bg-white/30" />
            </div>
          ))}

        </div>
      </div>

      {/* Dock */}
      <div className="w-full p-4 pb-8 z-10">
        <div className="bg-white/20 backdrop-blur-xl rounded-[2rem] p-4 flex justify-around items-center">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-14 h-14 rounded-2xl bg-gradient-to-b from-gray-100 to-gray-300 shadow-lg" />
          ))}
        </div>
      </div>

      {/* Overlay for depth */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
    </div>
  );
}
