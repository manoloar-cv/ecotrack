import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Camera, Image as ImageIcon, RefreshCw, Info, CheckCircle2, Smartphone, Loader2, Brain } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { identifyWaste } from '../services/geminiService';
import { logScanToSheet } from '../services/sheetService';
import { cn } from '../lib/utils';

interface ScannerProps {
  onClose: () => void;
  onSuccess: (points: number) => void;
  userId: string;
}

export default function AIScanner({ onClose, onSuccess, userId }: ScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(false);
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);

  // Load TensorFlow model on mount
  useEffect(() => {
    async function loadModel() {
      try {
        await tf.ready();
        const loadedModel = await mobilenet.load({
          version: 2,
          alpha: 0.5 // Lightweight version for mobile
        });
        setModel(loadedModel);
        console.log("TensorFlow.js MobileNet cargado correctamente.");
      } catch (e) {
        console.error("Error cargando el modelo TFJS:", e);
      } finally {
        setIsModelLoading(false);
      }
    }
    loadModel();
  }, []);

  const capture = useCallback(async () => {
    if (webcamRef.current && model) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setLoading(true);
        try {
          // 1. Local Inference with TFJS
          const img = new Image();
          img.src = imageSrc;
          await new Promise(resolve => img.onload = resolve);
          
          const predictions = await model.classify(img);
          console.log("Predicciones locales:", predictions);

          // Map predictions to waste categories
          const topPrediction = predictions[0];
          const className = topPrediction.className.toLowerCase();
          
          let wasteInfo = {
            item: topPrediction.className.split(',')[0],
            container: 'GRIS',
            confidence: topPrediction.probability,
            description: "Objeto detectado localmente.",
            points: 0.1,
            savings: 0.01
          };

          // Basic mapping logic
          if (className.includes('bottle') || className.includes('can') || className.includes('plastic') || className.includes('container')) {
            wasteInfo.container = 'AMARILLO';
            wasteInfo.description = "Envase ligero detectado. Va al contenedor amarillo.";
          } else if (className.includes('paper') || className.includes('cardboard') || className.includes('envelope') || className.includes('book')) {
            wasteInfo.container = 'AZUL';
            wasteInfo.description = "Papel o cartón detectado. Va al contenedor azul.";
          } else if (className.includes('glass') || className.includes('wine') || className.includes('beer')) {
            wasteInfo.container = 'VERDE';
            wasteInfo.description = "Vidrio detectado. Va al iglú verde.";
          } else if (className.includes('fruit') || className.includes('vegetable') || className.includes('food')) {
            wasteInfo.container = 'MARRÓN';
            wasteInfo.description = "Materia orgánica detectada. Va al contenedor marrón.";
          }

          // 2. If confidence is low, use Gemini for deep analysis
          if (topPrediction.probability < 0.4) {
            console.log("Baja confianza local, recurriendo a Gemini...");
            const aiResult = await identifyWaste(imageSrc);
            setResult(aiResult);
            await logScanToSheet(userId, aiResult);
          } else {
            setResult(wasteInfo);
            await logScanToSheet(userId, wasteInfo);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    }
  }, [webcamRef, model, userId]);

  const handleConnect = () => {
    if (result) {
      onSuccess(result.points || 0.1);
      onClose();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background-dark flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center p-4 justify-between z-20">
        <button 
          onClick={onClose}
          className="size-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white"
        >
          <X size={24} />
        </button>
        <h2 className="text-white text-lg font-bold">Escáner AI</h2>
        <button 
          onClick={() => setFlash(!flash)}
          className={cn(
            "size-12 flex items-center justify-center rounded-full backdrop-blur-md transition-colors",
            flash ? "bg-primary text-background-dark" : "bg-black/20 text-white"
          )}
        >
          <Zap size={24} fill={flash ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Camera Area */}
      <div className="relative flex-1 flex flex-col">
        <div className="absolute inset-0 z-0">
          <Webcam
            {...({
              audio: false,
              ref: webcamRef,
              screenshotFormat: "image/jpeg",
              className: "w-full h-full object-cover",
              videoConstraints: { facingMode: "environment" }
            } as any)}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background-dark/80" />
        </div>

        {/* Scanning Overlay */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
          <div className="relative w-64 h-64 border-2 border-primary/30 rounded-3xl flex items-center justify-center overflow-hidden">
            {/* Corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
            
            {/* Scan Line */}
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-x-0 h-0.5 bg-primary shadow-[0_0_15px_#13ec5b] z-10"
            />
            
            {loading || isModelLoading ? (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-sm gap-3">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-white text-xs font-medium animate-pulse">
                  {isModelLoading ? 'Cargando Red Neuronal...' : 'Analizando Objeto...'}
                </p>
              </div>
            ) : null}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8 mt-12">
            <button className="size-12 flex items-center justify-center rounded-full bg-black/40 border border-white/10 text-white">
              <ImageIcon size={20} />
            </button>
            <button 
              onClick={capture}
              disabled={loading}
              className="size-20 flex items-center justify-center rounded-full bg-white border-4 border-white/20 text-primary shadow-lg active:scale-95 transition-transform disabled:opacity-50"
            >
              <Camera size={32} />
            </button>
            <button className="size-12 flex items-center justify-center rounded-full bg-black/40 border border-white/10 text-white">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* Result Sheet */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative z-20 px-4 pb-8 pt-2 bg-background-dark rounded-t-3xl border-t border-white/10 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
              
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white text-2xl font-bold">{result.item}</h3>
                      <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full border border-primary/20">
                        {Math.round(result.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-primary text-lg font-medium flex items-center gap-2">
                      <CheckCircle2 size={20} />
                      ¡Identificado! Va al contenedor {result.container}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-lg border border-primary/20">
                      +{result.points || 0.1} PTS
                    </div>
                    <div className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-blue-500/20">
                      +{result.savings || 0.01}€
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-surface-dark/50 p-4 rounded-xl border border-white/5">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center text-background-dark shadow-sm",
                    result.container === 'AMARILLO' ? 'bg-yellow-400' :
                    result.container === 'AZUL' ? 'bg-blue-500' :
                    result.container === 'VERDE' ? 'bg-green-500' :
                    result.container === 'MARRÓN' ? 'bg-amber-800 text-white' : 'bg-gray-500 text-white'
                  )}>
                    <RefreshCw size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-bold">Contenedor {result.container}</p>
                    <p className="text-text-secondary text-xs">{result.description}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleConnect}
                className="w-full flex items-center justify-center rounded-xl h-14 bg-primary text-background-dark gap-2 text-base font-bold shadow-lg active:scale-[0.98] transition-all"
              >
                <Smartphone size={24} />
                <span>Conectar con Contenedor</span>
              </button>
              
              <p className="text-slate-500 text-xs mt-4 text-center flex items-center justify-center gap-1.5">
                <Brain size={12} className="text-primary" />
                Procesado localmente con MobileNet v2
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
