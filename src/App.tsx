import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  TrendingUp, 
  Plus, 
  Recycle, 
  Newspaper, 
  Trash2, 
  Trophy, 
  Home, 
  Map as MapIcon, 
  User, 
  Camera,
  Leaf,
  QrCode,
  Heart,
  MessageCircle,
  Copy,
  MoreHorizontal,
  Share2
} from 'lucide-react';
import AIScanner from './components/AIScanner';
import QRScanner from './components/QRScanner';
import MapView from './components/MapView';
import RewardsView from './components/RewardsView';
import ProfileView from './components/ProfileView';
import DetailsView from './components/DetailsView';
import NotificationsView from './components/NotificationsView';
import AchievementsView from './components/AchievementsView';
import PostDetail from './components/PostDetail';
import CreatePostView from './components/CreatePostView';
import PollItem from './components/PollItem';
import LoginView from './components/LoginView';
import { 
  getContainerLocations, 
  getHistoricalData, 
  getUserProfileFromSheet, 
  updateUserProfileInSheet,
  getHistoryFromSheet,
  logScanToSheet,
  getRankingsFromSheet,
  getLikesFromSheet,
  getUserRankings,
  getPostsFromSheet,
  getCommentsFromSheet,
  createPostInSheet,
  likePostInSheet,
  addCommentInSheet,
  logSurveyToSheet
} from './services/sheetService';
import { NeighborhoodRanking, UserProfile, UserRanking } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [rankings, setRankings] = useState<NeighborhoodRanking[]>([]);
  const [neighborhoodUsers, setNeighborhoodUsers] = useState<UserRanking[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('home');
  const [history, setHistory] = useState<any[]>([]);
  
  const [user, setUser] = useState<UserProfile | null>(null);

  const savingsTrend = React.useMemo(() => {
    if (!history || history.length === 0) return 15;
    const now = new Date();
    const last7Days = history.filter(h => {
      const d = new Date(h.date);
      return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    }).reduce((sum, h) => sum + (parseFloat(h.savings) || 0), 0);
    
    const prev7Days = history.filter(h => {
      const d = new Date(h.date);
      const diff = (now.getTime() - d.getTime());
      return diff > 7 * 24 * 60 * 60 * 1000 && diff <= 14 * 24 * 60 * 60 * 1000;
    }).reduce((sum, h) => sum + (parseFloat(h.savings) || 0), 0);

    if (prev7Days === 0) return last7Days > 0 ? 100 : 15;
    return Math.round(((last7Days - prev7Days) / prev7Days) * 100);
  }, [history]);

  const pointsToday = React.useMemo(() => {
    if (!history) return 0;
    const today = new Date().toISOString().split('T')[0];
    return history
      .filter(h => h.date === today)
      .reduce((sum, h) => sum + (parseFloat(h.points) || 0), 0);
  }, [history]);

  const totalProgress = React.useMemo(() => {
    if (!user) return 0;
    const current = user.stats.plastic + user.stats.paper + user.stats.glass;
    const total = user.goals.plastic + user.goals.paper + user.goals.glass;
    return Math.min(100, Math.round((current / total) * 100));
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const loadData = async () => {
        try {
          const [rankData, histData, neighborhoodUsersData, postsData, likesData] = await Promise.all([
            getRankingsFromSheet(),
            getHistoryFromSheet(user.id),
            getUserRankings(user.neighborhood),
            getPostsFromSheet(),
            getLikesFromSheet(user.id)
          ]);
          setRankings(rankData);
          setHistory(histData);
          setNeighborhoodUsers(neighborhoodUsersData);
          setPosts(postsData);
          setUserLikes(likesData);
          console.log("Conectividad con Google Sheets verificada.");
        } catch (error) {
          console.error("Error conectando con Google Sheets:", error);
        }
      };
      loadData();
    }
  }, [isAuthenticated, user?.id, user?.neighborhood]);

  const handleLogin = async (userData: UserProfile) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab('home');
  };

  const syncProfile = async () => {
    if (user) {
      console.log("🔄 Sincronizando perfil con Google Sheets...");
      const profile = await getUserProfileFromSheet(user.id);
      if (profile) {
        console.log("✅ Datos frescos recibidos:", profile);
        setUser(prev => {
          if (!prev) return null;
          // Keep local answeredSurvey if it was just set to true to avoid stale overwrites
          const shouldKeepLocalSurvey = prev.answeredSurvey && !profile.answeredSurvey;
          
          return {
            ...prev,
            points: profile.points,
            savings: profile.savings,
            name: profile.name || prev.name,
            email: profile.email || prev.email,
            neighborhood: profile.neighborhood || prev.neighborhood,
            stats: profile.stats || prev.stats,
            goals: profile.goals || prev.goals,
            answeredSurvey: shouldKeepLocalSurvey ? true : profile.answeredSurvey
          };
        });
        
        // Also refresh rankings, history and likes
        const [rankData, histData, nbUsers, likesData] = await Promise.all([
          getRankingsFromSheet(),
          getHistoryFromSheet(user.id),
          getUserRankings(profile.neighborhood || user.neighborhood),
          getLikesFromSheet(user.id)
        ]);
        setRankings(rankData);
        setHistory(histData);
        setNeighborhoodUsers(nbUsers);
        setUserLikes(likesData);
      }
    }
  };

  const handleScanSuccess = async (points: number) => {
    if (user) {
      console.log(`✨ Escaneo exitoso: +${points} puntos`);
      // Optimistic user update
      const newPoints = user.points + points;
      const newSavings = user.savings + (points * 0.10);
      setUser(prev => prev ? ({ ...prev, points: newPoints, savings: newSavings }) : null);
      
      // The backend is updated within AIScanner/QRScanner via logScanToSheet/logBagToSheet
      // We wait for the backend to process before refreshing everything
      setTimeout(syncProfile, 3000);
    }
  };

  const handleQRSuccess = async (code: string, type: string) => {
    if (user) {
      console.log(`✨ Bolsa registrada: ${code} (${type})`);
      // Optimistic update: 1 point = 0.10€ + 1kg
      const newPoints = user.points + 1;
      const newSavings = user.savings + 0.10;
      const newStats = { ...user.stats, [type]: (user.stats[type as keyof typeof user.stats] || 0) + 1 };
      
      setUser(prev => prev ? ({ ...prev, points: newPoints, savings: newSavings, stats: newStats }) : null);
      
      // Sync with backend after a short delay
      setTimeout(syncProfile, 3000);
    }
  };

  const currentWeekQuestion = React.useMemo(() => {
    const questions = [
      { q: "¿Separas el vidrio de las tapas de metal?", o: ["Siempre", "A veces", "Nunca"] },
      { q: "¿Llevas tus propias bolsas de tela al supermercado?", o: ["Sí, siempre", "Suelo olvidarlas", "No uso tela"] },
      { q: "¿Sabías que el aceite usado contamina 1.000 litros de agua?", o: ["Sí, lo reciclo", "No lo sabía", "Lo tiro por el fregadero"] },
      { q: "¿Evitas comprar frutas envueltas en plástico innecesario?", o: ["Sí, compro a granel", "A veces", "No me fijo"] },
      { q: "¿Usas botellas de agua reutilizables?", o: ["Sí", "Uso de plástico", "Intercambio"] },
      { q: "¿Reciclas las pilas en puntos específicos?", o: ["Sí", "Al contenedor gris", "A veces"] },
      { q: "¿Cierras el grifo mientras te cepillas los dientes?", o: ["Siempre", "A veces", "Me olvido"] },
      { q: "¿Compras productos locales de temporada?", o: ["Sí, en el mercado", "En el súper", "No me fijo"] },
      { q: "¿Sueles apagar las luces si no estás en la habitación?", o: ["Siempre", "A veces", "Pocas veces"] },
      { q: "¿Conoces el punto limpio más cercano a tu casa?", o: ["Sí perfectamente", "Sé dónde está", "Ni idea"] },
      { q: "¿Usas el transporte público por Vigo?", o: ["A diario", "A veces", "Uso coche"] },
      { q: "¿Separas los restos para el contenedor marrón?", o: ["Sí", "No tengo cerca", "No separo orgánico"] },
      { q: "¿Donas la ropa que ya no usas?", o: ["Sí siempre", "La tiro", "La guardo"] },
      { q: "¿Evitas usar cubiertos de plástico?", o: ["Sí", "No", "A veces"] },
      { q: "¿Sabías que Vigo tiene puntos limpios móviles?", o: ["Sí los uso", "Lo sabía", "No tenía ni idea"] },
      { q: "¿Reciclas el cartón de pizza con algo de grasa?", o: ["Sí al azul", "Al gris", "No sabía"] },
      { q: "¿Usas bombillas de bajo consumo en casa?", o: ["Todas LED", "Algunas", "No sé"] },
      { q: "¿Sabías que el aluminio es infinitamente reciclable?", o: ["Sí", "No", "Interesante"] },
      { q: "¿Recogeres basura si la ves en Samil o Alcabre?", o: ["Sí siempre", "A veces", "No es mi basura"] },
      { q: "¿Evitas imprimir si no es necesario?", o: ["Todo digital", "Imprimo poco", "Imprimo mucho"] },
      { q: "¿Usas servilletas de tela en vez de papel?", o: ["Sí en casa", "No", "A veces"] },
      { q: "¿Participarías en una recogida de plásticos vecinal?", o: ["¡Claro!", "Depende del día", "No tengo tiempo"] }
    ];
    
    // Calculate week of year
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const week = Math.floor(diff / oneWeek);
    
    return questions[week % questions.length];
  }, []);

  const handlePollVote = async (points: number) => {
    if (user) {
      if (user.answeredSurvey) return;
      
      const earnedPoints = points || 0.5;
      const earnedSavings = 0.05;
      
      console.log(`|u2705| Voto registrado: +${earnedPoints} punto`);
      
      // Update local state immediately
      setUser(prev => prev ? ({ ...prev, points: prev.points + earnedPoints, savings: prev.savings + earnedSavings, answeredSurvey: true }) : null);
      
      try {
        // Log to backend
        await logSurveyToSheet(user.id, { 
          points: earnedPoints, 
          savings: earnedSavings,
          item: currentWeekQuestion.q 
        });
        
        // Refresh profile after a longer delay to ensure sheet is updated
        setTimeout(syncProfile, 5000);
      } catch (error) {
        console.error("Error logging survey:", error);
      }
    }
  };

  if (!isAuthenticated || !user) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'map': return <MapView />;
      case 'rewards': return <RewardsView neighborhood={user.neighborhood} user={user} />;
      case 'profile': return (
        <ProfileView 
          user={user} 
          onUpdate={async (data) => {
            const updatedUser = { ...user, ...data };
            setUser(updatedUser);
            await updateUserProfileInSheet(updatedUser);
          }} 
          onLogout={handleLogout}
          onShowNotifications={() => setShowNotifications(true)}
          onShowAchievements={() => setShowAchievements(true)}
        />
      );
      default: return (
        <main className="flex-1 overflow-y-auto px-4 space-y-6 pb-32">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => setShowDetails(true)}
              className="flex flex-col justify-between p-5 rounded-xl bg-surface-dark border border-white/5 relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <TrendingUp size={48} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary mb-1">Ahorro Tasa</p>
                <h3 className="text-2xl font-bold text-white tracking-tight">€{user.savings.toFixed(2)}</h3>
              </div>
                <div className="mt-3 flex items-center gap-1 text-primary text-xs font-semibold bg-primary/10 w-fit px-2 py-1 rounded-lg">
                  <TrendingUp size={14} className={savingsTrend < 0 ? "rotate-180" : ""} />
                  <span>{savingsTrend > 0 ? '+' : ''}{savingsTrend}% este periodo</span>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowDetails(true)}
                className="flex flex-col justify-between p-5 rounded-xl bg-surface-dark border border-white/5 relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Leaf size={48} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary mb-1">EcoPuntos</p>
                  <h3 className="text-2xl font-bold text-white tracking-tight">{user.points.toFixed(1)} pts</h3>
                </div>
                <div className="mt-3 flex items-center gap-1 text-primary text-xs font-semibold bg-primary/10 w-fit px-2 py-1 rounded-lg">
                  <Plus size={14} />
                  <span>{pointsToday.toFixed(1)} pts hoy</span>
                </div>
              </motion.div>
          </div>

          {/* Weekly Goals */}
          <div className="w-full bg-surface-dark rounded-xl p-6 border border-white/5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Metas de Reciclaje</h2>
                <p className="text-sm text-text-secondary">Progreso Semanal</p>
              </div>
              <button onClick={() => setShowDetails(true)} className="text-primary text-sm font-medium hover:underline">Ver detalles</button>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative size-28 shrink-0">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-700" strokeWidth="3" />
                  <motion.circle 
                    cx="18" cy="18" r="16" fill="none" 
                    className="stroke-primary" strokeWidth="3" 
                    strokeDasharray="100" 
                    initial={{ strokeDashoffset: 100 }}
                    animate={{ strokeDashoffset: 100 - totalProgress }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{totalProgress}%</span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <GoalRow label="Plástico" current={user.stats.plastic} total={user.goals.plastic} color="bg-yellow-400" />
                <GoalRow label="Papel" current={user.stats.paper} total={user.goals.paper} color="bg-blue-400" />
                <GoalRow label="Vidrio" current={user.stats.glass} total={user.goals.glass} color="bg-green-400" />
              </div>
            </div>
          </div>

          {/* Next Pickups */}
          <div>
            <h3 className="text-white text-lg font-bold mb-3 px-1">Próxima Recogida - Vigo</h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              <PickupCard type="Plástico" time="07:00 - 10:00" day="Mañana" icon={<Recycle size={20} />} active />
              <PickupCard type="Papel" time="08:00 - 11:00" day="Jueves" icon={<Newspaper size={20} />} />
              <PickupCard type="Restos" time="20:00 - 23:00" day="Diario" icon={<Trash2 size={20} />} />
            </div>
          </div>

          {/* Neighborhood Ranking */}
          <div className="bg-surface-dark rounded-xl border border-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-white font-bold text-lg">Ranking: {user.neighborhood}</h3>
                <p className="text-xs text-text-secondary">Top recicladores de tu barrio</p>
              </div>
              <Trophy size={20} className="text-text-secondary" />
            </div>
            <div className="p-2">
              {neighborhoodUsers?.slice(0, 3).map((rank, i) => (
                <div key={rank.name || i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={cn("font-bold w-4", i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-400")}>{i + 1}</span>
                    <div className="h-8 w-8 rounded-full bg-cover bg-center" 
                         style={{ backgroundImage: `url('${rank.avatar}')` }} />
                    <span className="text-sm font-medium text-white">{rank.name === user.name ? "Tú" : rank.name}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{rank.points.toFixed(1)} pts</span>
                </div>
              ))}
              
              {neighborhoodUsers && neighborhoodUsers.findIndex(u => u.name === user.name) >= 3 && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-primary/20 mt-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary w-4">{neighborhoodUsers.findIndex(u => u.name === user.name) + 1}</span>
                    <div className="h-8 w-8 rounded-full bg-cover bg-center border border-primary" 
                         style={{ backgroundImage: `url('${user.avatar}')` }} />
                    <span className="text-sm font-medium text-white">Tú</span>
                  </div>
                  <span className="text-sm font-bold text-white">{user.points.toFixed(1)} pts</span>
                </div>
              )}

              {neighborhoodUsers?.length === 0 && (
                <p className="text-center text-xs text-text-secondary py-4">Sé el primero en reciclar en tu barrio</p>
              )}
            </div>
          </div>

          {/* Community Feed */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-white text-lg font-bold">Inspiración de la Comunidad</h3>
              <button 
                onClick={() => setSelectedPost('create')}
                className="text-primary text-xs font-bold bg-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <Plus size={14} />
                <span>Publicar</span>
              </button>
            </div>
            
            <PollItem 
              question={currentWeekQuestion.q}
              options={currentWeekQuestion.o}
              onVote={handlePollVote}
              hasVoted={user.answeredSurvey}
            />

            {posts.length > 0 ? posts.map((post: any) => (
              <FeedItem 
                key={post.id}
                user={post.userName} 
                location={post.userLocation} 
                time={post.timestamp} 
                content={post.text}
                image={post.imageUrl}
                likes={post.likes}
                comments={post.comments}
                isLiked={userLikes.includes(post.id)}
                onClick={() => setSelectedPost(post)}
                onLike={async () => {
                  if (userLikes.includes(post.id)) return;
                  setUserLikes(prev => [...prev, post.id]);
                  setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: (parseInt(p.likes)||0) + 1 } : p));
                  await likePostInSheet(post.id, user.id);
                }}
              />
            )) : (
              <div className="space-y-4">
                <p className="text-center text-xs text-text-secondary py-8">Cargando comunidad viguense...</p>
              </div>
            )}
          </div>
        </main>
      );
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-background-dark shadow-2xl overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-6 pt-8 bg-background-dark sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-cover bg-center border-2 border-primary" 
               style={{ backgroundImage: `url('${user.avatar}')` }} />
          <div>
            <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Hola, {user.name}</p>
            <h1 className="text-xl font-bold text-white leading-tight">
              {activeTab === 'home' ? 'Ecotrack' : 
               activeTab === 'map' ? 'Mapa de Vigo' : 
               activeTab === 'rewards' ? 'EcoPremios' : 'Mi Perfil'}
            </h1>
          </div>
        </div>
        <button 
          onClick={() => setShowNotifications(true)}
          className="relative flex items-center justify-center h-10 w-10 rounded-full bg-surface-dark text-white hover:bg-surface-dark/80 transition-colors"
        >
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 border border-surface-dark"></span>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex gap-4">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowQR(true)}
          className="flex items-center justify-center gap-2 bg-surface-dark border border-primary/30 text-primary h-14 px-6 rounded-full shadow-xl"
        >
          <QrCode size={24} />
          <span className="font-bold">Bolsa</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowScanner(true)}
          className="flex items-center justify-center gap-2 bg-primary text-background-dark h-14 px-6 rounded-full shadow-[0_0_20px_rgba(19,236,91,0.4)]"
        >
          <Camera size={24} />
          <span className="font-bold">Escanear</span>
        </motion.button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-surface-dark border-t border-white/5 px-4 pb-8 pt-2 z-20 rounded-t-2xl max-w-md">
        <div className="flex justify-between items-center">
          <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={24} />} label="Inicio" />
          <NavButton active={activeTab === 'map'} onClick={() => setActiveTab('map')} icon={<MapIcon size={24} />} label="Mapa" />
          <NavButton active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} icon={<Trophy size={24} />} label="Premios" />
          <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={24} />} label="Perfil" />
        </div>
      </nav>

      {/* Overlays */}
      <AnimatePresence>
        {showScanner && (
          <AIScanner 
            userId={user.id}
            onClose={() => setShowScanner(false)} 
            onSuccess={handleScanSuccess}
          />
        )}
        {showQR && (
          <QRScanner 
            userId={user.id}
            onClose={() => setShowQR(false)} 
            onSuccess={handleQRSuccess}
          />
        )}
        {showDetails && (
          <DetailsView 
            onClose={() => setShowDetails(false)} 
            user={user}
            history={history}
          />
        )}
        {showNotifications && (
          <NotificationsView 
            onClose={() => setShowNotifications(false)} 
          />
        )}
        {showAchievements && (
          <AchievementsView 
            onClose={() => setShowAchievements(false)} 
          />
        )}
        {selectedPost && (
          selectedPost === 'create' ? (
            <CreatePostView 
              user={user}
              onClose={() => setSelectedPost(null)}
              onSuccess={() => {
                setSelectedPost(null);
                setTimeout(async () => {
                  const postsData = await getPostsFromSheet();
                  setPosts(postsData);
                }, 2000);
              }}
            />
          ) : (
            <PostDetail 
              currentUser={user}
              post={selectedPost}
              onClose={() => setSelectedPost(null)}
            />
          )
        )}
      </AnimatePresence>
    </div>
  );
}

