import { useState } from "react";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Clock, ChevronRight, Star, CreditCard, Edit2, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import TripReceipt from "./TripReceipt";

// Mock Data
const INITIAL_USER_PROFILE = {
  name: "Juan Pérez",
  email: "juan.perez@example.com",
  phone: "+593 99 123 4567",
  rating: 4.8,
  tripsCount: 12,
  memberSince: "Oct 2023",
  avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop"
};

const TRIP_HISTORY = [
  {
    id: 101,
    date: "08 Dic 2025",
    time: "14:30",
    origin: "Quito, Av. Amazonas",
    destination: "Aeropuerto Mariscal Sucre",
    price: 25.00,
    status: "completed",
    driver: "Carlos M.",
    rating: 5
  },
  {
    id: 102,
    date: "01 Dic 2025",
    time: "09:15",
    origin: "Cumbayá, Parque Central",
    destination: "Centro Histórico",
    price: 12.50,
    status: "completed",
    driver: "Ana R.",
    rating: 4
  },
  {
    id: 103,
    date: "20 Nov 2025",
    time: "18:45",
    origin: "Mall El Jardín",
    destination: "Condado Shopping",
    price: 8.75,
    status: "cancelled",
    driver: "Luis P.",
    rating: null
  }
];

const PAYMENT_METHODS = [
  { id: 1, type: "visa", last4: "4242", expiry: "12/28", icon: CreditCard },
  { id: 2, type: "mastercard", last4: "8888", expiry: "09/26", icon: CreditCard },
];

interface ProfileScreenProps {
  onBack: () => void;
}

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [user, setUser] = useState(INITIAL_USER_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(INITIAL_USER_PROFILE);

  const handleSaveProfile = () => {
    setUser(editForm);
    setIsEditing(false);
  };

  if (selectedTripId) {
    return <TripReceipt tripId={selectedTripId} onBack={() => setSelectedTripId(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 flex items-center gap-3 shadow-sm">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-6 h-6 text-charcoal" />
        </Button>
        <h1 className="text-lg font-bold text-charcoal">Mi Cuenta</h1>
        <div className="ml-auto">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => setEditForm(user)}>
                <Edit2 className="w-4 h-4 mr-1" /> Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Editar Perfil</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={editForm.avatar} />
                      <AvatarFallback>{editForm.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full w-8 h-8">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input 
                    id="name" 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={editForm.email} 
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={editForm.phone} 
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})} 
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSaveProfile}>Guardar Cambios</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6 pb-20">
          
          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <Avatar className="w-24 h-24 border-4 border-gray-50 shadow-md">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded-full shadow-sm border border-gray-100 flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-bold text-charcoal">{user.rating}</span>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-charcoal mb-1">{user.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">Miembro desde {user.memberSince}</p>

            <div className="w-full space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs text-muted-foreground">Correo Electrónico</p>
                  <p className="text-sm font-medium text-charcoal truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="text-sm font-medium text-charcoal">{user.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-charcoal text-lg">Métodos de Pago</h3>
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 h-8">
                <Plus className="w-4 h-4 mr-1" /> Agregar
              </Button>
            </div>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <Card key={method.id} className="border-gray-100 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <method.icon className="w-5 h-5 text-charcoal" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-charcoal capitalize">{method.type} •••• {method.last4}</p>
                      <p className="text-xs text-muted-foreground">Expira {method.expiry}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-400">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Trip History Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-charcoal text-lg">Historial de Viajes</h3>
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                {user.tripsCount} Viajes
              </Badge>
            </div>

            <div className="space-y-3">
              {TRIP_HISTORY.map((trip) => (
                <Card 
                  key={trip.id} 
                  className="border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setSelectedTripId(trip.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`
                            ${trip.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            ${trip.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                          `}
                        >
                          {trip.status === 'completed' ? 'Completado' : 'Cancelado'}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {trip.date}
                        </span>
                      </div>
                      <span className="font-bold text-charcoal">${trip.price.toFixed(2)}</span>
                    </div>

                    <div className="relative pl-4 space-y-4 border-l-2 border-gray-100 ml-1.5 my-2">
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-primary bg-white" />
                        <p className="text-sm font-medium text-charcoal leading-none">{trip.origin}</p>
                        <p className="text-xs text-muted-foreground mt-1">{trip.time}</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-secondary bg-white" />
                        <p className="text-sm font-medium text-charcoal leading-none">{trip.destination}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                          {trip.driver.charAt(0)}
                        </div>
                        <span className="text-xs text-gray-600">Conductor: {trip.driver}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Button variant="outline" className="w-full mt-4 text-primary border-primary/20 hover:bg-primary/5">
              Ver todos los viajes <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
