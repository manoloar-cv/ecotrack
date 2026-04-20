import React from 'react';
import { motion } from 'motion/react';
import { X, TrendingUp, Leaf, History, ArrowLeft, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DetailsViewProps {
  onClose: () => void;
  user: any;
  history: any[];
}

export default function DetailsView({ onClose, user, history }: DetailsViewProps) {
  // Aggregate history by date
  const aggregatedHistory = React.useMemo(() => {
    const totals: Record<string, { date: string, points: number, savings: number }> = {};
    
    // Sort all records by date first
    const sortedRaw = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedRaw.forEach(item => {
      const dateStr = typeof item.date === 'string' ? item.date.split('T')[0] : new Date(item.date).toISOString().split('T')[0];
      if (!totals[dateStr]) {
        totals[dateStr] = { date: dateStr, points: 0, savings: 0 };
      }
      totals[dateStr].points += parseFloat(item.points) || 0;
      totals[dateStr].savings += parseFloat(item.savings) || 0;
    });
    
    return Object.values(totals).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [history]);

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 z-50 bg-background-dark flex flex-col overflow-y-auto"
    >
      <header className="sticky top-0 z-20 flex items-center p-6 bg-background-dark/80 backdrop-blur-md border-b border-white/5">
        <button onClick={onClose} className="mr-4 text-white">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-white">Detalles de Impacto</h2>
      </header>

      <div className="p-6 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-surface-dark border border-white/5">
            <p className="text-xs text-text-secondary uppercase font-bold mb-1">Ahorro Total</p>
            <h3 className="text-2xl font-bold text-white">€{user.savings.toFixed(2)}</h3>
            <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
              <TrendingUp size={10} /> +12% vs mes anterior
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-dark border border-white/5">
            <p className="text-xs text-text-secondary uppercase font-bold mb-1">EcoPuntos</p>
            <h3 className="text-2xl font-bold text-white">{parseFloat(user.points).toFixed(1)}</h3>
            <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
              <Leaf size={10} /> Nivel: EcoGuerrero
            </p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-surface-dark rounded-xl p-6 border border-white/5">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <History size={18} className="text-primary" />
            Histórico de Puntos
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregatedHistory}>
                <defs>
                  <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#13ec5b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#23482f" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#92c9a4" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(str) => {
                    const d = new Date(str);
                    return isNaN(d.getTime()) ? str : `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis stroke="#92c9a4" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#193322', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#13ec5b' }}
                  labelFormatter={(str) => {
                    const d = new Date(str);
                    return isNaN(d.getTime()) ? str : d.toLocaleDateString();
                  }}
                />
                <Area type="monotone" dataKey="points" stroke="#13ec5b" fillOpacity={1} fill="url(#colorPoints)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waste Breakdown */}
        <div className="bg-surface-dark rounded-xl p-6 border border-white/5">
          <h3 className="text-white font-bold mb-4">Desglose por Residuo</h3>
          <div className="space-y-4">
            <WasteStat label="Plástico" value={user.stats.plastic} color="bg-yellow-400" />
            <WasteStat label="Papel y Cartón" value={user.stats.paper} color="bg-blue-500" />
            <WasteStat label="Vidrio" value={user.stats.glass} color="bg-green-500" />
            <WasteStat label="Orgánico" value={user.stats.organic} color="bg-amber-800" />
            <WasteStat label="Resto" value={user.stats.rest} color="bg-gray-500" />
          </div>
        </div>

        {/* Tips */}
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex gap-4">
          <Info className="text-primary shrink-0" />
          <p className="text-sm text-text-secondary">
            Sabías que reciclar una tonelada de papel ahorra 17 árboles y 26,000 litros de agua. ¡Sigue así!
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function WasteStat({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className={cn("w-3 h-3 rounded-full", color)} />
      <span className="text-sm text-white flex-1">{label}</span>
      <span className="text-sm font-bold text-white">{value} kg</span>
    </div>
  );
}
