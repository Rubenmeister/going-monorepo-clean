import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";

interface RegisterScreenProps {
  onRegister: () => void;
  onBack: () => void;
}

export default function RegisterScreen({ onRegister, onBack }: RegisterScreenProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
      isValid = false;
    } else if (!/^\d{9,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = "Teléfono inválido";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "El correo es requerido";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Correo inválido";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);
    
    if (validate()) {
      onRegister();
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) validate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-screen bg-[#FF4E43] items-center p-6 relative"
    >
      {/* Status Bar Mockup */}
      <div className="absolute top-0 w-full h-12 flex justify-between px-6 items-center text-white/80 text-xs z-10">
        <span>10:10</span>
        <div className="flex gap-1">
          <span>Signal</span>
          <span>Wifi</span>
          <span>Bat</span>
        </div>
      </div>

      {/* Header */}
      <div className="w-full max-w-sm flex items-center mt-8 mb-6 relative">
        <button 
          onClick={onBack}
          className="absolute left-0 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="w-full text-center text-white text-2xl font-display font-bold">Crear Cuenta</h1>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-6 flex-1">
        {/* Register Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4" noValidate>
          
          {/* Name Field */}
          <div className="space-y-1">
            <Input
              type="text"
              placeholder="Nombre completo"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              className={cn(
                "bg-white/90 border-0 h-10 text-base placeholder:text-gray-500 rounded-lg transition-all",
                errors.name && touched.name ? "ring-2 ring-yellow-400 bg-white" : ""
              )}
            />
            {errors.name && touched.name && (
              <motion.span 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white text-xs font-bold ml-1 block"
              >
                {errors.name}
              </motion.span>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-1">
            <Input
              type="tel"
              placeholder="Teléfono móvil"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              onBlur={() => handleBlur("phone")}
              className={cn(
                "bg-white/90 border-0 h-10 text-base placeholder:text-gray-500 rounded-lg transition-all",
                errors.phone && touched.phone ? "ring-2 ring-yellow-400 bg-white" : ""
              )}
            />
            {errors.phone && touched.phone && (
              <motion.span 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white text-xs font-bold ml-1 block"
              >
                {errors.phone}
              </motion.span>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-1">
            <Input
              type="email"
              placeholder="Correo electrónico"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              className={cn(
                "bg-white/90 border-0 h-10 text-base placeholder:text-gray-500 rounded-lg transition-all",
                errors.email && touched.email ? "ring-2 ring-yellow-400 bg-white" : ""
              )}
            />
            {errors.email && touched.email && (
              <motion.span 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white text-xs font-bold ml-1 block"
              >
                {errors.email}
              </motion.span>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <Input
              type="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
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

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <Input
              type="password"
              placeholder="Confirmar contraseña"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              onBlur={() => handleBlur("confirmPassword")}
              className={cn(
                "bg-white/90 border-0 h-10 text-base placeholder:text-gray-500 rounded-lg transition-all",
                errors.confirmPassword && touched.confirmPassword ? "ring-2 ring-yellow-400 bg-white" : ""
              )}
            />
            {errors.confirmPassword && touched.confirmPassword && (
              <motion.span 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white text-xs font-bold ml-1 block"
              >
                {errors.confirmPassword}
              </motion.span>
            )}
          </div>

          <Button 
            type="submit"
            className="w-full bg-black text-white hover:bg-black/80 font-medium text-base h-12 rounded-xl mt-6 shadow-lg font-display"
          >
            Crear Cuenta
          </Button>
        </form>

        {/* Social Register */}
        <div className="w-full flex flex-col gap-3">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-full border-t border-white/30"></div>
            <span className="relative bg-[#FF4E43] px-2 text-white/80 text-xs">O regístrate con</span>
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

        <div className="mt-auto mb-8 text-center">
          <p className="text-white/80 text-xs px-8">
            Al registrarte, aceptas nuestros <span className="underline font-bold">Términos de Servicio</span> y <span className="underline font-bold">Política de Privacidad</span>.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
