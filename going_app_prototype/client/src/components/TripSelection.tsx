import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, Users, User, ArrowRight, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { MapView } from "@/components/Map";
import AttractionsCarousel from "./AttractionsCarousel";
import SidebarMenu from "./SidebarMenu";

interface TripSelectionProps {
  onNavigate?: (screen: string) => void;
}

export default function TripSelection({ onNavigate }: TripSelectionProps) {
  const [tripType, setTripType] = useState("shared");
  const [passengers, setPassengers] = useState(1);
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleIncrement = () => {
    if (passengers < 6) setPassengers(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (passengers > 1) setPassengers(prev => prev - 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen relative overflow-hidden"
    >
      {/* Background Map */}
      <div className="absolute inset-0 z-0">
        <MapView 
          className="w-full h-full"
          initialZoom={14}
          initialCenter={{ lat: -0.1807, lng: -78.4678 }} // Quito, Ecuador (as per brand guidelines example)
          onMapReady={(map) => {
            mapRef.current = map;
            // Optional: Add custom styles to remove POIs for cleaner look
            map.setOptions({
              disableDefaultUI: true,
              zoomControl: false,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            });
          }}
        />
        {/* Overlay Gradient to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/50 to-white/90 pointer-events-none" />
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-border p-4 sticky top-0 z-20 shadow-sm">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-3">
            <SidebarMenu onNavigate={onNavigate} />
            <img src="/logo.png" alt="Going" className="h-8 w-auto" />
          </div>
          <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-bold border border-secondary">
            US
          </div>
        </div>
      </header>

      <main className="flex-1 container p-4 flex flex-col gap-6 max-w-md mx-auto mt-4 z-10 relative">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-display font-bold text-charcoal">¿A dónde vamos?</h1>
          <p className="text-sm text-muted-foreground font-medium">Configura tu viaje</p>
        </div>

        <Card className="border-none shadow-xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-5 space-y-5">
            {/* Locations */}
            <div className="space-y-4 relative">
              <div className="absolute left-3 top-3 bottom-12 w-0.5 bg-gray-200 -z-10" />
              
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground font-bold ml-8 tracking-wider">Origen</Label>
                <div className="flex gap-3 items-center">
                  <div className="w-6 h-6 rounded-full border-[3px] border-primary bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <Input placeholder="¿Desde dónde sales?" className="h-11 text-base bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground font-bold ml-8 tracking-wider">Destino</Label>
                <div className="flex gap-3 items-center">
                  <div className="w-6 h-6 rounded-full border-[3px] border-secondary bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <MapPin size={12} className="text-black fill-black" />
                  </div>
                  <Input placeholder="¿A dónde quieres ir?" className="h-11 text-base bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
                </div>
              </div>
            </div>

            {/* Passengers Selector */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pasajeros</Label>
              <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200">
                <span className="text-sm font-medium ml-2 text-charcoal">Número de personas</span>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full border-gray-300 hover:bg-white hover:border-primary hover:text-primary transition-colors"
                    onClick={handleDecrement}
                    disabled={passengers <= 1}
                  >
                    <Minus size={14} />
                  </Button>
                  <span className="w-4 text-center font-bold text-lg">{passengers}</span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full border-gray-300 hover:bg-white hover:border-primary hover:text-primary transition-colors"
                    onClick={handleIncrement}
                    disabled={passengers >= 6}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Trip Type */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Viaje</Label>
              <RadioGroup defaultValue="shared" onValueChange={setTripType} className="grid grid-cols-2 gap-3">
                <div>
                  <RadioGroupItem value="shared" id="shared" className="peer sr-only" />
                  <Label
                    htmlFor="shared"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-transparent bg-gray-50 p-3 hover:bg-gray-100 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary cursor-pointer transition-all h-full"
                  >
                    <Users className="mb-1 h-5 w-5" />
                    <span className="font-bold text-sm">Compartido</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 text-center leading-tight">Ahorra viajando con otros</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="private" id="private" className="peer sr-only" />
                  <Label
                    htmlFor="private"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-transparent bg-gray-50 p-3 hover:bg-gray-100 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary cursor-pointer transition-all h-full"
                  >
                    <User className="mb-1 h-5 w-5" />
                    <span className="font-bold text-sm">Privado</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 text-center leading-tight">Viaje exclusivo para ti</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button className="w-full h-12 text-base font-bold mt-2 gap-2 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
              Buscar Conductores <ArrowRight size={18} />
            </Button>

            {/* Attractions Carousel */}
            <div className="pt-2 border-t border-gray-100">
              <AttractionsCarousel />
            </div>
          </CardContent>
        </Card>
      </main>
    </motion.div>
  );
}
