import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onCodeSent: (email: string) => void;
}

export default function ForgotPasswordScreen({ onBack, onCodeSent }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = () => {
    if (!email.trim()) {
      setError("El correo es requerido");
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Correo inválido");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    
    if (validate()) {
      // Simulate API call
      setTimeout(() => {
        onCodeSent(email);
      }, 1000);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validate();
  };

  const handleChange = (value: string) => {
    setEmail(value);
    if (touched) validate();
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
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

        <div className="w-full max-w-sm flex flex-col items-center justify-center flex-1 gap-6 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4"
          >
            <CheckCircle2 className="w-10 h-10 text-[#FF4E43]" />
          </motion.div>
          
          <h2 className="text-white text-2xl font-display font-bold">¡Correo enviado!</h2>
          <p className="text-white/90 text-base px-4">
            Hemos enviado las instrucciones para restablecer tu contraseña a <span className="font-bold">{email}</span>
          </p>

          <Button 
            onClick={onBack}
            className="w-full bg-black text-white hover:bg-black/80 font-medium text-base h-12 rounded-xl mt-8 shadow-lg font-display"
          >
            Volver al inicio
          </Button>
        </div>
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
        <h1 className="w-full text-center text-white text-2xl font-display font-bold">Recuperar Contraseña</h1>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-6 flex-1">
        <p className="text-white/90 text-center text-sm px-4 mb-4">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {/* Recovery Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4" noValidate>
          
          {/* Email Field */}
          <div className="space-y-1">
            <Input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              className={cn(
                "bg-white/90 border-0 h-10 text-base placeholder:text-gray-500 rounded-lg transition-all",
                error && touched ? "ring-2 ring-yellow-400 bg-white" : ""
              )}
            />
            {error && touched && (
              <motion.span 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white text-xs font-bold ml-1 block"
              >
                {error}
              </motion.span>
            )}
          </div>

          <Button 
            type="submit"
            className="w-full bg-black text-white hover:bg-black/80 font-medium text-base h-12 rounded-xl mt-6 shadow-lg font-display"
          >
            Enviar instrucciones
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
