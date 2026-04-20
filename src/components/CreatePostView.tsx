import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Camera, Send, Image as ImageIcon } from 'lucide-react';
import { createPostInSheet } from '../services/sheetService';
import { UserProfile } from '../types';

interface CreatePostViewProps {
  user: UserProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePostView({ user, onClose, onSuccess }: CreatePostViewProps) {
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createPostInSheet({
        userId: user.id,
        userName: user.name,
        userLocation: user.neighborhood,
        text: text.trim(),
        imageUrl: imageUrl.trim() || `https://picsum.photos/seed/${Math.random()}/800/600`
      });
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[60] bg-background-dark/95 flex flex-col p-6"
    >
      <header className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">Inspirar a Vigo</h2>
        <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white">
          <X size={24} />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6">
        <textarea
          autoFocus
          placeholder="¿Qué eco-idea tienes hoy? Comparte un truco de reciclaje, una manualidad o un punto limpio..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-transparent border-none text-white text-lg placeholder:text-text-secondary resize-none focus:ring-0 p-0"
        />

        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
            <ImageIcon size={20} className="text-text-secondary" />
            <input 
              type="url" 
              placeholder="URL de imagen (opcional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="bg-transparent border-none flex-1 text-sm text-white placeholder:text-text-secondary focus:ring-0 p-0"
            />
          </div>

          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className="w-full h-14 bg-primary text-background-dark font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.98]"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin" />
            ) : (
              <>
                <Send size={20} />
                <span>Publicar Eco-Idea</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
