import React from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Star, CheckCircle2, Lock, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface AchievementsViewProps {
  onClose: () => void;
}

const ACHIEVEMENTS = [
  { id: 1, title: 'Primer Paso', description: 'Realiza tu primer escaneo de residuos.', icon: <Star size={24} />, unlocked: true, date: '01/03/2024' },
  { id: 2, title: 'Vecino Ejemplar', description: 'Registra 10 bolsas de basura en una semana.', icon: <Trophy size={24} />, unlocked: true, date: '15/03/2024' },
  { id: 3, title: 'Maestro del Vidrio', description: 'Recicla 50 botellas de vidrio.', icon: <CheckCircle2 size={24} />, unlocked: false },
  { id: 4, title: 'Eco-Guerrero', description: 'Alcanza los 1.000 EcoPuntos.', icon: <Star size={24} />, unlocked: false },
  { id: 5, title: 'Héroe de Coia', description: 'Lidera el ranking de tu barrio.', icon: <Trophy size={24} />, unlocked: false },
];

export default function AchievementsView({ onClose }: AchievementsViewProps) {
  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 z-50 bg-background-dark flex flex-col"
    >
      <header className="flex items-center p-6 bg-background-dark/80 backdrop-blur-md border-b border-white/5">
        <button onClick={onClose} className="mr-4 text-white">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-white">Logros Desbloqueados</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {ACHIEVEMENTS.map((achievement) => (
          <div 
            key={achievement.id}
            className={cn(
              "p-4 rounded-2xl border flex items-center gap-4 transition-all",
              achievement.unlocked 
                ? "bg-surface-dark border-primary/20" 
                : "bg-surface-dark/50 border-white/5 grayscale opacity-60"
            )}
          >
            <div className={cn(
              "size-14 rounded-full flex items-center justify-center shrink-0",
              achievement.unlocked ? "bg-primary/20 text-primary" : "bg-white/5 text-text-secondary"
            )}>
              {achievement.unlocked ? achievement.icon : <Lock size={24} />}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-white">{achievement.title}</h3>
                {achievement.unlocked && (
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{achievement.date}</span>
                )}
              </div>
              <p className="text-sm text-text-secondary">{achievement.description}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
