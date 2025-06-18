export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  balance: number;
  isOnline: boolean;
  lastSeen?: Date;
  role: 'user' | 'admin' | 'moderator';
  createdAt: Date;
  updatedAt: Date;
  phone?: string;
  location?: string;
  bio?: string;
  birthDate?: string;
  stats?: {
    gamesPlayed: number;
    gamesWon: number;
    totalEarnings: number;
    followersCount: number;
    followingCount: number;
  };
  preferences?: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
}

export interface UserProfile extends Omit<User, 'preferences'> {
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
}

export interface UserBasic {
  id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sound: boolean;
  games: boolean;
  gifts: boolean;
  messages: boolean;
  streams: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  image?: string;
  type: 'private' | 'group' | 'public';
  participants: User[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'gift' | 'system';
  userId: string;
  roomId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageWithSender extends Message {
  user: UserBasic;
  isMine?: boolean;
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
  totalKCWon: number;
  totalKCBet: number;
  isActive: boolean;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameSession {
  id: string;
  gameId: string;
  userId: string;
  betAmount: number;
  betType: string;
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
  host: UserBasic;
  image: string;
  streamUrl?: string;
  isLive: boolean;
  viewerCount: number;
  maxViewers: number;
  category: string;
  tags: string[];
  settings: {
    isPrivate: boolean;
    requiresApproval: boolean;
    maxQuality: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GiftItem {
  id: string;
  name: string;
  icon: string;
  price: number;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  animation?: string;
  description?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'game_win' | 'game_lose' | 'gift_send' | 'gift_receive';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'system' | 'gift' | 'game' | 'social' | 'payment';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

// State Interfaces
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ChatState {
  activeChat: string | null;
  messages: Record<string, MessageWithSender[]>;
  chatRooms: ChatRoom[];
  loading: boolean;
  error: string | null;
  inputText: string;
}

export interface GameState {
  games: Game[];
  popularGames: Game[];
  currentGame: Game | null;
  currentSession: GameSession | null;
  history: GameSession[];
  balance: number;
  currentBet: number;
  loading: boolean;
  error: string | null;
}

export interface RoomState {
  rooms: Room[];
  myRooms: Room[];
  liveRooms: Room[];
  currentRoom: Room | null;
  viewers: UserBasic[];
  loading: boolean;
  error: string | null;
  streamUrl: string | null;
}

export interface UserState {
  profile: UserProfile | null;
  otherProfiles: Record<string, UserBasic>;
  friends: UserBasic[];
  friendRequests: {
    incoming: UserBasic[];
    outgoing: UserBasic[];
  };
  transactions: Transaction[];
  notifications: Notification[];
  loading: boolean;
  error: string | null;
}

// API Response Types
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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// DTO Interfaces
export interface CreateRoomDto {
  name: string;
  description: string;
  category: string;
  tags: string[];
  isPrivate: boolean;
  maxViewers: number;
}

export interface UpdateRoomDto extends Partial<CreateRoomDto> {}

export interface SendMessageDto {
  content: string;
  type?: 'text' | 'image' | 'file';
  metadata?: Record<string, any>;
}

export interface PlaceBetDto {
  amount: number;
  betType: string;
  metadata?: Record<string, any>;
}
