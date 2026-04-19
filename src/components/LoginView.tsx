import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Mail, ArrowRight, Leaf, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoginViewProps {
  onLogin: (userData: any) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [neighborhood, setNeighborhood] = useState('Centro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const neighborhoods = [
    'Centro', 'Coia', 'Teis', 'Bouzas', 'Navia', 'Calvario', 
    'Casco Vello', 'Balaídos', 'Fragoso', 'Sárdoma', 'Matamá'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const userId = username.toLowerCase().replace(/\s+/g, '_') || 'guest';
      onLogin({
        id: userId,
        name: username || 'Usuario',
        email: email || 'usuario@vigo.es',
        points: 0,
        savings: 0,
        neighborhood: isLogin ? 'Coia' : neighborhood,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || 'Alejandro'}`,
        stats: { plastic: 0, paper: 0, glass: 0, organic: 0, rest: 0 },
        goals: { plastic: 12, paper: 8, glass: 5 }
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background-dark flex flex-col items-center justify-center p-6 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm space-y-8"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="size-24 bg-white rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(19,236,91,0.3)] overflow-hidden p-0">
            <img 
              src="/logo.jpeg" 
              alt="Ecotrack Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight">Ecotrack</h1>
            <p className="text-text-secondary text-sm mt-1">Recicla y gana cash</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-surface-dark p-8 rounded-3xl border border-white/5 shadow-2xl">
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 pb-2 text-sm font-bold transition-all border-b-2",
                isLogin ? "text-primary border-primary" : "text-text-secondary border-transparent"
              )}
            >
              Entrar
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 pb-2 text-sm font-bold transition-all border-b-2",
                !isLogin ? "text-primary border-primary" : "text-text-secondary border-transparent"
              )}
            >
              Registro
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">Usuario</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tu nombre de usuario"
                  className="w-full bg-white/5 border-white/10 rounded-xl h-12 pl-12 pr-4 text-white text-sm focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full bg-white/5 border-white/10 rounded-xl h-12 pl-12 pr-4 text-white text-sm focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">Vecindario</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <select 
                    required
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full bg-white/5 border-white/10 rounded-xl h-12 pl-12 pr-4 text-white text-sm focus:ring-primary focus:border-primary transition-all appearance-none"
                  >
                    {neighborhoods.map(n => (
                      <option key={n} value={n} className="bg-surface-dark">{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border-white/10 rounded-xl h-12 pl-12 pr-4 text-white text-sm focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">Repetir Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border-white/10 rounded-xl h-12 pl-12 pr-4 text-white text-sm focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-xs font-medium px-1">{error}</p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-background-dark font-bold h-12 rounded-xl flex items-center justify-center gap-2 mt-8 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="size-5 border-2 border-background-dark border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <span>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-text-secondary text-xs">
          Al continuar, aceptas nuestros <span className="text-white underline">Términos de Servicio</span> y <span className="text-white underline">Política de Privacidad</span>.
        </p>
      </motion.div>
    </div>
  );
}
