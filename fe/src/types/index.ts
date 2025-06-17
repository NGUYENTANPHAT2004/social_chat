export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  balance: number;
  isOnline: boolean;
  lastSeen?: Date;
  role: 'user' | 'admin' | 'moderator';
}

export interface Game {
  id: string;
  name: string;
  type: 'lucky' | 'lucky7' | 'coinflip' | 'daily_spin';
  description: string;
  image: string;
  minBet: number;
  maxBet: number;
  winRate: number;
  multiplier: number;
  playCount: number;
  isActive: boolean;
  config: Record<string, any>;
}

export interface GameSession {
  id: string;
  gameId: string;
  userId: string;
  betAmount: number;
  result?: any;
  winAmount?: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  hostId: string;
  host: User;
  image: string;
  isLive: boolean;
  viewerCount: number;
  maxViewers: number;
  category: string;
  tags: string[];
  createdAt: Date;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  user: User;
  roomId: string;
  type: 'text' | 'image' | 'gift' | 'system';
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}