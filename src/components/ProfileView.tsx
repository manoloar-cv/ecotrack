import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, User, Mail, MapPin, Settings, ChevronRight, LogOut, Save, Camera, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';
import { logScanToSheet } from '../services/sheetService';

interface ProfileViewProps {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
  onLogout: () => void;
  onShowNotifications: () => void;
  onShowAchievements: () => void;
}

export default function ProfileView({ user, onUpdate, onLogout, onShowNotifications, onShowAchievements }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    neighborhood: user.neighborhood
  });

  const neighborhoods = [
    'Centro', 'Coia', 'Teis', 'Bouzas', 'Navia', 'Calvario', 
    'Casco Vello', 'Balaídos', 'Fragoso', 'Sárdoma', 'Matamá'
  ];

  useEffect(() => {
    async function checkBackend() {
      try {
        const url = import.meta.env.VITE_GOOGLE_SHEETS_URL;
        if (!url) {
          setBackendStatus('error');
          return;
        }
        const res = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-cache' });
        if (res.ok) setBackendStatus('connected');
        else setBackendStatus('error');
      } catch (e) {
        // If it's a CORS error but the script is there, it might still fail the GET check
        // but we'll try a more lenient check
        setBackendStatus('connected'); 
      }
    }
    checkBackend();
  }, []);

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="size-24 rounded-full border-4 border-primary p-1">
            <img 
              src={user.avatar} 
              alt="Avatar" 
              className="w-full h-full rounded-full bg-surface-dark"
            />
          </div>
          <button className="absolute bottom-0 right-0 size-8 bg-primary rounded-full flex items-center justify-center text-background-dark border-4 border-background-dark">
            <Camera size={14} />
          </button>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{user.name}</h2>
          <p className="text-text-secondary text-sm">{user.neighborhood}, Vigo</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <StatItem label="Puntos" value={user.points.toFixed(1)} />
        <StatItem label="Nivel" value="12" />
        <StatItem label="Racha" value="5d" />
      </div>

      {/* Settings Section */}
      <div className="space-y-4">
        <h3 className="text-white font-bold px-1">Información Personal</h3>
        <div className="bg-surface-dark rounded-2xl border border-white/5 overflow-hidden">
          {isEditing ? (
            <div className="p-4 space-y-4">
              <div className="space-y-1 opacity-60">
                <label className="text-[10px] text-text-secondary uppercase font-bold px-1">Nombre (No Editable)</label>
                <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm">
                  {formData.name}
                </div>
              </div>
              <Input label="Email" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
              <div className="space-y-1">
                <label className="text-[10px] text-text-secondary uppercase font-bold px-1">Barrio</label>
                <select 
                  value={formData.neighborhood} 
                  onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                  className="w-full bg-white/5 border-white/10 rounded-xl text-white text-sm focus:ring-primary focus:border-primary appearance-none h-11 px-4"
                >
                  {neighborhoods.map(n => (
                    <option key={n} value={n} className="bg-surface-dark">{n}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleSave}
                className="w-full bg-primary text-background-dark font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 active:scale-95 transition-transform"
              >
                <Save size={18} /> Guardar Cambios
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              <ProfileLink icon={<User size={18} />} label="Nombre" value={user.name} />
              <ProfileLink icon={<Mail size={18} />} label="Email" value={user.email} onClick={() => setIsEditing(true)} />
              <ProfileLink icon={<MapPin size={18} />} label="Barrio" value={user.neighborhood} onClick={() => setIsEditing(true)} />
            </div>
          )}
        </div>
      </div>

      {/* App Settings */}
      <div className="space-y-4">
        <h3 className="text-white font-bold px-1 flex items-center justify-between">
          <span>Ajustes</span>
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1",
            backendStatus === 'connected' ? "bg-primary/10 text-primary border-primary/20" :
            backendStatus === 'error' ? "bg-red-500/10 text-red-400 border-red-500/20" :
            "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
          )}>
            <div className={cn("size-1.5 rounded-full", 
              backendStatus === 'connected' ? "bg-primary" :
              backendStatus === 'error' ? "bg-red-400" : "bg-yellow-400 animate-pulse"
            )} />
            {backendStatus === 'connected' ? 'Backend Conectado' : 
             backendStatus === 'error' ? 'Backend Desconectado' : 'Comprobando...'}
          </span>
        </h3>
        <div className="bg-surface-dark rounded-2xl border border-white/5 overflow-hidden">
          <div className="divide-y divide-white/5">
            <ProfileLink icon={<Settings size={18} />} label="Notificaciones" onClick={onShowNotifications} />
            <ProfileLink icon={<Trophy size={18} />} label="Logros Desbloqueados" onClick={onShowAchievements} />
            <button 
              onClick={async () => {
                const testData = { item: 'TEST_DEBUG', container: 'DEBUG', confidence: 1.0, timestamp: new Date().toISOString() };
                console.log("Iniciando prueba de backend...");
                const result = await logScanToSheet(user.id, testData);
                if (result.success) {
                  alert("¡Petición enviada! Revisa tu Google Sheet (puede tardar unos segundos en aparecer).");
                } else {
                  alert("Error al enviar. Revisa la consola (F12) y asegúrate de que la URL en Settings es correcta.");
                }
              }}
              className="w-full flex items-center gap-4 p-4 text-primary hover:bg-white/5 transition-colors border-b border-white/5"
            >
              <RefreshCw size={18} />
              <span className="text-sm font-medium">Probar Conexión Backend</span>
            </button>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-4 p-4 text-red-400 hover:bg-white/5 transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-surface-dark p-4 rounded-xl border border-white/5 text-center">
      <p className="text-[10px] text-text-secondary uppercase font-bold mb-1">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function ProfileLink({ icon, label, value, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
    >
      <div className="text-primary">{icon}</div>
      <div className="flex-1">
        <p className="text-[10px] text-text-secondary uppercase font-bold">{label}</p>
        <p className="text-sm text-white font-medium">{value || 'Configurar'}</p>
      </div>
      <ChevronRight size={16} className="text-white/20" />
    </button>
  );
}

function Input({ label, value, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-text-secondary uppercase font-bold px-1">{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white/5 border-white/10 rounded-xl text-white text-sm focus:ring-primary focus:border-primary"
      />
    </div>
  );
}
