import { motion } from "framer-motion";
import { ArrowLeft, Shield, DollarSign, Users, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface DriverHelpScreenProps {
  onBack: () => void;
}

export default function DriverHelpScreen({ onBack }: DriverHelpScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      className="fixed inset-0 bg-gray-50 z-50 flex flex-col"
    >
      {/* Header - Driver Style (Yellow/Black) */}
      <div className="bg-[#FFC107] px-4 pt-12 pb-6 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack} 
            className="rounded-full hover:bg-black/10 text-black"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold text-black font-display">Centro de Ayuda</h1>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input 
            placeholder="¿En qué podemos ayudarte hoy?" 
            className="pl-10 bg-white border-0 h-12 rounded-xl shadow-sm text-base placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Quick Categories */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 text-center hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-bold text-gray-800">Tarifas y Pagos</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 text-center hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-gray-800">Pasajeros</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 text-center hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="bg-red-100 p-3 rounded-full">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs font-bold text-gray-800">Seguridad</span>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-6">
          <section>
            <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#FFC107]" />
              Tarifas y Ganancias
            </h3>
            <Accordion type="single" collapsible className="bg-white rounded-xl shadow-sm border border-gray-100 px-4">
              <AccordionItem value="item-1" className="border-b-gray-100">
                <AccordionTrigger className="hover:no-underline py-4 font-medium text-gray-800">
                  ¿Cómo se calculan mis ganancias?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  Tus ganancias se calculan sumando la tarifa base + tiempo + distancia. Las propinas son 100% tuyas. Going cobra una comisión fija del 15% por servicio.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-b-0">
                <AccordionTrigger className="hover:no-underline py-4 font-medium text-gray-800">
                  ¿Cuándo recibo mis pagos?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  Los pagos se procesan semanalmente cada lunes. Si usas Pago Instantáneo, puedes retirar tus ganancias hasta 3 veces al día con una pequeña comisión.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section>
            <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FFC107]" />
              Pasajeros y Viajes
            </h3>
            <Accordion type="single" collapsible className="bg-white rounded-xl shadow-sm border border-gray-100 px-4">
              <AccordionItem value="item-3" className="border-b-gray-100">
                <AccordionTrigger className="hover:no-underline py-4 font-medium text-gray-800">
                  ¿Qué hago si el pasajero no aparece?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  Debes esperar 5 minutos en el punto de recogida. Después de ese tiempo, puedes cancelar el viaje seleccionando "Pasajero no se presentó" y recibirás una tarifa de cancelación.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4" className="border-b-0">
                <AccordionTrigger className="hover:no-underline py-4 font-medium text-gray-800">
                  El pasajero ensució mi vehículo
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  Toma fotos del daño inmediatamente y repórtalo en la sección "Ayuda con un viaje". Evaluaremos el caso para aplicar una tarifa de limpieza si corresponde.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section>
            <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#FFC107]" />
              Seguridad
            </h3>
            <Accordion type="single" collapsible className="bg-white rounded-xl shadow-sm border border-gray-100 px-4">
              <AccordionItem value="item-5" className="border-b-gray-100">
                <AccordionTrigger className="hover:no-underline py-4 font-medium text-gray-800">
                  Botón de pánico y contactos de confianza
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  Durante un viaje, puedes presionar el escudo azul para compartir tu ubicación en tiempo real o llamar directamente al 911 en caso de emergencia.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </div>

        {/* Contact Support */}
        <div className="mt-8 mb-6">
          <Button className="w-full bg-black text-white hover:bg-gray-800 h-12 rounded-xl font-bold shadow-lg">
            Contactar Soporte 24/7
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
