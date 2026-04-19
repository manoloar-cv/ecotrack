import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'motion/react';
import { X, QrCode, Loader2, CheckCircle2, Camera } from 'lucide-react';
import { logBagToSheet } from '../services/sheetService';

interface QRScannerProps {
  onClose: () => void;
  onSuccess: (code: string) => void;
  userId: string;
}

export default function QRScanner({ onClose, onSuccess, userId }: QRScannerProps) {
  const [processing, setProcessing] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const isScanningRef = useRef(false);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    let isMounted = true;

    const startScanner = async () => {
      // Small delay to ensure the DOM element is fully rendered and avoid StrictMode double-init issues
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!isMounted) return;

      try {
        // Ensure any previous instance is cleaned up if it somehow persisted
        const container = document.getElementById("qr-reader");
        if (container) {
          container.innerHTML = "";
        }

        html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        const config = { 
          fps: 15, // Slightly higher FPS for smoother scanning
          qrbox: 250,
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          async (decodedText) => {
            if (isScanningRef.current) return;
            isScanningRef.current = true;

            try {
              if (html5QrCode && html5QrCode.isScanning) {
                await html5QrCode.stop();
              }
            } catch (e) {
              console.error("Error stopping scanner:", e);
            }

            setProcessing(true);
            setScannedCode(decodedText);
            
            try {
              // 1 point per bag = 0.10€ savings
              await logBagToSheet(userId, { 
                bagCode: decodedText, 
                points: 1,
                savings: 0.10 
              });
            } catch (e) {
              console.error("Error logging bag:", e);
            }
            
            setTimeout(() => {
              onSuccess(decodedText);
              onClose();
            }, 1500);
          },
          (errorMessage) => {
            // Ignore common errors
          }
        );
      } catch (err) {
        if (isMounted) {
          console.error("Failed to start scanner:", err);
          setError("No se pudo acceder a la cámara. Asegúrate de dar permisos y que no esté en uso por otra app.");
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().catch(e => console.error("Failed to stop scanner", e));
        }
      }
    };
  }, [userId, onSuccess, onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background-dark flex flex-col"
    >
      <div className="flex items-center p-4 justify-between z-20">
        <button 
          onClick={onClose}
          className="size-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white"
        >
          <X size={24} />
        </button>
        <h2 className="text-white text-lg font-bold">Lector de Bolsas</h2>
        <div className="size-12" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden border-2 border-primary/30 bg-black shadow-[0_0_20px_rgba(19,236,91,0.1)]">
          {/* The library injects video and canvas here. We ensure they fill the container correctly and hide duplicates. */}
          <div id="qr-reader" className="w-full h-full [&_video]:!object-cover [&_video]:!w-full [&_video]:!h-full [&_canvas]:!hidden [&_img]:!hidden" />
          
          {/* Scanning Frame Overlay */}
          {!processing && !error && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              <div className="w-64 h-64 border-2 border-primary/30 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                
                {/* Scan Line Animation */}
                <motion.div 
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-x-4 h-0.5 bg-primary shadow-[0_0_10px_#13ec5b]"
                />
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/60 backdrop-blur-sm z-20">
              <Camera size={48} className="text-red-400 mb-4" />
              <p className="text-white text-sm font-medium">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-xs"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
        
        {processing && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-8 p-6 bg-surface-dark rounded-2xl border border-primary/20 flex flex-col items-center gap-4 text-center w-full max-w-sm"
          >
            {scannedCode ? (
              <>
                <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Bolsa Asignada</h3>
                  <p className="text-text-secondary text-sm">Código: {scannedCode}</p>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-white font-medium">Procesando código...</p>
              </>
            )}
          </motion.div>
        )}

        {!processing && !error && (
          <div className="mt-8 text-center space-y-6">
            <div className="flex flex-col items-center">
              <QrCode className="text-primary/40 mb-2" size={48} />
              <p className="text-text-secondary text-sm">Escanea el código QR o barras de tu bolsa biodegradable</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <p className="text-text-secondary text-[10px] uppercase tracking-widest font-bold">¿Problemas con la cámara?</p>
              <button 
                onClick={() => {
                  const code = window.prompt("Introduce el código de la bolsa manualmente:");
                  if (code) {
                    setProcessing(true);
                    setScannedCode(code);
                    logBagToSheet(userId, { bagCode: code, points: 1, savings: 0.10 });
                    setTimeout(() => {
                      onSuccess(code);
                      onClose();
                    }, 1500);
                  }
                }}
                className="px-4 py-2 bg-surface-dark border border-white/10 rounded-xl text-primary text-xs font-bold hover:bg-surface-dark/80 transition-colors"
              >
                Introducir código manualmente
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
