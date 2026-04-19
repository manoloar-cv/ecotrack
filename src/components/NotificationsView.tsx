import React from 'react';
import { motion } from 'motion/react';
import { X, Bell, Recycle, Trophy, MessageCircle, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface NotificationsViewProps {
  onClose: () => void;
}

const NOTIFICATIONS = [
  { id: 1, type: 'points', title: '¡Nuevos EcoPuntos!', message: 'Has ganado 50 pts por reciclar una bolsa en Coia.', time: 'Hace 5 min', icon: <Recycle size={18} />, color: 'bg-primary' },
  { id: 2, type: 'rank', title: '¡Subida en el Ranking!', message: 'Coia ha subido al puesto #2 en el ranking de Vigo.', time: 'Hace 1 hora', icon: <Trophy size={18} />, color: 'bg-yellow-400' },
  { id: 3, type: 'social', title: 'Nuevo comentario', message: 'Marta G. comentó en tu última publicación.', time: 'Hace 3 horas', icon: <MessageCircle size={18} />, color: 'bg-blue-400' },
  { id: 4, type: 'system', title: 'Recordatorio', message: 'Mañana toca recogida de Plástico a las 07:00.', time: 'Hace 5 horas', icon: <Bell size={18} />, color: 'bg-surface-dark' },
];

export default function NotificationsView({ onClose }: NotificationsViewProps) {
  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 z-50 bg-background-dark flex flex-col"
    >
      <header className="flex items-center p-6 border-b border-white/5">
        <button onClick={onClose} className="mr-4 text-white">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-white">Notificaciones</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {NOTIFICATIONS.map(n => (
          <div key={n.id} className="bg-surface-dark p-4 rounded-xl border border-white/5 flex gap-4 items-start">
            <div className={cn("size-10 rounded-full flex items-center justify-center shrink-0", n.color, n.type === 'system' ? 'text-text-secondary' : 'text-background-dark')}>
              {n.icon}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-white font-bold text-sm">{n.title}</h4>
                <span className="text-[10px] text-text-secondary">{n.time}</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
