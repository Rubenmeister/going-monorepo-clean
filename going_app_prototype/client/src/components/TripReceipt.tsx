import { ArrowLeft, Download, Share2, MapPin, Calendar, Clock, CreditCard, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface TripReceiptProps {
  tripId: number;
  onBack: () => void;
}

// Mock data fetcher based on ID
const getTripDetails = (id: number) => {
  return {
    id: id,
    date: "08 Dic 2025",
    time: "14:30",
    origin: "Quito, Av. Amazonas",
    destination: "Aeropuerto Mariscal Sucre",
    price: 25.00,
    status: "completed",
    driver: "Carlos M.",
    vehicle: "Chevrolet Sail - PBC-1234",
    paymentMethod: "Tarjeta Visa **** 4242",
    duration: "45 min",
    distance: "35 km",
    breakdown: {
      baseFare: 20.00,
      serviceFee: 2.50,
      taxes: 2.50
    }
  };
};

export default function TripReceipt({ tripId, onBack }: TripReceiptProps) {
  const trip = getTripDetails(tripId);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 flex items-center gap-3 shadow-sm">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-6 h-6 text-charcoal" />
        </Button>
        <h1 className="text-lg font-bold text-charcoal">Detalle del Viaje</h1>
      </header>

      <div className="flex-1 p-4 pb-20 overflow-y-auto">
        <Card className="max-w-md mx-auto shadow-sm border-gray-100">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-charcoal">${trip.price.toFixed(2)}</CardTitle>
            <p className="text-sm text-muted-foreground">{trip.date} • {trip.time}</p>
            <Badge variant="outline" className="mx-auto mt-2 bg-green-50 text-green-700 border-green-200">
              Pagado con {trip.paymentMethod}
            </Badge>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Route */}
            <div className="relative pl-4 space-y-6 border-l-2 border-gray-100 ml-2 mt-4">
              <div className="relative">
                <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full border-4 border-primary bg-white" />
                <p className="text-xs text-muted-foreground mb-1">Origen</p>
                <p className="text-sm font-medium text-charcoal leading-tight">{trip.origin}</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full border-4 border-secondary bg-white" />
                <p className="text-xs text-muted-foreground mb-1">Destino</p>
                <p className="text-sm font-medium text-charcoal leading-tight">{trip.destination}</p>
              </div>
            </div>

            <Separator />

            {/* Driver Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-charcoal">Viajaste con {trip.driver}</p>
                <p className="text-xs text-muted-foreground">{trip.vehicle}</p>
              </div>
            </div>

            <Separator />

            {/* Breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Tarifa base</span>
                <span>${trip.breakdown.baseFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tarifa de servicio</span>
                <span>${trip.breakdown.serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Impuestos</span>
                <span>${trip.breakdown.taxes.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-charcoal text-base">
                <span>Total</span>
                <span>${trip.price.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" className="w-full gap-2">
                <Download className="w-4 h-4" /> Recibo
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <Share2 className="w-4 h-4" /> Compartir
              </Button>
            </div>
            
            <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 text-xs h-auto py-2">
              Reportar un problema con este viaje
            </Button>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
