// src/types/index.ts

// ======= User related interfaces =======
export interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    kcBalance: number;
    status: 'active' | 'inactive' | 'banned';
    role: 'user' | 'moderator' | 'admin';
    createdAt: string;
    updatedAt: string;
  }
  
  export interface UserProfile extends User {
    bio?: string;
    location?: string;
    birthday?: string;
    followers?: number;
    following?: number;
    settings?: UserSettings;
  }
  
  export interface UserSettings {
    notifications: boolean;
    privacy: 'public' | 'private' | 'friends';
    theme: 'light' | 'dark' | 'system';
    language: string;
  }
  
  // ======= Chat related interfaces =======
  export interface Message {
    id: string;
    roomId: string;
    userId: string;
    content: string;
    attachments?: Attachment[];
    createdAt: string;
    updatedAt?: string;
  }
  
  export interface MessageWithSender extends Message {
    sender: {
      id: string;
      username: string;
      avatar?: string;
    };
    isMine?: boolean;
  }
  
  export interface Attachment {
    id: string;
    type: 'image' | 'video' | 'file';
    url: string;
    name?: string;
    size?: number;
    mimeType?: string;
  }
  
  export interface ChatRoom {
    id: string;
    name: string;
    avatar?: string;
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount: number;
    isOnline?: boolean;
    participants?: UserBasic[];
    isGroup?: boolean;
  }
  
  // ======= Room/Livestream related interfaces =======
  export interface Room {
    id: string;
    title: string;
    hostId: string;
    host?: UserBasic;
    roomType: 'public' | 'private';
    status: 'active' | 'live' | 'inactive';
    viewers: number;
    streamKey: string;
    description?: string;
    thumbnail?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
  }
  
  export interface RoomViewer {
    id: string;
    userId: string;
    user?: UserBasic;
    roomId: string;
    joinedAt: string;
  }
  
  // ======= Game related interfaces =======
  export interface Game {
    id: string;
    name: string;
    type: 'slot' | 'card' | 'longhu' | 'wheel';
    description?: string;
    thumbnail?: string;
    minBet: number;
    maxBet: number;
    activePlayers?: number;
    rules?: any;
    status: 'active' | 'maintenance' | 'coming_soon';
  }
  
  export interface GameSession {
    id: string;
    gameId: string;
    game?: Game;
    players: GamePlayer[];
    startedAt: string;
    endedAt?: string;
    status: 'waiting' | 'in_progress' | 'completed';
    results?: any;
  }
  
  export interface GamePlayer {
    id: string;
    userId: string;
    user?: UserBasic;
    sessionId: string;
    bet: number;
    winAmount?: number;
    status: 'waiting' | 'playing' | 'finished';
  }
  
  // ======= Gift related interfaces =======
  export interface Gift {
    id: string;
    name: string;
    icon: string;
    price: number;
    animation?: string;
    category: string;
    effects?: string[];
  }
  
  export interface GiftSent {
    id: string;
    giftId: string;
    gift?: Gift;
    senderId: string;
    sender?: UserBasic;
    receiverId: string;
    receiver?: UserBasic;
    roomId?: string;
    amount: number;
    createdAt: string;
  }
  
  // ======= Transaction related interfaces =======
  export interface Transaction {
    id: string;
    userId: string;
    type: 'deposit' | 'withdraw' | 'gift' | 'bet' | 'win';
    amount: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentMethod?: string;
    referenceId?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  // ======= Basic user info used in many places =======
  export interface UserBasic {
    id: string;
    username: string;
    avatar?: string;
    isOnline?: boolean;
  }
  
  // ======= API response interfaces =======
  export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
  }
  
  export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  
  // ======= Redux state interfaces =======
  export interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
  }
  
  export interface ChatState {
    activeChat: string | null;
    messages: {
      [roomId: string]: MessageWithSender[];
    };
    chatRooms: ChatRoom[];
    loading: boolean;
    error: string | null;
    inputText: string;
  }
  
  export interface RoomState {
    rooms: Room[];
    myRooms: Room[];
    liveRooms: Room[];
    currentRoom: Room | null;
    viewers: RoomViewer[];
    loading: boolean;
    error: string | null;
    streamUrl: string | null;
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
  
  export interface UserState {
    profile: UserProfile | null;
    otherProfiles: {
      [userId: string]: UserProfile;
    };
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
  
  // ======= Notification interfaces =======
  export interface Notification {
    id: string;
    userId: string;
    type: 'message' | 'friend_request' | 'gift' | 'system';
    content: string;
    isRead: boolean;
    relatedId?: string;
    createdAt: string;
  }
  
  // ======= Form data interfaces (DTOs) =======
  export interface LoginDto {
    email: string;
    password: string;
  }
  
  export interface RegisterDto {
    username: string;
    email: string;
    password: string;
  }
  
  export interface CreateRoomDto {
    title: string;
    roomType?: 'public' | 'private';
    description?: string;
  }
  
  export interface UpdateRoomDto {
    title?: string;
    roomType?: 'public' | 'private';
    description?: string;
  }
  
  export interface SendMessageDto {
    content: string;
    attachments?: string[];
  }
  
  export interface CreateTransactionDto {
    amount: number;
    paymentMethod: string;
  }
  
  export interface PlaceBetDto {
    gameId: string;
    betAmount: number;
    betType?: string;
    options?: any;
  }