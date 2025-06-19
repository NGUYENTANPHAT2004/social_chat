// src/utils/room.utils.ts
import { Room, RoomMember } from '@/services/room.service';
import { User } from '@/services/message.service';
import { 
  ROOM_TYPES, 
  ROOM_STATUS, 
  ROOM_TYPE_LABELS, 
  ROOM_STATUS_LABELS,
  ROOM_MEMBER_ROLES,
  ROOM_MEMBER_ROLE_LABELS,
  VALIDATION 
} from '@/constants';

export class RoomUtils {
  // Room type helpers
  static getRoomTypeLabel(type: keyof typeof ROOM_TYPES): string {
    return ROOM_TYPE_LABELS[ROOM_TYPES[type]] || 'Unknown';
  }

  static getRoomStatusLabel(status: keyof typeof ROOM_STATUS): string {
    return ROOM_STATUS_LABELS[ROOM_STATUS[status]] || 'Unknown';
  }

  static getRoomStatusColor(status: Room['status']): string {
    switch (status) {
      case 'live':
        return 'bg-red-500 text-white';
      case 'inactive':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  static getRoomTypeBadgeColor(type: Room['type']): string {
    switch (type) {
      case 'public':
        return 'bg-green-500 text-white';
      case 'private':
        return 'bg-blue-500 text-white';
      case 'password':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  // Room permission helpers
  static isRoomOwner(room: Room, userId: string): boolean {
    return room.owner._id === userId;
  }

  static isRoomMember(room: Room, userId: string): boolean {
    return room.members.includes(userId);
  }

  static isRoomFollower(room: Room, userId: string): boolean {
    return room.followers.includes(userId);
  }

  static canJoinRoom(room: Room, user: User, userKC: number): boolean {
    // Check if already a member
    if (this.isRoomMember(room, user._id)) {
      return false;
    }

    // Check KC requirement
    if (userKC < room.settings.minKCToJoin) {
      return false;
    }

    // Check age requirement
    if (room.settings.minAgeRequired > 0) {
      // You would need to calculate user age from profile.birthdate
      // For now, we'll skip this check
    }

    return true;
  }

  static canModerateRoom(room: Room, member: RoomMember): boolean {
    return member.role === 'owner' || member.role === 'moderator';
  }

  static canDeleteRoom(room: Room, userId: string): boolean {
    return this.isRoomOwner(room, userId);
  }

  static canStartStream(room: Room, userId: string): boolean {
    return this.isRoomOwner(room, userId) && room.status !== 'live';
  }

  static canEndStream(room: Room, userId: string): boolean {
    return this.isRoomOwner(room, userId) && room.status === 'live';
  }

  // Room validation
  static validateRoomName(name: string): { isValid: boolean; error?: string } {
    if (!name.trim()) {
      return { isValid: false, error: 'Room name is required' };
    }

    if (name.length < VALIDATION.ROOM_NAME_MIN_LENGTH) {
      return { 
        isValid: false, 
        error: `Room name must be at least ${VALIDATION.ROOM_NAME_MIN_LENGTH} characters` 
      };
    }

    if (name.length > VALIDATION.ROOM_NAME_MAX_LENGTH) {
      return { 
        isValid: false, 
        error: `Room name must not exceed ${VALIDATION.ROOM_NAME_MAX_LENGTH} characters` 
      };
    }

    return { isValid: true };
  }

  static validateRoomDescription(description: string): { isValid: boolean; error?: string } {
    if (description && description.length > VALIDATION.ROOM_DESCRIPTION_MAX_LENGTH) {
      return { 
        isValid: false, 
        error: `Description must not exceed ${VALIDATION.ROOM_DESCRIPTION_MAX_LENGTH} characters` 
      };
    }

    return { isValid: true };
  }

  static validateRoomPassword(password: string, required: boolean = false): { isValid: boolean; error?: string } {
    if (required && !password.trim()) {
      return { isValid: false, error: 'Password is required' };
    }

    if (password && password.length < VALIDATION.ROOM_PASSWORD_MIN_LENGTH) {
      return { 
        isValid: false, 
        error: `Password must be at least ${VALIDATION.ROOM_PASSWORD_MIN_LENGTH} characters` 
      };
    }

    if (password && password.length > VALIDATION.ROOM_PASSWORD_MAX_LENGTH) {
      return { 
        isValid: false, 
        error: `Password must not exceed ${VALIDATION.ROOM_PASSWORD_MAX_LENGTH} characters` 
      };
    }

    return { isValid: true };
  }

  static validateRoomTags(tags: string[]): { isValid: boolean; error?: string } {
    if (tags.length > VALIDATION.MAX_ROOM_TAGS) {
      return { 
        isValid: false, 
        error: `Maximum ${VALIDATION.MAX_ROOM_TAGS} tags allowed` 
      };
    }

    for (const tag of tags) {
      if (tag.trim().length === 0) {
        return { isValid: false, error: 'Tags cannot be empty' };
      }
      if (tag.length > 20) {
        return { isValid: false, error: 'Each tag must not exceed 20 characters' };
      }
    }

    return { isValid: true };
  }

  // Room formatting helpers
  static formatViewerCount(count: number): string {
    if (count < 1000) {
      return count.toString();
    } else if (count < 1000000) {
      return `${(count / 1000).toFixed(1)}K`;
    } else {
      return `${(count / 1000000).toFixed(1)}M`;
    }
  }

  static formatRoomDuration(startTime: string): string {
    const start = new Date(startTime);
    const now = new Date();
    const duration = now.getTime() - start.getTime();
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  static truncateRoomDescription(description: string, maxLength: number = 100): string {
    if (description.length <= maxLength) {
      return description;
    }
    return description.substring(0, maxLength) + '...';
  }

  // Room search and filtering
  static filterRooms(rooms: Room[], filters: {
    search?: string;
    type?: Room['type'] | 'all';
    status?: Room['status'] | 'all';
    tags?: string[];
    minViewers?: number;
    maxViewers?: number;
  }): Room[] {
    return rooms.filter(room => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          room.name.toLowerCase().includes(searchLower) ||
          room.description?.toLowerCase().includes(searchLower) ||
          room.owner.username.toLowerCase().includes(searchLower) ||
          room.tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filters.type && filters.type !== 'all' && room.type !== filters.type) {
        return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all' && room.status !== filters.status) {
        return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          room.tags.some(roomTag => roomTag.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasMatchingTag) return false;
      }

      // Viewer count filters
      if (filters.minViewers !== undefined && room.viewers < filters.minViewers) {
        return false;
      }

      if (filters.maxViewers !== undefined && room.viewers > filters.maxViewers) {
        return false;
      }

      return true;
    });
  }

  static sortRooms(rooms: Room[], sortBy: 'name' | 'viewers' | 'createdAt' = 'viewers', order: 'asc' | 'desc' = 'desc'): Room[] {
    return [...rooms].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'viewers':
          comparison = a.viewers - b.viewers;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          comparison = 0;
      }

      return order === 'desc' ? -comparison : comparison;
    });
  }

