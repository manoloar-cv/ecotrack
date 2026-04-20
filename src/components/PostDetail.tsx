import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Heart, MessageCircle, Copy, ArrowLeft, MoreHorizontal, Share2, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { getCommentsFromSheet, addCommentInSheet, likePostInSheet, getLikesFromSheet } from '../services/sheetService';

interface PostDetailProps {
  post: any;
  currentUser: any;
  onClose: () => void;
}

export default function PostDetail({ post, currentUser, onClose }: PostDetailProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localLikes, setLocalLikes] = useState(parseInt(post.likes) || 0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      console.log(`💬 Cargando comentarios para el post ${post.id}...`);
      const [commentsData, userLikesData] = await Promise.all([
        getCommentsFromSheet(post.id),
        getLikesFromSheet(currentUser.id)
      ]);
      console.log(`📥 ${commentsData.length} comentarios recibidos.`);
      setComments(commentsData);
      setIsLiked(userLikesData.includes(post.id));
    };
    loadData();
  }, [post.id, currentUser.id]);

  const handleLike = async () => {
    if (isLiked) return;
    setIsLiked(true);
    setLocalLikes(prev => prev + 1);
    await likePostInSheet(post.id, currentUser.id);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const tempComment = {
      id: Math.random().toString(),
      userName: currentUser.name,
      text: newComment.trim(),
      timestamp: new Date().toISOString()
    };
    
    setComments(prev => [...prev, tempComment]);
    setNewComment('');

    try {
      await addCommentInSheet(post.id, {
        userId: currentUser.id,
        userName: currentUser.name,
        text: tempComment.text
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      </header>

      <div className="flex-1 p-6 space-y-6">
        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-cover bg-center border-2 border-primary" 
               style={{ backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userName || post.user}')` }} />
          <div>
            <h4 className="text-lg font-bold text-white">{post.userName || post.user}</h4>
            <p className="text-sm text-text-secondary">{post.userLocation} • {post.timestamp ? new Date(post.timestamp).toLocaleDateString() : 'Vigo'}</p>
          </div>
          <button className="ml-auto text-text-secondary">
            <MoreHorizontal size={24} />
          </button>
        </div>

        {/* Content */}
        <p className="text-white text-lg leading-relaxed">
          {post.text || post.content}
        </p>

        {/* Image */}
        {(post.imageUrl || post.image) && (
          <div className="rounded-2xl overflow-hidden aspect-square bg-black/20 shadow-2xl">
            <img src={post.imageUrl || post.image} alt="Post" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between border-y border-white/5 py-4">
          <div className="flex gap-8">
            <button 
              onClick={handleLike}
              className={cn("flex items-center gap-2 transition-colors", isLiked ? "text-red-500" : "text-text-secondary hover:text-red-500")}
            >
              <Heart size={24} className={isLiked ? "fill-red-500" : ""} />
              <span className="text-sm font-bold">{localLikes}</span>
            </button>
            <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
              <MessageCircle size={24} />
              <span className="text-sm font-bold">{comments.length}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-6">
          <h3 className="text-white font-bold">Comentarios</h3>
          <div className="space-y-4 pb-24">
            {comments.length > 0 ? comments.map((comm) => (
              <Comment key={comm.id} user={comm.userName} text={comm.text} time={comm.timestamp} />
            )) : (
              <p className="text-center text-xs text-text-secondary py-4">Sin comentarios aún. ¡Sé el primero!</p>
            )}
          </div>
        </div>
      </div>

      {/* Comment Input */}
      <form 
        onSubmit={handleAddComment}
        className="sticky bottom-0 p-6 bg-background-dark/80 backdrop-blur-md border-t border-white/5"
      >
        <div className="flex gap-3">
          <div className="size-10 rounded-full bg-cover bg-center shrink-0" 
               style={{ backgroundImage: `url('${currentUser.avatar}')` }} />
          <div className="relative flex-1">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un comentario..." 
              className="w-full bg-white/5 border-white/10 rounded-xl text-white text-sm focus:ring-primary focus:border-primary pr-10"
            />
            <button 
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-primary disabled:opacity-30"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}

function Comment({ user, text, time }: any) {
  const formattedTime = React.useMemo(() => {
    if (!time) return "Recién";
    const d = new Date(time);
    if (isNaN(d.getTime())) return time;
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    return d.toLocaleDateString();
  }, [time]);

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
