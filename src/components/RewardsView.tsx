import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Star, TrendingUp } from 'lucide-react';
import { getRankingsFromSheet, getUserRankings } from '../services/sheetService';
import { NeighborhoodRanking, UserRanking } from '../types';
import { cn } from '../lib/utils';

export default function RewardsView({ neighborhood, user }: { neighborhood: string, user: any }) {
  const [view, setView] = useState<'neighborhoods' | 'users'>('neighborhoods');
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodRanking[]>([]);
  const [users, setUsers] = useState<UserRanking[]>([]);

  useEffect(() => {
    getRankingsFromSheet().then(setNeighborhoods);
    getUserRankings(neighborhood).then(setUsers);
  }, [neighborhood]);

  const top3Users = users.slice(0, 3);
  const myIndex = users.findIndex(u => u.name === user.name);
  const isInTop3 = myIndex >= 0 && myIndex < 3;
  const myRank = myIndex + 1;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-full bg-primary/20 text-primary mb-2">
          <Trophy size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white">EcoPremios</h2>
        <p className="text-text-secondary text-sm">Compite y gana recompensas por reciclar</p>
      </div>

      <div className="flex p-1 bg-surface-dark rounded-xl border border-white/5">
        <button 
          onClick={() => setView('neighborhoods')}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
            view === 'neighborhoods' ? "bg-primary text-background-dark shadow-lg" : "text-text-secondary"
          )}
        >
          Barrios
        </button>
        <button 
          onClick={() => setView('users')}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
            view === 'users' ? "bg-primary text-background-dark shadow-lg" : "text-text-secondary"
          )}
        >
          Tu Barrio ({neighborhood})
        </button>
      </div>

      <div className="space-y-4">
        {view === 'neighborhoods' ? (
          neighborhoods.map((n, i) => (
            <RankingCard 
              key={n.neighborhood || i} 
              rank={i + 1} 
              name={n.neighborhood} 
              value={`${n.points.toLocaleString()} pts`} 
              trend={n.trend}
              avatar={`https://api.dicebear.com/7.x/initials/svg?seed=${n.neighborhood}`}
            />
          ))
        ) : (
          <>
            <div className="space-y-4">
              {top3Users.map((u, i) => (
                <RankingCard 
                  key={u.name || i} 
                  rank={i + 1} 
                  name={u.name === user.name ? "Tú" : u.name} 
                  value={`${u.points.toFixed(1)} pts`} 
                  avatar={u.avatar}
                  isMe={u.name === user.name}
                />
              ))}
              
              {!isInTop3 && myIndex !== -1 && (
                <>
                  <div className="flex justify-center p-2">
                    <div className="w-1 h-8 bg-white/5 rounded-full" />
                  </div>
                  <RankingCard 
                    rank={myRank} 
                    name="Tú" 
                    value={`${user.points.toFixed(1)} pts`} 
                    avatar={user.avatar}
                    isMe
                  />
                </>
              )}

              {users.length === 0 && (
                <div className="text-center py-10 opacity-40">
                  <p className="text-sm">No hay usuarios registrados aún en {neighborhood}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bg-gradient-to-br from-[#1a3826] to-surface-dark p-6 rounded-2xl border border-primary/20">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Medal size={20} className="text-yellow-400" />
          Próxima Recompensa
        </h3>
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-xl bg-white/5 flex items-center justify-center text-primary">
            <Star size={32} />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold">Bono Transporte Vitrasa</p>
            <p className="text-text-secondary text-xs">Faltan 550 pts para canjear</p>
            <div className="mt-2 w-full bg-white/10 rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: '45%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RankingCard({ rank, name, value, trend, avatar, isMe }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all",
        isMe ? "bg-primary/10 border-primary/30" : "bg-surface-dark border-white/5"
      )}
    >
      <span className={cn(
        "font-bold w-6 text-center",
        rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : rank === 3 ? "text-amber-600" : "text-text-secondary"
      )}>
        {rank}
      </span>
      <img src={avatar} alt={name} className="size-10 rounded-full bg-white/5" />
      <div className="flex-1">
        <h4 className="text-white font-bold text-sm">{name}</h4>
        {trend !== undefined && (
          <p className={cn("text-[10px] font-bold flex items-center gap-0.5", trend >= 0 ? "text-primary" : "text-red-400")}>
            <TrendingUp size={10} className={trend < 0 ? "rotate-180" : ""} />
            {Math.abs(trend)}% este mes
          </p>
        )}
      </div>
      <span className="text-sm font-bold text-white">{value}</span>
    </motion.div>
  );
}
