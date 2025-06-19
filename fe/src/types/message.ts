export interface Message {
  _id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'gift' | 'system';
  sender: UserBasic;
  conversation: string;
  replyTo?: Message;
  attachments?: MessageAttachment[];
  metadata?: MessageMetadata;
  isEdited: boolean;
  readBy: MessageReadStatus[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface MessageAttachment {
  url: string;
  type: string;
  name: string;
  size: number;
  thumbnailUrl?: string;
  duration?: number; // for audio/video files
  width?: number;    // for images/videos
  height?: number;   // for images/videos
}

export interface MessageMetadata {
  giftId?: string;
  giftName?: string;
  giftImage?: string;
  giftValue?: number;
  systemType?: 'user_joined' | 'user_left' | 'room_created' | 'settings_changed';
  [key: string]: any;
}

export interface MessageReadStatus {
  user: string;
  readAt: Date;
}

export interface Conversation {
  _id: string;
  type: 'direct' | 'group' | 'room';
  participants: UserBasic[];
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
  createdAt: string;
  updatedAt: string;
  
  // For group/room conversations
  name?: string;
  avatar?: string;
  description?: string;
  owner?: UserBasic;
  admins?: UserBasic[];
}

export interface SendMessageDto {
  content: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'file';
  conversationId?: string;
  recipientId?: string; // For direct messages
  replyToId?: string;
  attachments?: File[];
  metadata?: {
    giftId?: string;
    [key: string]: any;
  };
}

export interface ConversationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'direct' | 'group' | 'room' | 'all';
  archived?: boolean;
  unreadOnly?: boolean;
}

export interface MessageQueryParams {
  page?: number;
  limit?: number;
  before?: string; // Message ID for pagination
  after?: string;
  type?: string;
  search?: string;
  senderId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ConversationFilters {
  type: 'all' | 'direct' | 'group' | 'room';
  unreadOnly: boolean;
  archived: boolean;
}

export interface TypingStatus {
  conversationId: string;
  users: UserBasic[];
  timestamp: number;
}