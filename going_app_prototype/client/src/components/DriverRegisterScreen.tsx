import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, Car, FileText, ScanFace } from "lucide-react";
import DocumentUploadField from "./DocumentUploadField";
import BiometricVerification from "./BiometricVerification";

interface DriverRegisterScreenProps {
  onRegister: () => void;
  onBack: () => void;
}

export default function DriverRegisterScreen({ onRegister, onBack }: DriverRegisterScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    vehicleModel: "",
    plateNumber: "",
    licenseFile: null as File | null,
    insuranceFile: null as File | null,
    idFile: null as File | null,
    antFile: null as File | null,
    tourismFile: null as File | null,
    vehicleFront: null as File | null,
    vehicleBack: null as File | null,
    vehicleSide: null as File | null,
    vehicleInterior: null as File | null,
    profilePhoto: null as File | null,
    auditVideo: null as Blob | null
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [ocrData, setOcrData] = useState<{ idNumber?: string }>({});
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    if (!formData.name.trim()) { newErrors.name = "Requerido"; isValid = false; }
    if (!formData.phone.trim()) { newErrors.phone = "Requerido"; isValid = false; }
    if (!formData.email.trim()) { newErrors.email = "Requerido"; isValid = false; }
    if (!formData.password) { newErrors.password = "Requerido"; isValid = false; }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    if (!formData.vehicleModel.trim()) { newErrors.vehicleModel = "Requerido"; isValid = false; }
    if (!formData.plateNumber.trim()) { newErrors.plateNumber = "Requerido"; isValid = false; }
    if (!formData.licenseFile) { newErrors.licenseFile = "Requerido"; isValid = false; }
    if (!formData.insuranceFile) { newErrors.insuranceFile = "Requerido"; isValid = false; }
    if (!formData.idFile) { newErrors.idFile = "Requerido"; isValid = false; }
    if (!formData.antFile) { newErrors.antFile = "Requerido"; isValid = false; }
    if (!formData.tourismFile) { newErrors.tourismFile = "Requerido"; isValid = false; }
    if (!formData.vehicleFront) { newErrors.vehicleFront = "Requerido"; isValid = false; }
    if (!formData.vehicleBack) { newErrors.vehicleBack = "Requerido"; isValid = false; }
    if (!formData.vehicleSide) { newErrors.vehicleSide = "Requerido"; isValid = false; }
    if (!formData.vehicleInterior) { newErrors.vehicleInterior = "Requerido"; isValid = false; }
    if (!formData.profilePhoto) { newErrors.profilePhoto = "Requerido"; isValid = false; }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const handleFileChange = (file: File, field: string) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleRemoveFile = (field: string) => {
    setFormData(prev => ({ ...prev, [field]: null }));
  };

  const handleOcrResult = (text: string, field: string) => {
    console.log(`OCR Result for ${field}:`, text);
    // Simple regex to find ID number (10 digits)
    const idMatch = text.match(/\b\d{10}\b/);
    if (idMatch && field === 'idFile') {
      setOcrData(prev => ({ ...prev, idNumber: idMatch[0] }));
    }
  };

  const handleNext = () => {
    setTouched({ name: true, phone: true, email: true, password: true });
    if (validateStep1()) setStep(2);
  };

  const handleStep2Next = () => {
    setTouched(prev => ({ ...prev, vehicleModel: true, plateNumber: true }));
    if (validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBiometricVerified) {
      onRegister();
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderFileInput = (field: keyof typeof formData, label: string, ocr = false) => {
    // @ts-ignore
    const value = formData[field] as File | null;
    return (
      <DocumentUploadField
        label={label}
        value={value}
        onChange={(file) => handleFileChange(file, field)}
        onRemove={() => handleRemoveFile(field)}
        error={errors[field]}
        ocrEnabled={ocr}
        onOcrResult={(text) => handleOcrResult(text, field)}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-screen bg-[#FF4E43] items-center p-6 relative"
    >
      {/* Header */}
      <div className="w-full max-w-sm flex items-center mt-8 mb-6 relative">
        <button 
          onClick={step === 1 ? onBack : () => setStep(prev => (prev - 1) as 1 | 2)}
          className="absolute left-0 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="w-full text-center text-white text-2xl font-display font-bold">
          {step === 1 ? "Registro Conductor" : step === 2 ? "Datos del Vehículo" : "Verificación"}
        </h1>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-6 flex-1">
        {/* Progress Indicator */}
        <div className="flex gap-2 mb-4">
          <div className={cn("w-16 h-1 rounded-full transition-colors", step >= 1 ? "bg-white" : "bg-white/30")} />
          <div className={cn("w-16 h-1 rounded-full transition-colors", step >= 2 ? "bg-white" : "bg-white/30")} />
          <div className={cn("w-16 h-1 rounded-full transition-colors", step >= 3 ? "bg-white" : "bg-white/30")} />
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4" noValidate>
          
          {step === 1 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4 w-full"
            >
              <Input
                placeholder="Nombre completo"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="bg-white/90 border-0 h-12 rounded-xl"
              />
              <Input
                placeholder="Teléfono móvil"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="bg-white/90 border-0 h-12 rounded-xl"
              />
              <Input
                placeholder="Correo electrónico"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="bg-white/90 border-0 h-12 rounded-xl"
              />
              <Input
                placeholder="Contraseña"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="bg-white/90 border-0 h-12 rounded-xl"
              />
              
              <Button 
                type="button"
                onClick={handleNext}
                className="w-full bg-black text-white h-12 rounded-xl mt-4 font-display"
              >
                Siguiente
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4 w-full"
            >
              <div className="bg-white/10 p-4 rounded-xl border border-white/20 mb-2">
                <div className="flex items-center gap-3 text-white mb-3">
                  <Car className="w-5 h-5" />
                  <span className="font-bold">Información del Auto</span>
                </div>
                <div className="space-y-3">
                  <Input
                    placeholder="Modelo y Año (ej. Toyota Yaris 2020)"
                    value={formData.vehicleModel}
                    onChange={(e) => handleChange("vehicleModel", e.target.value)}
                    className="bg-white/90 border-0 h-10 rounded-lg"
                  />
                  <Input
                    placeholder="Número de Placa"
                    value={formData.plateNumber}
                    onChange={(e) => handleChange("plateNumber", e.target.value)}
                    className="bg-white/90 border-0 h-10 rounded-lg"
                  />
                </div>
              </div>

              <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                <div className="flex items-center gap-3 text-white mb-3">
                  <FileText className="w-5 h-5" />
                  <span className="font-bold">Documentos</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {renderFileInput('profilePhoto', 'Foto de Perfil')}
                  {renderFileInput('idFile', 'Cédula / ID', true)}
                  {renderFileInput('licenseFile', 'Licencia')}
                  {renderFileInput('antFile', 'Permiso ANT')}
                  {renderFileInput('tourismFile', 'Min. Turismo')}
                  {renderFileInput('insuranceFile', 'Seguro')}
                </div>

                <div className="flex items-center gap-3 text-white mb-3 mt-6">
                  <Car className="w-5 h-5" />
                  <span className="font-bold">Fotos del Vehículo</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {renderFileInput('vehicleFront', 'Frontal')}
                  {renderFileInput('vehicleBack', 'Trasera')}
                  {renderFileInput('vehicleSide', 'Lateral')}
                  {renderFileInput('vehicleInterior', 'Interior')}
                </div>
                
                {ocrData.idNumber && (
                  <div className="mt-2 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <p className="text-xs text-white font-medium">
                      Cédula detectada: <span className="font-bold">{ocrData.idNumber}</span>
                    </p>
                  </div>
                )}
              </div>

              <Button 
                type="button"
                onClick={handleStep2Next}
                className="w-full bg-black text-white h-12 rounded-xl mt-4 font-display"
              >
                Siguiente: Verificación Facial
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4 w-full"
            >
              <div className="bg-white/10 p-4 rounded-xl border border-white/20 mb-2">
                <div className="flex items-center gap-3 text-white mb-3">
                  <ScanFace className="w-5 h-5" />
                  <span className="font-bold">Verificación Biométrica</span>
                </div>
                <p className="text-white/80 text-sm mb-4">
                  Para tu seguridad y la de los pasajeros, necesitamos verificar que eres la persona en tu documento de identidad.
                </p>
                
                <BiometricVerification 
                  idImageFile={formData.idFile}
                  onVerificationComplete={(isVerified, score, auditVideo) => {
                    setIsBiometricVerified(isVerified);
                    if (auditVideo) {
                      setFormData(prev => ({ ...prev, auditVideo }));
                    }
                  }}
                />
              </div>

              <Button 
                type="submit"
                disabled={!isBiometricVerified}
                className={cn(
                  "w-full h-12 rounded-xl mt-4 font-display transition-all",
                  isBiometricVerified 
                    ? "bg-black text-white" 
                    : "bg-gray-500/50 text-white/50 cursor-not-allowed"
                )}
              >
                Finalizar Registro
              </Button>
            </motion.div>
          )}
        </form>
      </div>
    </motion.div>
  );
}