function FeedItem({ user, location, time, content, image, likes, comments, onClick, onLike, isLiked }: any) {
  const formattedTime = React.useMemo(() => {
    if (!time) return "Recién";
    const d = new Date(time);
    if (isNaN(d.getTime())) return time;
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 60) return `Hace ${mins} min`;
    if (hours < 24) return `Hace ${hours} h`;
    return `Hace ${days} d`;
  }, [time]);

  return (
    <div className="bg-surface-dark rounded-xl p-3 border border-white/5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-cover bg-center" 
             style={{ backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${user}')` }} />
        <div>
          <h4 className="text-sm font-bold text-white">{user}</h4>
          <p className="text-xs text-text-secondary">{formattedTime} • {location}</p>
        </div>
        <button className="ml-auto text-text-secondary" onClick={onClick}>
          <MoreHorizontal size={20} />
        </button>
      </div>
      <div 
        onClick={onClick}
        className="rounded-lg overflow-hidden mb-3 aspect-video bg-black/20 cursor-pointer"
      >
        <img src={image || "https://picsum.photos/seed/vigo/800/450"} alt="Post" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
      <p className="text-sm text-slate-300 mb-3 px-1 cursor-pointer" onClick={onClick}>
        {content}
      </p>
      <div className="flex items-center justify-between border-t border-white/5 pt-2">
        <div className="flex gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            className={cn("flex items-center gap-1.5 transition-colors", isLiked ? "text-red-500" : "text-text-secondary hover:text-red-500")}
          >
            <Heart size={18} className={isLiked ? "fill-red-500" : ""} />
            <span className="text-xs font-medium">{likes}</span>
          </button>
          <button className="flex items-center gap-1.5 text-text-secondary hover:text-primary transition-colors" onClick={onClick}>
            <MessageCircle size={18} />
            <span className="text-xs font-medium">{comments}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function GoalRow({ label, current, total, color }: { label: string, current: number, total: number, color: string }) {
  const percentage = (current / total) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white">{label}</span>
        <span className="text-text-secondary">{current}/{total} kg</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={cn("h-1.5 rounded-full", color)} 
        />
      </div>
    </div>
  );
}

function PickupCard({ type, time, day, icon, active = false }: { type: string, time: string, day: string, icon: React.ReactNode, active?: boolean }) {
  return (
    <div className={cn(
      "min-w-[140px] p-4 rounded-xl border flex flex-col gap-2 transition-all",
      active ? "bg-[#23482f] border-primary/30" : "bg-surface-dark border-white/5 opacity-70"
    )}>
      <div className="flex justify-between items-start">
        <div className={cn("p-2 rounded-lg", active ? "bg-primary/20 text-primary" : "bg-white/10 text-text-secondary")}>
          {icon}
        </div>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", active ? "bg-white/10 text-white" : "text-text-secondary")}>
          {day}
        </span>
      </div>
      <div>
        <p className="text-white font-bold text-sm">{type}</p>
        <p className="text-text-secondary text-[10px] mt-1">{time}</p>
      </div>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex flex-1 flex-col items-center justify-center gap-1 transition-colors", active ? "text-primary" : "text-text-secondary")}>
      <div className={cn("flex h-8 w-12 items-center justify-center rounded-full transition-colors", active && "bg-primary/20")}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
