import { motion } from "framer-motion";
import { ArrowLeft, Search, HelpCircle, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface UserHelpScreenProps {
  onBack: () => void;
}

export default function UserHelpScreen({ onBack }: UserHelpScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      className="fixed inset-0 bg-gray-50 z-50 flex flex-col"
    >
      {/* Header - User Style (Red/White) */}
      <div className="bg-[#FF4E43] px-4 pt-12 pb-6 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack} 
            className="rounded-full hover:bg-white/20 text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold text-white font-display">Ayuda</h1>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input 
            placeholder="Buscar temas de ayuda..." 
            className="pl-10 bg-white border-0 h-12 rounded-xl shadow-sm text-base placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* FAQ Sections */}
        <div className="space-y-6">
          <section>
            <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#FF4E43]" />
              Preguntas Frecuentes
            </h3>
            <Accordion type="single" collapsible className="bg-white rounded-xl shadow-sm border border-gray-100 px-4">
              <AccordionItem value="item-1" className="border-b-gray-100">
                <AccordionTrigger className="hover:no-underline py-4 font-medium text-gray-800">
                  Olvidé un objeto en el vehículo
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  Si perdiste algo, ve a "Mis Viajes", selecciona el viaje correspondiente y usa la opción "Olvidé un objeto" para contactar al conductor.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-b-gray-100">
                <AccordionTrigger className="hover:no-underline py-4 font-medium text-gray-800">
                  Problemas con un cobro
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  Revisamos todos los reportes de cobros incorrectos. Por favor selecciona el viaje en cuestión y detalla el problema para que podamos ayudarte.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-b-0">
                <AccordionTrigger className="hover:no-underline py-4 font-medium text-gray-800">
                  ¿Cómo funcionan los Alojamientos Soñados?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  Son estancias únicas verificadas por Going. Puedes reservarlas directamente desde la app y pagar de forma segura con tu tarjeta registrada.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </div>

        {/* Contact Support */}
        <div className="mt-8 mb-6">
          <Button className="w-full bg-[#FF4E43] text-white hover:bg-[#E0453A] h-12 rounded-xl font-bold shadow-lg">
            Enviar mensaje a Soporte
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
