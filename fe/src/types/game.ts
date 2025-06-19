export interface Game {
  _id: string;
  name: string;
  description: string;
  type: 'casino' | 'skill' | 'lottery';
  minBet: number;
  maxBet: number;
  isActive: boolean;
  players: number;
  rules: any;
  createdAt: string;
  updatedAt: string;
}

export interface GameSession {
  _id: string;
  gameId: string;
  playerId: string;
  bet: number;
  result?: any;
  winAmount?: number;
  status: 'active' | 'completed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
}