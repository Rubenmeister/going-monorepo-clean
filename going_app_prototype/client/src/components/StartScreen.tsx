import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";

interface StartScreenProps {
  onStart: () => void;
  onRegister: () => void;
  onForgotPassword: () => void;
  onDriverRegister: () => void;
}

export default function StartScreen({ onStart, onRegister, onForgotPassword, onDriverRegister }: StartScreenProps) {
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
    } else if (password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true });
    
    if (validate()) {
      onStart();
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
      className="flex flex-col min-h-screen bg-[#FF4E43] items-center justify-center p-6 relative"
    >
      {/* Status Bar Mockup */}
      <div className="absolute top-0 w-full h-12 flex justify-between px-6 items-center text-white/80 text-xs">
        <span>10:10</span>
        <div className="flex gap-1">
          <span>Signal</span>
          <span>Wifi</span>
          <span>Bat</span>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo Section */}
        <div className="relative mb-4">
             <img 
               src="/logo_white_symbol_black_text.png" 
               alt="Going" 
               className="h-40 w-auto object-contain" 
             />
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4" noValidate>
          <div className="space-y-4">
            <div className="space-y-1">
              <Input
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (touched.username) validate();
                }}
                onBlur={() => handleBlur("username")}
                className={cn(
                  "bg-white/90 border-0 h-10 text-base placeholder:text-gray-500 rounded-lg transition-all",
                  errors.username && touched.username ? "ring-2 ring-yellow-400 bg-white" : ""
                )}
              />
              {errors.username && touched.username && (
                <motion.span 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-white text-xs font-bold ml-1 block"
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
                  "bg-white/90 border-0 h-10 text-base placeholder:text-gray-500 rounded-lg transition-all",
                  errors.password && touched.password ? "ring-2 ring-yellow-400 bg-white" : ""
                )}
              />
              {errors.password && touched.password && (
                <motion.span 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-white text-xs font-bold ml-1 block"
                >
                  {errors.password}
                </motion.span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button 
              type="button"
              className="text-white text-sm font-semibold hover:underline underline-offset-4"
              onClick={onForgotPassword}
            >
              ¿Olvidaste tu contraseña?
            </button>
            <div className="flex flex-col items-end">
              <span className="text-white/90 text-sm">¿Aún no te has registrado?</span>
              <button 
                type="button"
                className="text-white text-sm font-bold hover:underline underline-offset-4"
                onClick={onRegister}
              >
                Regístrate aquí en dos pasos
              </button>
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full bg-black text-white hover:bg-black/80 font-medium text-base h-12 rounded-xl mt-2 shadow-lg font-display"
          >
            Iniciar Sesión
          </Button>
          

        </form>

        {/* Social Login */}
        <div className="w-full flex flex-col gap-3">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-full border-t border-white/30"></div>
            <span className="relative bg-[#FF4E43] px-2 text-white/80 text-xs">O continúa con</span>
          </div>
          
          <div className="flex gap-3 justify-center">
            <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform">
              <FaGoogle className="w-5 h-5 text-gray-800" />
            </button>
            <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform">
              <FaFacebook className="w-5 h-5 text-[#1877F2]" />
            </button>
            <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform">
              <FaApple className="w-6 h-6 text-black" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
