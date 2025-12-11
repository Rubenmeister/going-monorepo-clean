import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Star, MapPin, Heart, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/Map";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Host {
  id: string;
  title: string;
  type: string;
  rating: number;
  reviews: number;
  price: number;
  image: string;
  location: { lat: number; lng: number };
  address: string;
  features: string[];
}

const SAMPLE_HOSTS: Host[] = [
  {
    id: "1",
    title: "Cabaña Mirador del Volcán",
    type: "Cabaña",
    rating: 4.9,
    reviews: 128,
    price: 85,
    image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=2070&auto=format&fit=crop",
    location: { lat: -0.6838, lng: -78.4372 }, // Cotopaxi area
    address: "Parque Nacional Cotopaxi, Ecuador",
    features: ["Vista al volcán", "Chimenea", "Jacuzzi"]
  },
  {
    id: "2",
    title: "Villa Colonial en el Centro",
    type: "Villa",
    rating: 4.8,
    reviews: 95,
    price: 120,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1974&auto=format&fit=crop",
    location: { lat: -0.2200, lng: -78.5120 }, // Quito Centro Histórico
    address: "Centro Histórico, Quito",
    features: ["Patio interno", "WiFi de alta velocidad", "Cocina completa"]
  },
  {
    id: "3",
    title: "Eco-Lodge Amazónico",
    type: "Lodge",
    rating: 5.0,
    reviews: 210,
    price: 150,
    image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2070&auto=format&fit=crop",
    location: { lat: -1.0546, lng: -77.7932 }, // Tena area
    address: "Tena, Napo",
    features: ["Acceso al río", "Desayuno incluido", "Tours guiados"]
  },
  {
    id: "4",
    title: "Suite de Lujo con Vista al Mar",
    type: "Apartamento",
    rating: 4.7,
    reviews: 84,
    price: 95,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto=format&fit=crop",
    location: { lat: -2.1962, lng: -80.9585 }, // Salinas area
    address: "Salinas, Santa Elena",
    features: ["Piscina infinita", "Gimnasio", "Acceso a playa"]
  }
];

interface HostsScreenProps {
  onBack: () => void;
}

export default function HostsScreen({ onBack }: HostsScreenProps) {
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    // Add markers for each host
    SAMPLE_HOSTS.forEach(host => {
      const priceTag = document.createElement("div");
      priceTag.className = "bg-white px-3 py-1 rounded-full shadow-md font-bold text-sm border border-gray-200 hover:scale-110 transition-transform cursor-pointer";
      priceTag.innerHTML = `$${host.price}`;
      
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: host.location,
        content: priceTag,
        title: host.title,
      });

      marker.addListener("click", () => {
        setSelectedHost(host);
        map.panTo(host.location);
        map.setZoom(14);
      });

      markersRef.current.push(marker);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      className="fixed inset-0 bg-gray-50 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 font-display">Alojamientos soñados</h1>
            <p className="text-xs text-gray-500">Encuentra tu lugar ideal</p>
          </div>
        </div>
        <Button variant="outline" size="icon" className="rounded-full">
          <Filter className="w-5 h-5 text-gray-600" />
        </Button>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapView
          className="w-full h-full"
          initialCenter={{ lat: -1.8312, lng: -78.1834 }} // Center of Ecuador
          initialZoom={7}
          onMapReady={handleMapReady}
        />

        {/* Selected Host Card Overlay */}
        {selectedHost && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-6 left-4 right-4 bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="relative h-40">
              <img 
                src={selectedHost.image} 
                alt={selectedHost.title} 
                className="w-full h-full object-cover"
              />
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full"
              >
                <Heart className="w-5 h-5 text-gray-600" />
              </Button>
              <Badge className="absolute bottom-2 left-2 bg-white/90 text-black hover:bg-white">
                {selectedHost.type}
              </Badge>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 leading-tight">{selectedHost.title}</h3>
                  <div className="flex items-center text-gray-500 text-sm mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {selectedHost.address}
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-sm">{selectedHost.rating}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {selectedHost.features.map((feature, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md whitespace-nowrap">
                    {feature}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <span className="text-lg font-bold text-gray-900">${selectedHost.price}</span>
                  <span className="text-sm text-gray-500"> / noche</span>
                </div>
                <Button className="bg-black text-white hover:bg-gray-800 rounded-xl px-6">
                  Reservar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
