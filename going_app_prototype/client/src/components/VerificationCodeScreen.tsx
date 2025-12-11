import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface VerificationCodeScreenProps {
  email: string;
  onVerify: () => void;
  onBack: () => void;
}

export default function VerificationCodeScreen({ email, onVerify, onBack }: VerificationCodeScreenProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple chars

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    const newCode = [...code];
    
    pastedData.forEach((char, index) => {
      if (index < 6) newCode[index] = char;
    });
    
    setCode(newCode);
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    
    if (fullCode.length < 6) {
      setError("Por favor ingresa el código completo");
      return;
    }

    // Simulate verification
    if (fullCode === "123456") {
      onVerify();
    } else {
      setError("Código incorrecto. Intenta nuevamente.");
    }
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
        <h1 className="w-full text-center text-white text-2xl font-display font-bold">Verificación</h1>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-6 flex-1">
        <div className="text-center space-y-2">
          <p className="text-white/90 text-sm px-4">
            Ingresa el código de 6 dígitos que enviamos a
          </p>
          <p className="text-white font-bold text-base">{email}</p>
        </div>

        {/* Code Input Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8 mt-4">
          
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={cn(
                  "w-12 h-14 text-center text-2xl font-bold bg-white/90 border-0 rounded-lg transition-all focus:ring-2 focus:ring-white focus:bg-white",
                  error ? "ring-2 ring-yellow-400 bg-white" : ""
                )}
              />
            ))}
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-sm font-bold text-center bg-black/20 py-2 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          <div className="flex flex-col gap-4">
            <Button 
              type="submit"
              className="w-full bg-black text-white hover:bg-black/80 font-medium text-base h-12 rounded-xl shadow-lg font-display"
            >
              Verificar Código
            </Button>

            <button 
              type="button"
              className="text-white text-sm font-medium hover:underline underline-offset-4"
              onClick={() => console.log("Resend code")}
            >
              ¿No recibiste el código? Reenviar
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
