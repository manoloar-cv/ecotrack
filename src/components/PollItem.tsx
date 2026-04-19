import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Trophy, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';

interface PollItemProps {
  question: string;
  options: string[];
  onVote: (points: number) => void;
}

export default function PollItem({ question, options, onVote }: PollItemProps) {
  const [voted, setVoted] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const handleVote = (index: number) => {
    if (voted) return;
    setSelected(index);
    setVoted(true);
    onVote(25); // Award 25 points for voting
  };

  return (
    <div className="bg-surface-dark rounded-xl p-5 border border-primary/20 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/20 text-primary">
          <BarChart3 size={20} />
        </div>
        <h4 className="text-white font-bold text-sm">{question}</h4>
      </div>

      <div className="space-y-3">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleVote(i)}
            disabled={voted}
            className={cn(
              "w-full p-4 rounded-xl text-left text-sm font-medium transition-all border",
              voted 
                ? selected === i 
                  ? "bg-primary text-background-dark border-primary" 
                  : "bg-white/5 text-text-secondary border-white/5"
                : "bg-white/5 text-white border-white/10 hover:border-primary/50"
            )}
          >
            <div className="flex justify-between items-center">
              <span>{opt}</span>
              {voted && selected === i && <CheckCircle2 size={16} />}
            </div>
          </button>
        ))}
      </div>

      {voted && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2 text-primary text-xs font-bold bg-primary/10 p-2 rounded-lg justify-center"
        >
          <Trophy size={14} />
          ¡Gracias por participar! +25 EcoPuntos
        </motion.div>
      )}
    </div>
  );
}
