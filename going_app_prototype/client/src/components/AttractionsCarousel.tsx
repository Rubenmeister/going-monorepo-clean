import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const ATTRACTIONS = [
  {
    id: 1,
    name: "Cotopaxi",
    location: "Latacunga",
    image: "https://images.unsplash.com/photo-1589553416260-f586c8f1514f?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Islas Galápagos",
    location: "Galápagos",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Mitad del Mundo",
    location: "Quito",
    image: "https://images.unsplash.com/photo-1568632234165-4e1840175f21?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Baños de Agua Santa",
    location: "Tungurahua",
    image: "https://images.unsplash.com/photo-1564951434112-64d74cc2a2d7?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 5,
    name: "Quilotoa",
    location: "Cotopaxi",
    image: "https://images.unsplash.com/photo-1508233620467-f79f1e317a05?q=80&w=600&auto=format&fit=crop",
  },
];

export default function AttractionsCarousel() {
  const [width, setWidth] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (carouselRef.current) {
      setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
    }
  }, []);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-charcoal">Destinos Populares</h3>
        <span className="text-xs text-primary font-medium cursor-pointer hover:underline">Ver todos</span>
      </div>
      
      <motion.div 
        ref={carouselRef} 
        className="cursor-grab overflow-hidden"
        whileTap={{ cursor: "grabbing" }}
      >
        <motion.div 
          drag="x" 
          dragConstraints={{ right: 0, left: -width }}
          className="flex gap-3"
        >
          {ATTRACTIONS.map((attraction) => (
            <motion.div 
              key={attraction.id} 
              className="relative min-w-[140px] h-[180px] rounded-xl overflow-hidden shadow-md group"
            >
              <img 
                src={attraction.image} 
                alt={attraction.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                draggable="false"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute bottom-0 left-0 p-3 w-full">
                <h4 className="text-white font-bold text-sm leading-tight mb-0.5">{attraction.name}</h4>
                <div className="flex items-center gap-1 text-white/80">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[10px] font-medium">{attraction.location}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
