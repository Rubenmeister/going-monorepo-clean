import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Map, Activity, CreditCard, AlertTriangle, User, Users, Share2 } from "lucide-react";

const SERVICES = [
  { icon: User, label: "Mi Cuenta", description: "Perfil e historial" },
  { icon: Users, label: "Anfitriones", description: "Alojamientos soñados" },
  { icon: Map, label: "Tours", description: "Explora experiencias únicas" },
  { icon: Activity, label: "Actividades", description: "Experiencias locales" },
  { icon: Share2, label: "Comparte tu viaje", description: "Con personas de confianza" },
  { icon: CreditCard, label: "Pagos", description: "Gestiona tu billetera" },
  { icon: AlertTriangle, label: "S.O.S.", description: "Ayuda de emergencia", color: "text-red-500" },
];

interface SidebarMenuProps {
  onNavigate?: (screen: string) => void;
}

export default function SidebarMenu({ onNavigate }: SidebarMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-charcoal hover:bg-gray-100">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] bg-white border-r border-gray-200">
        <SheetHeader className="mb-6 text-left">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.png" alt="Going" className="h-8 w-auto" />
            <SheetTitle className="font-display text-xl font-bold text-charcoal">Servicios</SheetTitle>
          </div>
          <p className="text-sm text-muted-foreground">Todo lo que necesitas para tu viaje</p>
        </SheetHeader>
        
        <div className="flex flex-col gap-2">
          {SERVICES.map((service, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start h-auto py-3 px-4 hover:bg-gray-50 rounded-xl transition-all group"
              onClick={() => {
                if (onNavigate) {
                  if (service.label === "Tours") onNavigate("tours");
                  if (service.label === "Mi Cuenta") onNavigate("profile");
                  if (service.label === "Anfitriones") onNavigate("hosts");
                }
              }}
            >
              <div className={`p-2 rounded-lg bg-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all mr-4 ${service.color || "text-charcoal"}`}>
                <service.icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className={`font-bold text-sm ${service.color || "text-charcoal"}`}>{service.label}</span>
                <span className="text-xs text-muted-foreground font-medium">{service.description}</span>
              </div>
            </Button>
          ))}
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="font-bold text-sm text-charcoal mb-1">¿Necesitas ayuda?</h4>
            <p className="text-xs text-muted-foreground mb-3">Contacta con nuestro soporte 24/7</p>
            <Button 
              variant="outline" 
              className="w-full text-xs h-8 bg-white border-gray-200 hover:bg-gray-50"
              onClick={() => onNavigate && onNavigate("help")}
            >
              Contactar Soporte
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
