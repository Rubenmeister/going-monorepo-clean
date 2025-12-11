import { motion } from "framer-motion";
import { User, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface WelcomeScreenProps {
  onSelectRole: (role: "user" | "driver") => void;
}

export default function WelcomeScreen({ onSelectRole }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col min-h-screen bg-background items-center justify-center p-6 gap-8"
    >
      <div className="text-center space-y-2">
        <img src="/logo.png" alt="Going" className="h-16 w-auto mx-auto mb-4" />
        <h1 className="text-3xl font-display font-bold text-foreground">Bienvenido</h1>
        <p className="text-muted-foreground">Selecciona tu perfil para continuar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Card 
          className="cursor-pointer hover:border-primary transition-all hover:shadow-lg group"
          onClick={() => onSelectRole("user")}
        >
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-full bg-secondary/20 text-foreground group-hover:bg-secondary group-hover:text-black transition-colors">
              <User size={40} />
            </div>
            <div>
              <h3 className="font-bold text-xl">Soy Usuario</h3>
              <p className="text-sm text-muted-foreground mt-2">Quiero viajar</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary transition-all hover:shadow-lg group"
          onClick={() => onSelectRole("driver")}
        >
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Car size={40} />
            </div>
            <div>
              <h3 className="font-bold text-xl">Soy Conductor</h3>
              <p className="text-sm text-muted-foreground mt-2">Quiero conducir</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 w-full max-w-xs">
        <Button variant="outline" className="w-full">Registrarse</Button>
        <Button className="w-full">Iniciar Sesión</Button>
      </div>
    </motion.div>
  );
}
