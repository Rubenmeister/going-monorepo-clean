import { ArrowLeft, MapPin, Clock, Star, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const TOURS = [
  {
    id: 1,
    title: "Aventura en el Cotopaxi",
    location: "Latacunga",
    duration: "1 día",
    rating: 4.8,
    reviews: 124,
    price: 45,
    image: "https://images.unsplash.com/photo-1589553416260-f586c8f1514f?q=80&w=800&auto=format&fit=crop",
    tags: ["Montaña", "Senderismo", "Naturaleza"]
  },
  {
    id: 2,
    title: "Tour Histórico por Quito",
    location: "Quito Centro",
    duration: "4 horas",
    rating: 4.9,
    reviews: 89,
    price: 25,
    image: "https://images.unsplash.com/photo-1568632234165-4e1840175f21?q=80&w=800&auto=format&fit=crop",
    tags: ["Cultura", "Historia", "Urbano"]
  },
  {
    id: 3,
    title: "Ruta de las Cascadas",
    location: "Baños",
    duration: "6 horas",
    rating: 4.7,
    reviews: 215,
    price: 35,
    image: "https://images.unsplash.com/photo-1564951434112-64d74cc2a2d7?q=80&w=800&auto=format&fit=crop",
    tags: ["Aventura", "Agua", "Relax"]
  },
  {
    id: 4,
    title: "Snorkeling en Galápagos",
    location: "Santa Cruz",
    duration: "5 horas",
    rating: 5.0,
    reviews: 342,
    price: 120,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
    tags: ["Playa", "Fauna", "Exclusivo"]
  },
];

interface ToursScreenProps {
  onBack: () => void;
}

export default function ToursScreen({ onBack }: ToursScreenProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 flex items-center gap-3 shadow-sm">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-6 h-6 text-charcoal" />
        </Button>
        <h1 className="text-lg font-bold text-charcoal">Explorar Tours</h1>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6 pb-20">
          {/* Featured Banner */}
          <div className="relative h-48 rounded-2xl overflow-hidden shadow-md">
            <img 
              src="https://images.unsplash.com/photo-1508233620467-f79f1e317a05?q=80&w=800&auto=format&fit=crop" 
              alt="Featured Tour" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
              <Badge className="self-start mb-2 bg-primary text-white border-none">Destacado del Mes</Badge>
              <h2 className="text-white text-xl font-bold">Laguna del Quilotoa</h2>
              <p className="text-white/90 text-sm">Descubre el cráter turquesa más impresionante de los Andes.</p>
            </div>
          </div>

          {/* Filters (Visual only for prototype) */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {["Todos", "Aventura", "Cultura", "Relax", "Gastronomía"].map((filter, i) => (
              <Button 
                key={filter} 
                variant={i === 0 ? "default" : "outline"} 
                size="sm" 
                className={`rounded-full px-4 ${i === 0 ? "bg-charcoal text-white" : "bg-white border-gray-200 text-gray-600"}`}
              >
                {filter}
              </Button>
            ))}
          </div>

          {/* Tours List */}
          <div className="grid gap-4">
            {TOURS.map((tour) => (
              <div key={tour.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
                <div className="relative h-40">
                  <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold">{tour.rating}</span>
                    <span className="text-[10px] text-muted-foreground">({tour.reviews})</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-charcoal text-lg leading-tight">{tour.title}</h3>
                      <span className="font-bold text-primary text-lg">${tour.price}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs">{tour.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{tour.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Disponibilidad diaria</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {tour.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Button className="w-full mt-2 font-bold rounded-xl">
                    Reservar Ahora
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
