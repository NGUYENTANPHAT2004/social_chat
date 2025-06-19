// src/constants/index.ts

// Re-export API constants
export * from './api';
export * from './auth';

// Legacy API Endpoints (for backward compatibility)
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh-token',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  
  // User
  USER_PROFILE: '/users/profile',
  USER_BY_ID: (id: string) => `/users/${id}`,
  USER_TRANSACTIONS: '/users/transactions',
  UPDATE_PROFILE: '/users/profile',
  UPDATE_AVATAR: '/users/profile/avatar',
  UPDATE_SETTINGS: '/users/profile/settings',
  
  // Rooms (updated)
  ROOMS: '/rooms',
  ROOM_BY_ID: (id: string) => `/rooms/${id}`,
  TRENDING_ROOMS: '/rooms/trending',
  CREATE_ROOM: '/rooms',
  UPDATE_ROOM: (id: string) => `/rooms/${id}`,
  DELETE_ROOM: (id: string) => `/rooms/${id}`,
  JOIN_ROOM: (id: string) => `/rooms/${id}/join`,
  LEAVE_ROOM: (id: string) => `/rooms/${id}/leave`,
  FOLLOW_ROOM: (id: string) => `/rooms/${id}/follow`,
  UNFOLLOW_ROOM: (id: string) => `/rooms/${id}/unfollow`,
  ROOM_MEMBERS: (id: string) => `/rooms/${id}/members`,
  START_STREAM: (id: string) => `/rooms/${id}/start-stream`,
  END_STREAM: (id: string) => `/rooms/${id}/end-stream`,
  
  // Messages (updated)
  MESSAGES: '/messages',
  CONVERSATIONS: '/messages/conversations',
  CONVERSATION_BY_ID: (id: string) => `/messages/conversations/${id}`,
  DELETE_CONVERSATION: (id: string) => `/messages/conversations/${id}`,
  MARK_READ: (id: string) => `/messages/conversations/${id}/read`,
  UNREAD_COUNT: '/messages/unread-count',
  MESSAGES_WITH_USER: (userId: string) => `/messages/with/${userId}`,
  DELETE_MESSAGE: (messageId: string) => `/messages/${messageId}`,
  
  // Chat (legacy - redirected to messages)
  CHAT_ROOMS: '/messages/conversations',
  CHAT_MESSAGES: (roomId: string) => `/messages/conversations/${roomId}`,
  
  // Legacy room endpoints
  LIVE_ROOMS: '/rooms/trending',
  MY_ROOMS: '/rooms/host/me',
  
  // Games
  GAMES: '/games',
  GAME_BY_ID: (id: string) => `/games/${id}`,
  PLACE_BET: (gameId: string) => `/games/${gameId}/bet`,
  
  // Payment
  CREATE_PAYMENT: '/payments',
  PAYMENT_STATUS: (id: string) => `/payments/${id}`,
  TRANSACTIONS: '/transactions',
  
  // Gifts
  GIFTS: '/gifts',
  SEND_GIFT: '/gifts/send',
};

// Socket Events (comprehensive list)
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Authentication
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  AUTHENTICATION_ERROR: 'authentication_error',
  
  // Room events
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_JOINED: 'room_joined',
  ROOM_LEFT: 'room_left',
  ROOM_USER_JOINED: 'room_user_joined',
  ROOM_USER_LEFT: 'room_user_left',
  ROOM_UPDATED: 'room_updated',
  VIEWER_COUNT_UPDATED: 'viewer_count_updated',
  
  // Chat/Message events
  SEND_MESSAGE: 'send_message',
  NEW_MESSAGE: 'new_message',
  MESSAGE_DELETED: 'message_deleted',
  MESSAGE_UPDATED: 'message_updated',
  
  // Typing indicators
  USER_TYPING: 'user_typing',
  USER_STOP_TYPING: 'user_stop_typing',
  TYPING_USERS: 'typing_users',
  
  // Streaming events
  STREAM_STARTED: 'stream_started',
  STREAM_ENDED: 'stream_ended',
  
  // Gift events
  SEND_GIFT: 'send_gift',
  GIFT_RECEIVED: 'gift_received',
  
  // Game events
  JOIN_GAME: 'join_game',
  LEAVE_GAME: 'leave_game',
  PLACE_BET: 'place_bet',
  GAME_STARTED: 'game_started',
  GAME_RESULT: 'game_result',
  GAME_ENDED: 'game_ended',
  
  // Notification events
  NEW_NOTIFICATION: 'new_notification',
  NOTIFICATION_READ: 'notification_read',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  REMEMBER_ME: 'remember_me',
  OAUTH_REDIRECT: 'oauth_redirect',
  ROOM_SETTINGS: 'room_settings',
  CHAT_SETTINGS: 'chat_settings',
};

