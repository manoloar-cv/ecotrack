export type WasteType = 'plastic' | 'paper' | 'glass' | 'organic' | 'rest';

export interface ScanLog {
  id: string;
  userId: string;
  timestamp: number;
  item: string;
  container: 'AMARILLO' | 'AZUL' | 'VERDE' | 'MARRÓN' | 'GRIS';
  wasteType: WasteType;
  points: number;
  neighborhood: string;
}

export interface BagLog {
  id: string;
  userId: string;
  timestamp: number;
  bagCode: string;
  neighborhood: string;
}

export interface NeighborhoodRanking {
  neighborhood: string;
  points: number;
  trend: number;
}

export interface UserRanking {
  name: string;
  points: number;
  avatar: string;
  isMe?: boolean;
}

export interface ContainerLocation {
  id: string;
  type: 'AMARILLO' | 'AZUL' | 'VERDE' | 'MARRÓN' | 'GRIS';
  lat: number;
  lng: number;
  address: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  points: number;
  savings: number;
  neighborhood: string;
  avatar: string;
  stats: {
    plastic: number;
    paper: number;
    glass: number;
    organic: number;
    rest: number;
  };
  goals: {
    plastic: number;
    paper: number;
    glass: number;
  };
  answeredSurvey?: boolean;
}
