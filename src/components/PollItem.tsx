import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Trophy, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';

interface PollItemProps {
  question: string;
  options: string[];
  onVote: (points: number) => void;
  hasVoted?: boolean;
}

export default function PollItem({ question, options, onVote, hasVoted }: PollItemProps) {
  const [selected, setSelected] = useState<number | null>(null);

  // Use a local state for when the user clicks but hasn't synced with App.tsx state yet
  const [locallyVoted, setLocallyVoted] = useState(false);

  const handleVote = (index: number) => {
    if (hasVoted || locallyVoted) return;
    setSelected(index);
    setLocallyVoted(true);
    onVote(0.5); // Award 0.5 points for voting
  };

  const isVoted = hasVoted || locallyVoted || selected !== null;

  return (
    <div className="bg-surface-dark rounded-xl p-5 border border-primary/20 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/20 text-primary">
          <BarChart3 size={20} />
        </div>
        <h4 className="text-white font-bold text-sm">{question}</h4>
      </div>

      <div className="space-y-3">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          return (
            <button
              key={i}
              onClick={() => handleVote(i)}
              disabled={isVoted}
              className={cn(
                "w-full p-4 rounded-xl text-left text-sm font-medium transition-all border",
                isVoted 
                  ? isSelected
                    ? "bg-primary text-background-dark border-primary" 
                    : "bg-white/5 text-text-secondary border-white/5"
                  : "bg-white/5 text-white border-white/10 hover:border-primary/50"
              )}
            >
              <div className="flex justify-between items-center">
                <span>{opt}</span>
                {isVoted && isSelected && <CheckCircle2 size={16} />}
              </div>
            </button>
          );
        })}
      </div>

      {isVoted && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2 text-primary text-xs font-bold bg-primary/10 p-2 rounded-lg justify-center"
        >
          <Trophy size={14} />
          {hasVoted ? "Ya has participado esta semana" : "¡Gracias por participar! +0.5 EcoPuntos"}
        </motion.div>
      )}
    </div>
  );
}
