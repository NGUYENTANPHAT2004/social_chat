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

// Room Enums (🔧 Đã cập nhật)
export enum RoomType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  VIP = 'vip',
}

export enum RoomStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

// Game Enums (🔧 Đã thay thế hoàn toàn)
export enum GameType {
  LUCKY = 'lucky',
  LUCKY7 = 'lucky7',
  COINFLIP = 'coinflip',
  DAILY_SPIN = 'daily_spin',
}

export enum GameStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

export enum GameResult {
  WIN = 'win',
  LOSE = 'lose',
}

// Transaction Enums (🔧 Đã bổ sung đầy đủ)
export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  TRANSFER = 'transfer',
  GIFT = 'gift',
  SUBSCRIPTION = 'subscription',
  SYSTEM = 'system',
  REWARD = 'reward',
  PURCHASE = 'purchase',
  REFUND = 'refund',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum CurrencyType {
  VND = 'vnd',
  KC = 'kc',
}

// Message Enums (🔧 Đã đồng bộ)
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  GIFT = 'gift',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  DELETED = 'deleted',
}

// Conversation Enums
export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked',
}

// Notification Enums (🔧 Đã bổ sung đầy đủ)
export enum NotificationType {
  SYSTEM = 'system',
  FOLLOW = 'follow',
  LIKE = 'like',
  COMMENT = 'comment',
  MENTION = 'mention',
  MESSAGE = 'message',
  GIFT = 'gift',
  STREAM = 'stream',
  PAYMENT = 'payment',
  ADMIN = 'admin',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
}
export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  POLL = 'poll',
  SHARED = 'shared',
}

export enum PostStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
  HIDDEN = 'hidden',
  PENDING_REVIEW = 'pending_review',
}

// Comment Enums
export enum CommentStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
  HIDDEN = 'hidden',
}

// Gift Enums
export enum GiftType {
  STATIC = 'static',
  ANIMATED = 'animated',
  SPECIAL = 'special',
}

export enum GiftStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SEASONAL = 'seasonal',
}

// Streaming Enums
export enum StreamStatus {
  OFFLINE = 'offline',
  LIVE = 'live',
  COMPLETED = 'completed',
  BANNED = 'banned',
}

// Moderation Enums
export enum ModerationAction {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}

export enum ModerationStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  AUTO_MODERATED = 'auto_moderated',
}

export enum ContentType {
  IMAGE = 'image',
  VIDEO = 'video',
  TEXT = 'text',
  STREAM = 'stream',
  USER = 'user',
}

// Report Enums
export enum ReportType {
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  IMPERSONATION = 'impersonation',
  COPYRIGHT = 'copyright',
  ILLEGAL_CONTENT = 'illegal_content',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum ReportContentType {
  USER = 'user',
  POST = 'post',
  COMMENT = 'comment',
  ROOM = 'room',
  MESSAGE = 'message',
  STREAM = 'stream',
}