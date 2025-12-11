import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2 } from "lucide-react";

interface DriverPendingScreenProps {
  onBackToStart: () => void;
}

export default function DriverPendingScreen({ onBackToStart }: DriverPendingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen bg-[#FF4E43] items-center justify-center p-6 relative"
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white rounded-3xl p-8 flex flex-col items-center text-center max-w-xs w-full shadow-2xl"
      >
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6 relative">
          <Clock className="w-10 h-10 text-yellow-600" />
          <motion.div 
            className="absolute -right-1 -bottom-1 bg-green-500 rounded-full p-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
          </motion.div>
        </div>
        
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">Solicitud Enviada</h2>
        
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          Hemos recibido tus documentos correctamente. Nuestro equipo revisará tu solicitud y te notificaremos en un plazo de <span className="font-bold text-gray-800">24-48 horas</span>.
        </p>

        <div className="w-full bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Estado actual</h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
            <span className="text-sm font-medium text-gray-800">En Revisión</span>
          </div>
        </div>

        <Button 
          onClick={onBackToStart}
          className="w-full bg-black text-white hover:bg-black/80 font-medium text-base h-12 rounded-xl font-display"
        >
          Volver al Inicio
        </Button>
      </motion.div>
    </motion.div>
  );
}
