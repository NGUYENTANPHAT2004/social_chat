import { MessageStatus, MessageType } from "./enums";
import { UserBasic } from "./user";

export interface Message {
  _id: string;
  sender: string;
  recipient: string;
  conversation: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  image: string;
  metadata: Record<string, unknown>;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  [key: string]: unknown;
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
    [key: string]: unknown;
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