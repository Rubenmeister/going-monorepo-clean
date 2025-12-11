import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

interface ResetPasswordScreenProps {
  onResetSuccess: () => void;
  onBack: () => void;
}

export default function ResetPasswordScreen({ onResetSuccess, onBack }: ResetPasswordScreenProps) {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

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
      // Simulate API call
      setTimeout(() => {
        setIsSuccess(true);
        // Auto navigate after showing success message
        setTimeout(() => {
          onResetSuccess();
        }, 2000);
      }, 1000);
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

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col min-h-screen bg-[#FF4E43] items-center justify-center p-6 relative"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-3xl p-8 flex flex-col items-center text-center max-w-xs w-full shadow-2xl"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">¡Contraseña Actualizada!</h2>
          <p className="text-gray-600 text-sm">
            Tu contraseña ha sido restablecida exitosamente.
          </p>
        </motion.div>
      </motion.div>
    );
  }

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
        <h1 className="w-full text-center text-white text-2xl font-display font-bold">Nueva Contraseña</h1>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-6 flex-1">
        <p className="text-white/90 text-center text-sm px-4">
          Crea una nueva contraseña segura para tu cuenta.
        </p>

        {/* Reset Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4" noValidate>
          
          {/* Password Field */}
          <div className="space-y-1">
            <Input
              type="password"
              placeholder="Nueva contraseña"
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
              placeholder="Confirmar nueva contraseña"
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
            Restablecer Contraseña
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
