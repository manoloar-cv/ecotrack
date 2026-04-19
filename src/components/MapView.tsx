import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Info, Search, Layers, Filter } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getContainerLocations } from '../services/sheetService';
import { ContainerLocation } from '../types';
import { cn } from '../lib/utils';

// Fix for default marker icons in Leaflet using CDN to avoid build issues
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const WASTE_TYPES = [
  { id: 'ALL', label: 'Todos', color: 'bg-white' },
  { id: 'AMARILLO', label: 'Amarillo', color: 'bg-yellow-400' },
  { id: 'AZUL', label: 'Azul', color: 'bg-blue-500' },
  { id: 'VERDE', label: 'Verde', color: 'bg-green-500' },
  { id: 'MARRÓN', label: 'Marrón', color: 'bg-amber-800' },
];

// Helper to create colored icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

const getIconForType = (type: string) => {
  switch (type) {
    case 'AMARILLO': return createCustomIcon('#facc15');
    case 'AZUL': return createCustomIcon('#3b82f6');
    case 'VERDE': return createCustomIcon('#22c55e');
    case 'MARRÓN': return createCustomIcon('#92400e');
    default: return createCustomIcon('#6b7280');
  }
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}

export default function MapView() {
  const [locations, setLocations] = useState<ContainerLocation[]>([]);
  const [selected, setSelected] = useState<ContainerLocation | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [mapType, setMapType] = useState<'satellite' | 'street'>('street');

  const vigoCenter: [number, number] = [42.2328, -8.7226];

  useEffect(() => {
    getContainerLocations().then(setLocations);
  }, []);

  const filteredLocations = locations.filter(loc => filter === 'ALL' || loc.type === filter);

  return (
    <div className="flex-1 flex flex-col relative h-full">
      {/* Leaflet Map */}
      <div className="absolute inset-0 z-0 bg-background-dark">
        <MapContainer 
          key={mapType}
          center={vigoCenter} 
          zoom={14} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          {mapType === 'street' ? (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          ) : (
            <TileLayer
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          )}
          
          {filteredLocations.map(loc => (
            <Marker 
              key={loc.id} 
              position={[loc.lat, loc.lng]} 
              icon={getIconForType(loc.type)}
              eventHandlers={{
                click: () => setSelected(loc),
              }}
            >
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold text-background-dark">Contenedor {loc.type}</h4>
                  <p className="text-xs text-slate-600">{loc.address}</p>
                </div>
              </Popup>
            </Marker>
          ))}
          
          <ChangeView center={vigoCenter} zoom={14} />
          <MapResizer />
        </MapContainer>
      </div>

      {/* Search & Filters */}
      <div className="absolute top-6 left-4 right-4 z-[1000] space-y-3">
        <div className="bg-surface-dark/90 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-center gap-3 shadow-xl">
          <Search size={20} className="text-text-secondary" />
          <input 
            type="text" 
            placeholder="Buscar contenedores en Vigo..." 
            className="bg-transparent border-none focus:ring-0 text-white text-sm flex-1"
          />
          <button 
            onClick={() => setMapType(mapType === 'satellite' ? 'street' : 'satellite')}
            className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
          >
            <Layers size={18} />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {WASTE_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                filter === t.id 
                  ? "bg-primary text-background-dark border-primary" 
                  : "bg-surface-dark/80 backdrop-blur-md text-white border-white/10"
              )}
            >
              <div className="flex items-center gap-2">
                {t.id !== 'ALL' && <div className={cn("w-2 h-2 rounded-full", t.color)} />}
                {t.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-auto p-4 z-[1000]">
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div 
              key="selected-card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-surface-dark p-5 rounded-2xl border border-primary/20 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">Contenedor {selected.type}</h3>
                  <p className="text-text-secondary text-sm flex items-center gap-1">
                    <MapPin size={14} /> {selected.address}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="text-text-secondary hover:text-white">
                  <Filter size={18} />
                </button>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 bg-primary text-background-dark font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <Navigation size={18} /> Cómo llegar
                </button>
                <button className="size-12 bg-white/5 text-white rounded-xl flex items-center justify-center hover:bg-white/10">
                  <Info size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
