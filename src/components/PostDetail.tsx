import React from 'react';
import { motion } from 'motion/react';
import { X, Heart, MessageCircle, Copy, ArrowLeft, MoreHorizontal, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface PostDetailProps {
  post: any;
  onClose: () => void;
}

export default function PostDetail({ post, onClose }: PostDetailProps) {
  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed inset-0 z-50 bg-background-dark flex flex-col overflow-y-auto"
    >
      <header className="sticky top-0 z-20 flex items-center p-6 bg-background-dark/80 backdrop-blur-md border-b border-white/5">
        <button onClick={onClose} className="mr-4 text-white">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-white">Publicación</h2>
        <button className="ml-auto text-text-secondary">
          <Share2 size={24} />
        </button>
      </header>

      <div className="flex-1 p-6 space-y-6">
        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-cover bg-center border-2 border-primary" 
               style={{ backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user}')` }} />
          <div>
            <h4 className="text-lg font-bold text-white">{post.user}</h4>
            <p className="text-sm text-text-secondary">{post.time} • {post.location}</p>
          </div>
          <button className="ml-auto text-text-secondary">
            <MoreHorizontal size={24} />
          </button>
        </div>

        {/* Content */}
        <p className="text-white text-lg leading-relaxed">
          {post.content}
        </p>

        {/* Image */}
        <div className="rounded-2xl overflow-hidden aspect-square bg-black/20 shadow-2xl">
          <img src={post.image} alt="Post" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-y border-white/5 py-4">
          <div className="flex gap-8">
            <button className="flex items-center gap-2 text-text-secondary hover:text-red-500 transition-colors">
              <Heart size={24} />
              <span className="text-sm font-bold">{post.likes}</span>
            </button>
            <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
              <MessageCircle size={24} />
              <span className="text-sm font-bold">{post.comments}</span>
            </button>
          </div>
          <button className="text-text-secondary">
            <Share2 size={24} />
          </button>
        </div>

        {/* Comments Section */}
        <div className="space-y-6">
          <h3 className="text-white font-bold">Comentarios</h3>
          <div className="space-y-4">
            <Comment user="Carlos R." text="¡Qué buena idea! Me apunto a hacerlo este finde." time="Hace 1 hora" />
            <Comment user="Lucía P." text="Me encanta cómo te han quedado los colores." time="Hace 30 min" />
          </div>
        </div>
      </div>

      {/* Comment Input */}
      <div className="sticky bottom-0 p-6 bg-background-dark/80 backdrop-blur-md border-t border-white/5">
        <div className="flex gap-3">
          <div className="size-10 rounded-full bg-surface-dark shrink-0" />
          <input 
            type="text" 
            placeholder="Escribe un comentario..." 
            className="flex-1 bg-white/5 border-white/10 rounded-xl text-white text-sm focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
    </motion.div>
  );
}

function Comment({ user, text, time }: any) {
  return (
    <div className="flex gap-3">
      <div className="size-10 rounded-full bg-surface-dark shrink-0" 
           style={{ backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${user}')`, backgroundSize: 'cover' }} />
      <div className="flex-1">
        <div className="bg-surface-dark p-3 rounded-2xl rounded-tl-none border border-white/5">
          <h4 className="text-xs font-bold text-white mb-1">{user}</h4>
          <p className="text-sm text-text-secondary">{text}</p>
        </div>
        <span className="text-[10px] text-text-secondary mt-1 px-1">{time}</span>
      </div>
    </div>
  );
}
