import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DriverStartScreenProps {
  onLogin: () => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}

export default function DriverStartScreen({ onLogin, onRegister, onForgotPassword }: DriverStartScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ username?: boolean; password?: boolean }>({});

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {};
    let isValid = true;

    if (!username.trim()) {
      newErrors.username = "El usuario es requerido";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "La contraseña es requerida";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true });
    
    if (validate()) {
      onLogin();
    }
  };

  const handleBlur = (field: "username" | "password") => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col min-h-screen bg-[#FFC107] items-center justify-center p-6 relative"
    >
      {/* Status Bar Mockup */}
      <div className="absolute top-0 w-full h-12 flex justify-between px-6 items-center text-black/80 text-xs">
        <span>10:10</span>
        <div className="flex gap-1">
          <span>Signal</span>
          <span>Wifi</span>
          <span>Bat</span>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo Section */}
        <div className="relative mb-4 flex flex-col items-center">
             <img 
               src="/logo_black_symbol_black_text.png" 
               alt="Going Driver" 
               className="h-32 w-auto object-contain mb-2" 
             />
             <span className="text-black font-bold text-xl tracking-widest uppercase">Conductor</span>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-black mb-1">Gana dinero conduciendo</h2>
          <p className="text-black/70 text-sm">Gestiona tu tiempo y tus ingresos</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4" noValidate>
          <div className="space-y-4">
            <div className="space-y-1">
              <Input
                type="text"
                placeholder="Usuario o Email"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (touched.username) validate();
                }}
                onBlur={() => handleBlur("username")}
                className={cn(
                  "bg-white/90 border-0 h-12 text-base placeholder:text-gray-500 rounded-lg transition-all text-black",
                  errors.username && touched.username ? "ring-2 ring-red-500 bg-white" : ""
                )}
              />
              {errors.username && touched.username && (
                <motion.span 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-xs font-bold ml-1 block"
                >
                  {errors.username}
                </motion.span>
              )}
            </div>

            <div className="space-y-1">
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) validate();
                }}
                onBlur={() => handleBlur("password")}
                className={cn(
                  "bg-white/90 border-0 h-12 text-base placeholder:text-gray-500 rounded-lg transition-all text-black",
                  errors.password && touched.password ? "ring-2 ring-red-500 bg-white" : ""
                )}
              />
              {errors.password && touched.password && (
                <motion.span 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-xs font-bold ml-1 block"
                >
                  {errors.password}
                </motion.span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button 
              type="button"
              className="text-black text-sm font-semibold hover:underline underline-offset-4"
              onClick={onForgotPassword}
            >
              ¿Olvidaste tu contraseña?
            </button>
            <div className="flex flex-col items-end">
              <span className="text-black/80 text-sm">¿Quieres ser conductor?</span>
              <button 
                type="button"
                className="text-black text-sm font-bold hover:underline underline-offset-4"
                onClick={onRegister}
              >
                Regístrate para conducir
              </button>
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full bg-black text-white hover:bg-black/80 font-medium text-base h-12 rounded-xl mt-4 shadow-lg font-display"
          >
            Iniciar Sesión
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
