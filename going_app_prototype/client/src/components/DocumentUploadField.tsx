import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Upload, X, Eye, Camera, CheckCircle2, AlertCircle, Loader2, Crop as CropIcon } from "lucide-react";
import Webcam from "react-webcam";
import Cropper from "react-easy-crop";
import imageCompression from "browser-image-compression";
import Tesseract from "tesseract.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DocumentUploadFieldProps {
  label: string;
  value: File | null;
  onChange: (file: File) => void;
  onRemove: () => void;
  error?: string;
  ocrEnabled?: boolean;
  onOcrResult?: (text: string) => void;
}

export default function DocumentUploadField({
  label,
  value,
  onChange,
  onRemove,
  error,
  ocrEnabled = false,
  onOcrResult
}: DocumentUploadFieldProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setIsCropOpen(true);
      // Reset input value to allow selecting same file again
      e.target.value = "";
    }
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImageSrc(imageSrc);
      setIsCameraOpen(false);
      setIsCropOpen(true);
    }
  }, [webcamRef]);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], "document.jpg", { type: "image/jpeg" });

      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(croppedFile, options);

      onChange(compressedFile);
      setIsCropOpen(false);

      // Perform OCR if enabled
      if (ocrEnabled && onOcrResult) {
        setOcrStatus("processing");
        try {
          const result = await Tesseract.recognize(compressedFile, 'eng', {
            logger: m => console.log(m)
          });
          onOcrResult(result.data.text);
          setOcrStatus("success");
        } catch (err) {
          console.error("OCR Error:", err);
          setOcrStatus("failed");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className={cn(
        "h-32 bg-white/20 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors border-2 border-dashed relative overflow-hidden",
        error ? "border-yellow-400 bg-yellow-400/10" : "border-white/50",
        !value && "hover:bg-white/30",
        value && "border-green-400 bg-green-400/10"
      )}>
        {value ? (
          <div className="w-full h-full flex flex-col items-center justify-center relative p-2">
            <div className="absolute top-2 right-2 z-20 flex gap-2">
              <button 
                type="button"
                onClick={onRemove}
                className="p-1.5 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center w-full">
              <CheckCircle2 className="w-8 h-8 text-green-400 mb-2" />
              <span className="text-sm text-green-400 font-medium truncate max-w-[90%] px-2">
                {value.name}
              </span>
              
              {ocrEnabled && (
                <div className="mt-2 flex items-center gap-2">
                  {ocrStatus === "processing" && (
                    <span className="text-xs text-white flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Escaneando...
                    </span>
                  )}
                  {ocrStatus === "success" && (
                    <span className="text-xs text-green-400 font-bold">Datos extraídos</span>
                  )}
                  {ocrStatus === "failed" && (
                    <span className="text-xs text-yellow-400">Error OCR</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full h-full justify-center">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-3 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-white font-medium">Subir</span>
              </button>
              
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-3 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-white font-medium">Cámara</span>
              </button>
            </div>
            <span className="text-xs text-white/70 font-medium">{label}</span>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      
      {error && (
        <span className="text-yellow-300 text-[10px] font-bold absolute -bottom-5 left-0 w-full text-center flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </span>
      )}

      {/* Camera Modal */}
      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="sm:max-w-md bg-black border-gray-800 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Cámara</DialogTitle>
          <div className="relative w-full aspect-[3/4] bg-black">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full h-full object-cover"
            />
            
            {/* Guide Overlay */}
            <div className="absolute inset-0 border-[2px] border-white/30 m-8 rounded-lg pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
            </div>
            
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <button
                onClick={capture}
                className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:scale-105 transition-transform"
              >
                <div className="w-12 h-12 bg-white rounded-full border-2 border-black"></div>
              </button>
            </div>
            
            <button 
              onClick={() => setIsCameraOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Modal */}
      <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
        <DialogContent className="sm:max-w-md bg-black border-gray-800 p-0 h-[80vh] flex flex-col">
          <DialogHeader className="p-4 bg-black z-10">
            <DialogTitle className="text-white text-center">Ajustar Documento</DialogTitle>
          </DialogHeader>
          
          <div className="relative flex-1 bg-black w-full">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={3 / 2}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          
          <div className="p-4 bg-black flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-white text-xs">Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsCropOpen(false)}
                className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCropSave}
                disabled={isProcessing}
                className="flex-1 bg-white text-black hover:bg-gray-200"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando
                  </>
                ) : (
                  <>
                    <CropIcon className="w-4 h-4 mr-2" /> Guardar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
