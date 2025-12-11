import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Shield, DollarSign, Navigation, Power, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/Map";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface DriverHomeScreenProps {
  onOpenMenu: () => void;
}

export default function DriverHomeScreen({ onOpenMenu }: DriverHomeScreenProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState({ lat: -0.1807, lng: -78.4678 }); // Quito default

  const toggleOnline = () => {
    setIsOnline(!isOnline);
  };

  return (
    <div className="relative h-screen w-full bg-gray-100 overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-12 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="flex justify-between items-start pointer-events-auto">
          <Button 
            variant="secondary" 
            size="icon" 
            className="rounded-full bg-white shadow-lg h-12 w-12"
            onClick={onOpenMenu}
          >
            <Menu className="h-6 w-6 text-gray-800" />
          </Button>
          
          <div className="flex flex-col items-end gap-2">
            <div className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="font-bold text-lg">$45.50</span>
            </div>
            <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Shield className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-bold text-gray-800">Oro</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative z-0">
        <MapView
          className="w-full h-full"
          initialCenter={location}
          initialZoom={15}
          onMapReady={(map) => {
            // Add driver marker or heatmap here
          }}
        />
        
        {/* Offline Overlay */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] z-10 flex items-center justify-center"
            >
              <div className="bg-white/90 px-6 py-3 rounded-full shadow-xl">
                <span className="font-bold text-gray-800">Estás desconectado</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Control Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] p-6 pb-10">
        <div className="flex flex-col gap-6">
          
          {/* Status & Action Button */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 font-display">
                {isOnline ? "Buscando viajes..." : "Desconectado"}
              </h2>
              <p className="text-sm text-gray-500">
                {isOnline ? "Mantente atento a las alertas" : "Conéctate para recibir viajes"}
              </p>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleOnline}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                isOnline 
                  ? "bg-red-500 hover:bg-red-600 shadow-red-200" 
                  : "bg-green-500 hover:bg-green-600 shadow-green-200"
              }`}
            >
              <Power className="w-8 h-8 text-white" />
            </motion.button>
          </div>

          {/* Quick Stats / Actions */}
          {isOnline && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="grid grid-cols-3 gap-4"
            >
              <div className="bg-gray-50 p-3 rounded-xl flex flex-col items-center justify-center gap-1 border border-gray-100">
                <span className="text-2xl font-bold text-gray-900">5</span>
                <span className="text-xs text-gray-500">Viajes hoy</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl flex flex-col items-center justify-center gap-1 border border-gray-100">
                <span className="text-2xl font-bold text-gray-900">4.9</span>
                <span className="text-xs text-gray-500">Calificación</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl flex flex-col items-center justify-center gap-1 border border-gray-100">
                <span className="text-2xl font-bold text-gray-900">8h</span>
                <span className="text-xs text-gray-500">En línea</span>
              </div>
            </motion.div>
          )}

          {/* Navigation Helper (Mockup) */}
          <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="bg-blue-100 p-2 rounded-full">
              <Navigation className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-900">Alta demanda en La Mariscal</p>
              <p className="text-xs text-blue-600">A 5 minutos de tu ubicación</p>
            </div>
            <Button size="sm" variant="ghost" className="text-blue-700 hover:bg-blue-100 hover:text-blue-800">
              Ir
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
