// src/types/enums.ts

// User related enums
export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    BANNED = 'banned',
  }
  
  export enum UserRole {
    USER = 'user',
    MODERATOR = 'moderator',
    ADMIN = 'admin',
  }
  
  // Room related enums
  export enum RoomType {
    PUBLIC = 'public',
    PRIVATE = 'private',
  }
  
  export enum RoomStatus {
    ACTIVE = 'active',
    LIVE = 'live',
    INACTIVE = 'inactive',
  }
  
  // Game related enums
  export enum GameType {
    SLOT = 'slot',
    CARD = 'card',
    LONGHU = 'longhu',
    WHEEL = 'wheel',
  }
  
  export enum GameStatus {
    ACTIVE = 'active',
    MAINTENANCE = 'maintenance',
    COMING_SOON = 'coming_soon',
  }
  
  export enum GameSessionStatus {
    WAITING = 'waiting',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
  }
  
  // Transaction related enums
  export enum TransactionType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
    GIFT = 'gift',
    BET = 'bet',
    WIN = 'win',
  }
  
  export enum TransactionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded',
  }
  
  // Notification related enums
  export enum NotificationType {
    MESSAGE = 'message',
    FRIEND_REQUEST = 'friend_request',
    GIFT = 'gift',
    SYSTEM = 'system',
  }