// App Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  
  // Chat routes
  CHAT: '/chat',
  CHAT_CONVERSATION: (id: string) => `/chat/${id}`,
  
  // Room routes
  ROOMS: '/rooms',
  ROOM_DETAIL: (id: string) => `/rooms/${id}`,
  CREATE_ROOM: '/rooms/create',
  TRENDING_ROOMS: '/rooms/trending',
  MY_ROOMS: '/rooms/my',
  
  // Game routes
  GAMES: '/games',
  GAME_DETAIL: (id: string) => `/games/${id}`,
  
  // Other routes
  PAYMENT: '/payment',
  TRANSACTIONS: '/transactions',
  NOTIFICATIONS: '/notifications',
};

// Validation Rules
export const VALIDATION = {
  // User validation
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  PASSWORD_MIN_LENGTH: 6,
  
  // Room validation
  ROOM_NAME_MIN_LENGTH: 3,
  ROOM_NAME_MAX_LENGTH: 100,
  ROOM_DESCRIPTION_MAX_LENGTH: 500,
  MAX_ROOM_TAGS: 10,
  ROOM_PASSWORD_MIN_LENGTH: 4,
  ROOM_PASSWORD_MAX_LENGTH: 20,
  
  // Message validation
  MESSAGE_MIN_LENGTH: 1,
  MESSAGE_MAX_LENGTH: 1000,
  MAX_ATTACHMENTS: 5,
  MAX_FILE_SIZE_MB: 10,
  
  // General limits
  MIN_KC_DEPOSIT: 10,
  MAX_KC_DEPOSIT: 10000,
  MAX_ROOMS_PER_USER: 5,
  MAX_CONCURRENT_STREAMS: 1,
};

// Limits and Settings
export const LIMITS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  CONVERSATIONS_PAGE_SIZE: 20,
  MESSAGES_PAGE_SIZE: 50,
  ROOMS_PAGE_SIZE: 20,
  MEMBERS_PAGE_SIZE: 20,
  
  // File uploads
  MAX_UPLOAD_SIZE_MB: 10,
  MAX_AVATAR_SIZE_MB: 5,
  MAX_ROOM_COVER_SIZE_MB: 10,
  
  // Streaming
  MAX_STREAM_DURATION_HOURS: 12,
  MAX_VIEWERS_PER_ROOM: 1000,
  
  // Chat
  TYPING_INDICATOR_TIMEOUT: 3000, // 3 seconds
  MESSAGE_HISTORY_LIMIT: 100,
  MAX_CONVERSATION_NAME_LENGTH: 50,
  
  // Room settings
  MIN_SLOW_MODE_INTERVAL: 1, // 1 second
  MAX_SLOW_MODE_INTERVAL: 300, // 5 minutes
  MIN_KC_TO_JOIN: 0,
  MAX_KC_TO_JOIN: 10000,
  MIN_AGE_REQUIREMENT: 0,
  MAX_AGE_REQUIREMENT: 100,
  
  // Currency
  KC_TO_CURRENCY_RATIO: 100, // 1 KC = 100 VND
};

// Error Messages
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Network error, please try again',
  SERVER_ERROR: 'Server error, please try again later',
  TIMEOUT_ERROR: 'Request timeout, please try again',
  
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email/username or password',
  TOKEN_EXPIRED: 'Session expired, please login again',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  
  // Room errors
  ROOM_NOT_FOUND: 'Room not found',
  ROOM_ACCESS_DENIED: 'You do not have access to this room',
  ROOM_FULL: 'Room is full',
  ROOM_PASSWORD_REQUIRED: 'Password required to join this room',
  ROOM_INVALID_PASSWORD: 'Invalid room password',
  STREAM_ALREADY_ACTIVE: 'Stream is already active in this room',
  STREAM_NOT_ACTIVE: 'No active stream in this room',
  INSUFFICIENT_KC: 'Insufficient KC balance',
  
  // Message errors
  MESSAGE_TOO_LONG: 'Message is too long',
  MESSAGE_EMPTY: 'Message cannot be empty',
  CONVERSATION_NOT_FOUND: 'Conversation not found',
  FILE_TOO_LARGE: 'File size exceeds the limit',
  UNSUPPORTED_FILE_TYPE: 'Unsupported file type',
  
  // General errors
  VALIDATION_ERROR: 'Please check your input and try again',
  PERMISSION_DENIED: 'Permission denied',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  // Room messages
  ROOM_CREATED: 'Room created successfully!',
  ROOM_UPDATED: 'Room updated successfully!',
  ROOM_DELETED: 'Room deleted successfully!',
  ROOM_JOINED: 'Joined room successfully!',
  ROOM_LEFT: 'Left room successfully!',
  ROOM_FOLLOWED: 'Following room!',
  ROOM_UNFOLLOWED: 'Unfollowed room!',
  STREAM_STARTED: 'Stream started successfully!',
  STREAM_ENDED: 'Stream ended successfully!',
  
  // Message messages
  MESSAGE_SENT: 'Message sent successfully!',
  MESSAGE_DELETED: 'Message deleted successfully!',
  CONVERSATION_DELETED: 'Conversation deleted successfully!',
  CONVERSATION_ARCHIVED: 'Conversation archived!',
  CONVERSATION_UNARCHIVED: 'Conversation unarchived!',
  CONVERSATION_MUTED: 'Conversation muted!',
  CONVERSATION_UNMUTED: 'Conversation unmuted!',
  
  // File messages
  FILE_UPLOADED: 'File uploaded successfully!',
  
  // General messages
  SETTINGS_SAVED: 'Settings saved successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
};