  // Room member helpers
  static getMemberRoleLabel(role: keyof typeof ROOM_MEMBER_ROLES): string {
    return ROOM_MEMBER_ROLE_LABELS[ROOM_MEMBER_ROLES[role]] || 'Unknown';
  }

  static getMemberRoleColor(role: RoomMember['role']): string {
    switch (role) {
      case 'owner':
        return 'bg-purple-500 text-white';
      case 'moderator':
        return 'bg-blue-500 text-white';
      case 'member':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  static sortRoomMembers(members: RoomMember[], sortBy: 'role' | 'joinedAt' | 'username' = 'role'): RoomMember[] {
    return [...members].sort((a, b) => {
      switch (sortBy) {
        case 'role':
          const roleOrder = { owner: 0, moderator: 1, member: 2 };
          return roleOrder[a.role] - roleOrder[b.role];
        case 'joinedAt':
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        case 'username':
          return a.username.localeCompare(b.username);
        default:
          return 0;
      }
    });
  }

  // Room settings helpers
  static getDefaultRoomSettings() {
    return {
      allowChat: true,
      allowGifts: true,
      minKCToJoin: 0,
      slowMode: false,
      slowModeInterval: 5,
      followersOnly: false,
      minAgeRequired: 0,
    };
  }

  static validateRoomSettings(settings: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settings.minKCToJoin < 0) {
      errors.push('Minimum KC to join cannot be negative');
    }

    if (settings.minKCToJoin > VALIDATION.MAX_KC_DEPOSIT) {
      errors.push(`Minimum KC to join cannot exceed ${VALIDATION.MAX_KC_DEPOSIT}`);
    }

    if (settings.slowModeInterval < 1) {
      errors.push('Slow mode interval must be at least 1 second');
    }

    if (settings.slowModeInterval > 300) {
      errors.push('Slow mode interval cannot exceed 300 seconds');
    }

    if (settings.minAgeRequired < 0) {
      errors.push('Minimum age requirement cannot be negative');
    }

    if (settings.minAgeRequired > 100) {
      errors.push('Minimum age requirement cannot exceed 100');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// src/utils/message.utils.ts
import { Message, Conversation } from '@/services/message.service';
import { MESSAGE_TYPES, MESSAGE_TYPE_LABELS, CONVERSATION_TYPES, VALIDATION } from '@/constants';

export class MessageUtils {
  // Message type helpers
  static getMessageTypeLabel(type: keyof typeof MESSAGE_TYPES): string {
    return MESSAGE_TYPE_LABELS[MESSAGE_TYPES[type]] || 'Unknown';
  }

  static isTextMessage(message: Message): boolean {
    return message.type === 'text';
  }

  static isMediaMessage(message: Message): boolean {
    return ['image', 'video', 'audio'].includes(message.type);
  }

  static isFileMessage(message: Message): boolean {
    return message.type === 'file';
  }

  static isGiftMessage(message: Message): boolean {
    return message.type === 'gift';
  }

  static isSystemMessage(message: Message): boolean {
    return message.type === 'system';
  }

  // Message validation
  static validateMessageContent(content: string, type: string = 'text'): { isValid: boolean; error?: string } {
    if (type === 'text' && !content.trim()) {
      return { isValid: false, error: 'Message cannot be empty' };
    }

    if (content.length > VALIDATION.MESSAGE_MAX_LENGTH) {
      return { 
        isValid: false, 
        error: `Message cannot exceed ${VALIDATION.MESSAGE_MAX_LENGTH} characters` 
      };
    }

    return { isValid: true };
  }

  static validateMessageAttachments(attachments: File[]): { 
    isValid: boolean; 
    errors: string[];
    validFiles: File[];
    invalidFiles: File[];
  } {
    const errors: string[] = [];
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];

    if (attachments.length > VALIDATION.MAX_ATTACHMENTS) {
      errors.push(`Maximum ${VALIDATION.MAX_ATTACHMENTS} attachments allowed`);
    }

    const maxSize = VALIDATION.MAX_FILE_SIZE_MB * 1024 * 1024; // Convert to bytes

    attachments.forEach(file => {
      if (file.size > maxSize) {
        errors.push(`File ${file.name} exceeds ${VALIDATION.MAX_FILE_SIZE_MB}MB limit`);
        invalidFiles.push(file);
      } else {
        validFiles.push(file);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      validFiles,
      invalidFiles,
    };
  }

  // Message formatting
  static formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  static formatMessageTimeDetailed(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  static getLastMessagePreview(message: Message, maxLength: number = 50): string {
    let preview = '';

    switch (message.type) {
      case 'text':
        preview = message.content;
        break;
      case 'image':
        preview = '📷 Image';
        break;
      case 'video':
        preview = '🎥 Video';
        break;
      case 'audio':
        preview = '🎵 Audio';
        break;
      case 'file':
        preview = '📎 File';
        break;
      case 'gift':
        preview = `🎁 ${message.metadata?.giftName || 'Gift'}`;
        break;
      case 'system':
        preview = message.content;
        break;
      default:
        preview = 'Message';
    }

    if (preview.length > maxLength) {
      return preview.substring(0, maxLength) + '...';
    }

    return preview;
  }

  static truncateMessageContent(content: string, maxLength: number = 100): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }

  // Message permissions
  static canDeleteMessage(message: Message, currentUserId: string): boolean {
    return message.sender._id === currentUserId;
  }

  static canEditMessage(message: Message, currentUserId: string): boolean {
    return message.sender._id === currentUserId && message.type === 'text';
  }

  static isMessageFromCurrentUser(message: Message, currentUserId: string): boolean {
    return message.sender._id === currentUserId;
  }

  static isMessageRead(message: Message, userId: string): boolean {
    return message.readBy.some(read => read.user === userId);
  }

  // Conversation helpers
  static getConversationName(conversation: Conversation, currentUserId: string): string {
    if (conversation.name) {
      return conversation.name;
    }

    if (conversation.type === 'direct') {
      const otherUser = conversation.participants.find(p => p._id !== currentUserId);
      return otherUser?.displayName || otherUser?.username || 'Unknown User';
    }

    if (conversation.type === 'group') {
      return 'Group Chat';
    }

    return 'Conversation';
  }

  static getConversationAvatar(conversation: Conversation, currentUserId: string): string {
    if (conversation.avatar) {
      return conversation.avatar;
    }

    if (conversation.type === 'direct') {
      const otherUser = conversation.participants.find(p => p._id !== currentUserId);
      return otherUser?.avatar || '/default-avatar.png';
    }

    return '/default-group-avatar.png';
  }

  static getOtherParticipants(conversation: Conversation, currentUserId: string): User[] {
    return conversation.participants.filter(p => p._id !== currentUserId);
  }

  static isDirectConversation(conversation: Conversation): boolean {
    return conversation.type === 'direct';
  }

  static isGroupConversation(conversation: Conversation): boolean {
    return conversation.type === 'group';
  }

  // Message search and filtering
  static filterMessages(messages: Message[], filters: {
    search?: string;
    type?: Message['type'];
    sender?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Message[] {
    return messages.filter(message => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          message.content.toLowerCase().includes(searchLower) ||
          message.sender.username.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filters.type && message.type !== filters.type) {
        return false;
      }

      // Sender filter
      if (filters.sender && message.sender._id !== filters.sender) {
        return false;
      }

      // Date filters
      const messageDate = new Date(message.createdAt);
      
      if (filters.dateFrom && messageDate < filters.dateFrom) {
        return false;
      }

      if (filters.dateTo && messageDate > filters.dateTo) {
        return false;
      }

      return true;
    });
  }

  static sortMessages(messages: Message[], order: 'asc' | 'desc' = 'asc'): Message[] {
    return [...messages].sort((a, b) => {
      const comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return order === 'desc' ? -comparison : comparison;
    });
  }

  // File type detection
  static isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  static isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
  }

  static isAudioFile(file: File): boolean {
    return file.type.startsWith('audio/');
  }

  static getFileIcon(file: File): string {
    if (this.isImageFile(file)) return '🖼️';
    if (this.isVideoFile(file)) return '🎥';
    if (this.isAudioFile(file)) return '🎵';
    if (file.type === 'application/pdf') return '📄';
    if (file.type.includes('word')) return '📝';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊';
    return '📎';
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// src/utils/validation.utils.ts
export class ValidationUtils {
  // General validation helpers
  static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(username) && 
           username.length >= VALIDATION.USERNAME_MIN_LENGTH && 
           username.length <= VALIDATION.USERNAME_MAX_LENGTH;
  }

  static isStrongPassword(password: string): boolean {
    const hasMinLength = password.length >= VALIDATION.PASSWORD_MIN_LENGTH;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasMinLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Content validation
  static containsProfanity(text: string): boolean {
    // Basic profanity filter - you should implement a more sophisticated one
    const profanityWords = ['spam', 'scam']; // Add more words as needed
    const lowerText = text.toLowerCase();
    return profanityWords.some(word => lowerText.includes(word));
  }

  static isValidMessageContent(content: string): { isValid: boolean; reason?: string } {
    if (!content.trim()) {
      return { isValid: false, reason: 'Message cannot be empty' };
    }

    if (content.length > VALIDATION.MESSAGE_MAX_LENGTH) {
      return { isValid: false, reason: 'Message too long' };
    }

    if (this.containsProfanity(content)) {
      return { isValid: false, reason: 'Message contains inappropriate content' };
    }

    return { isValid: true };
  }

  // File validation
  static isValidImageFile(file: File): { isValid: boolean; reason?: string } {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!validTypes.includes(file.type)) {
      return { isValid: false, reason: 'Invalid image format' };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { isValid: false, reason: 'Image file too large (max 5MB)' };
    }

    return { isValid: true };
  }

  static isValidVideoFile(file: File): { isValid: boolean; reason?: string } {
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    
    if (!validTypes.includes(file.type)) {
      return { isValid: false, reason: 'Invalid video format' };
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return { isValid: false, reason: 'Video file too large (max 50MB)' };
    }

    return { isValid: true };
  }

  static isValidAudioFile(file: File): { isValid: boolean; reason?: string } {
    const validTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
    
    if (!validTypes.includes(file.type)) {
      return { isValid: false, reason: 'Invalid audio format' };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { isValid: false, reason: 'Audio file too large (max 10MB)' };
    }

    return { isValid: true };
  }
}