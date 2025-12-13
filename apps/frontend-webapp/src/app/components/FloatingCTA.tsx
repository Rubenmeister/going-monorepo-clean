'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Car, X, Navigation, Loader2 } from 'lucide-react';
import { useABTest } from '../hooks/useABTest';

interface VehicleMarker {
  id: number;
  lat: number;
  lng: number;
  type: 'SUV';
  eta: number;
}

const generateNearbyVehicles = (lat: number, lng: number, count: number): VehicleMarker[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    lat: lat + (Math.random() - 0.5) * 0.02,
    lng: lng + (Math.random() - 0.5) * 0.02,
    type: 'SUV' as const,
    eta: Math.floor(Math.random() * 8) + 2,
  }));
};

export function FloatingCTA() {
  const { colors, variant } = useABTest();
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [vehicles, setVehicles] = useState<VehicleMarker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const vehicleCount = 10;

  const handleRequestRide = useCallback(() => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocalización no soportada');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setVehicles(generateNearbyVehicles(latitude, longitude, vehicleCount));
        setIsMapOpen(true);
        setIsLoading(false);
      },
      (err) => {
        console.error('GPS Error:', err);
        setError('Permite acceso a ubicación para continuar');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return (
    <>
      {/* Floating CTA Button */}
      <motion.div
        className="fixed bottom-6 left-4 right-4 md:left-auto md:right-8 md:w-96 z-40"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
      >
        <motion.button
          onClick={handleRequestRide}
          disabled={isLoading}
          className={w-full h-20 rounded-2xl    
            font-bold text-xl shadow-2xl flex items-center justify-center gap-3
            transition-all duration-300 disabled:opacity-70}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          animate={{ boxShadow: ['0 10px 40px rgba(0,0,0,0.2)', '0 10px 60px rgba(0,0,0,0.3)', '0 10px 40px rgba(0,0,0,0.2)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={28} />
          ) : (
            <>
              <Navigation size={28} />
              <span>Solicitar Ride Ahora</span>
            </>
          )}
        </motion.button>
        
        {/* Vehicle count badge */}
        <motion.div
          className="absolute -top-3 -right-2 bg-yellow-400 text-black text-sm font-bold px-3 py-1 rounded-full shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1 }}
        >
          {vehicleCount} SUVs cerca
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-red-500 text-sm mt-2 bg-white/90 rounded-lg py-2"
          >
            {error}
          </motion.p>
        )}
      </motion.div>

      {/* Map Modal */}
      <AnimatePresence>
        {isMapOpen && userLocation && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Vehículos Disponibles</h3>
                  <p className="text-gray-300 text-sm">{vehicleCount} SUVs cerca de ti</p>
                </div>
                <button
                  onClick={() => setIsMapOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Map Visualization */}
              <div className="relative h-64 bg-gradient-to-br from-blue-100 to-green-100 overflow-hidden">
                {/* Grid lines for map effect */}
                <div className="absolute inset-0 opacity-20">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={h-} className="absolute w-full h-px bg-gray-400" style={{ top: ${i * 10}% }} />
                  ))}
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={-} className="absolute h-full w-px bg-gray-400" style={{ left: ${i * 10}% }} />
                  ))}
                </div>

                {/* User location */}
                <motion.div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg" />
                  <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping" />
                </motion.div>

                {/* Vehicle markers */}
                {vehicles.map((vehicle, index) => {
                  const offsetX = (vehicle.lng - userLocation.lng) * 5000;
                  const offsetY = (vehicle.lat - userLocation.lat) * -5000;
                  return (
                    <motion.div
                      key={vehicle.id}
                      className="absolute z-10"
                      style={{
                        left: calc(50% + px),
                        top: calc(50% + px),
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="relative group cursor-pointer">
                        <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                          <Car size={20} className="text-gray-800" />
                        </div>
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                          {vehicle.eta} min
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-4">
                <button
                  className={w-full py-4 rounded-xl   font-bold text-lg shadow-lg}
                  onClick={() => alert('Función de reserva próximamente')}
                >
                  Confirmar SUV más cercano ({vehicles[0]?.eta || 3} min)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