// Theme Colors
export const THEME_COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  SUCCESS: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  ERROR: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  WARNING: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
};

// Room Types
export const ROOM_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  PASSWORD: 'password',
} as const;

export const ROOM_TYPE_LABELS = {
  [ROOM_TYPES.PUBLIC]: 'Công khai',
  [ROOM_TYPES.PRIVATE]: 'Riêng tư',
  [ROOM_TYPES.PASSWORD]: 'Có mật khẩu',
};

// Room Status
export const ROOM_STATUS = {
  LIVE: 'live',
  INACTIVE: 'inactive',
} as const;

export const ROOM_STATUS_LABELS = {
  [ROOM_STATUS.LIVE]: 'Đang live',
  [ROOM_STATUS.INACTIVE]: 'Không hoạt động',
};

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
  GIFT: 'gift',
  SYSTEM: 'system',
} as const;

export const MESSAGE_TYPE_LABELS = {
  [MESSAGE_TYPES.TEXT]: 'Văn bản',
  [MESSAGE_TYPES.IMAGE]: 'Hình ảnh',
  [MESSAGE_TYPES.VIDEO]: 'Video',
  [MESSAGE_TYPES.AUDIO]: 'Âm thanh',
  [MESSAGE_TYPES.FILE]: 'Tệp đính kèm',
  [MESSAGE_TYPES.GIFT]: 'Quà tặng',
  [MESSAGE_TYPES.SYSTEM]: 'Hệ thống',
};

// Conversation Types
export const CONVERSATION_TYPES = {
  DIRECT: 'direct',
  GROUP: 'group',
  ROOM: 'room',
} as const;

export const CONVERSATION_TYPE_LABELS = {
  [CONVERSATION_TYPES.DIRECT]: 'Tin nhắn riêng',
  [CONVERSATION_TYPES.GROUP]: 'Nhóm',
  [CONVERSATION_TYPES.ROOM]: 'Phòng',
};

// User Roles
export const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const;

export const USER_ROLE_LABELS = {
  [USER_ROLES.USER]: 'Người dùng',
  [USER_ROLES.MODERATOR]: 'Điều hành viên',
  [USER_ROLES.ADMIN]: 'Quản trị viên',
};

// Room Member Roles
export const ROOM_MEMBER_ROLES = {
  OWNER: 'owner',
  MODERATOR: 'moderator',
  MEMBER: 'member',
} as const;

export const ROOM_MEMBER_ROLE_LABELS = {
  [ROOM_MEMBER_ROLES.OWNER]: 'Chủ phòng',
  [ROOM_MEMBER_ROLES.MODERATOR]: 'Điều hành viên',
  [ROOM_MEMBER_ROLES.MEMBER]: 'Thành viên',
};

// File Types
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
export const SUPPORTED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/x-rar-compressed',
];

// Date/Time Formats
export const DATE_FORMATS = {
  SHORT: 'MM/dd/yyyy',
  LONG: 'MMMM d, yyyy',
  WITH_TIME: 'MM/dd/yyyy HH:mm',
  TIME_ONLY: 'HH:mm',
  RELATIVE: 'relative', // for relative time like "2 minutes ago"
};

// Default Settings
export const DEFAULT_SETTINGS = {
  ROOM: {
    allowChat: true,
    allowGifts: true,
    minKCToJoin: 0,
    slowMode: false,
    slowModeInterval: 5,
    followersOnly: false,
    minAgeRequired: 0,
  },
  
  USER: {
    notifications: true,
    privacy: 'public',
    language: 'vi',
    theme: 'light',
  },
  
  CHAT: {
    showTypingIndicators: true,
    showReadReceipts: true,
    autoDownloadImages: true,
    playMessageSounds: true,
  },
};