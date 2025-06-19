// src/constants/api.ts

// Base API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Auth API Endpoints
export const AUTH_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh-token',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  
  // OAuth
  GOOGLE_LOGIN: '/auth/google',
  GOOGLE_CALLBACK: '/auth/google/callback',
  FACEBOOK_LOGIN: '/auth/facebook',
  FACEBOOK_CALLBACK: '/auth/facebook/callback',
  
  // Password Reset
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification',
};

// Room API Endpoints
export const ROOM_ENDPOINTS = {
  // Basic room operations
  ROOMS: '/rooms',
  ROOM_BY_ID: (id: string) => `/rooms/${id}`,
  TRENDING_ROOMS: '/rooms/trending',
  
  // Room management
  CREATE_ROOM: '/rooms',
  UPDATE_ROOM: (id: string) => `/rooms/${id}`,
  DELETE_ROOM: (id: string) => `/rooms/${id}`,
  
  // Room interactions
  JOIN_ROOM: (id: string) => `/rooms/${id}/join`,
  LEAVE_ROOM: (id: string) => `/rooms/${id}/leave`,
  FOLLOW_ROOM: (id: string) => `/rooms/${id}/follow`,
  UNFOLLOW_ROOM: (id: string) => `/rooms/${id}/unfollow`,
  
  // Room members
  ROOM_MEMBERS: (id: string) => `/rooms/${id}/members`,
  
  // Streaming
  START_STREAM: (id: string) => `/rooms/${id}/start-stream`,
  END_STREAM: (id: string) => `/rooms/${id}/end-stream`,
};

// Message API Endpoints  
export const MESSAGE_ENDPOINTS = {
  // Basic message operations
  MESSAGES: '/messages',
  MESSAGE_BY_ID: (id: string) => `/messages/${id}`,
  
  // Conversations
  CONVERSATIONS: '/messages/conversations',
  CONVERSATION_BY_ID: (id: string) => `/messages/conversations/${id}`,
  DELETE_CONVERSATION: (id: string) => `/messages/conversations/${id}`,
  MARK_READ: (id: string) => `/messages/conversations/${id}/read`,
  
  // Message stats
  UNREAD_COUNT: '/messages/unread-count',
  
  // Direct messages
  MESSAGES_WITH_USER: (userId: string) => `/messages/with/${userId}`,
  
  // Message management
  DELETE_MESSAGE: (messageId: string) => `/messages/${messageId}`,
};

// User API Endpoints
export const USER_ENDPOINTS = {
  PROFILE: '/users/profile',
  USER_BY_ID: (id: string) => `/users/${id}`,
  USER_TRANSACTIONS: '/users/transactions',
  UPDATE_PROFILE: '/users/profile',
  UPDATE_AVATAR: '/users/profile/avatar',
  UPDATE_SETTINGS: '/users/profile/settings',
};

// Game API Endpoints (for future)
export const GAME_ENDPOINTS = {
  GAMES: '/games',
  GAME_BY_ID: (id: string) => `/games/${id}`,
  PLACE_BET: (gameId: string) => `/games/${gameId}/bet`,
};

// Payment API Endpoints
export const PAYMENT_ENDPOINTS = {
  CREATE_PAYMENT: '/payments',
  PAYMENT_STATUS: (id: string) => `/payments/${id}`,
  TRANSACTIONS: '/transactions',
};

// Gift API Endpoints
export const GIFT_ENDPOINTS = {
  GIFTS: '/gifts',
  SEND_GIFT: '/gifts/send',
};

// Combined API Endpoints for backward compatibility
export const API_ENDPOINTS = {
  ...AUTH_ENDPOINTS,
  ...USER_ENDPOINTS,
  ...PAYMENT_ENDPOINTS,
  ...GIFT_ENDPOINTS,
  
  // Legacy room endpoints (keeping for compatibility)
  CHAT_ROOMS: '/messages/conversations',
  CHAT_MESSAGES: (roomId: string) => `/messages/conversations/${roomId}`,
  ROOMS: '/rooms',
  ROOM_BY_ID: (id: string) => `/rooms/${id}`,
  LIVE_ROOMS: '/rooms/trending',
  MY_ROOMS: '/rooms/host/me',
  GAMES: '/games',
  GAME_BY_ID: (id: string) => `/games/${id}`,
  PLACE_BET: (gameId: string) => `/games/${gameId}/bet`,
  CREATE_PAYMENT: '/payments',
  PAYMENT_STATUS: (id: string) => `/payments/${id}`,
  GIFTS: '/gifts',
  SEND_GIFT: '/gifts/send',
};

// Socket Events
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
  VIEWER_COUNT_UPDATED: 'viewer_count_updated',
  
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

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

// Request timeout configurations
export const REQUEST_CONFIG = {
  DEFAULT_TIMEOUT: 10000, // 10 seconds
  UPLOAD_TIMEOUT: 30000,  // 30 seconds for file uploads
  STREAMING_TIMEOUT: 5000, // 5 seconds for streaming operations
};