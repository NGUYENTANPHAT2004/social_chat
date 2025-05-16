// src/constants/index.ts

// API Endpoints
export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    
    // User
    USER_PROFILE: '/users/profile',
    USER_BY_ID: (id: string) => `/users/${id}`,
    USER_TRANSACTIONS: '/users/transactions',
    
    // Chat
    CHAT_ROOMS: '/chat/rooms',
    CHAT_MESSAGES: (roomId: string) => `/chat/messages/${roomId}`,
    
    // Room
    ROOMS: '/rooms',
    ROOM_BY_ID: (id: string) => `/rooms/${id}`,
    LIVE_ROOMS: '/rooms/live',
    MY_ROOMS: '/rooms/host/me',
    
    // Game
    GAMES: '/games',
    GAME_BY_ID: (id: string) => `/games/${id}`,
    PLACE_BET: (gameId: string) => `/games/${gameId}/bet`,
    
    // Payment
    CREATE_PAYMENT: '/payments',
    PAYMENT_STATUS: (id: string) => `/payments/${id}`,
    
    // Gifts
    GIFTS: '/gifts',
    SEND_GIFT: '/gifts/send',
  };
  
  // Socket Events
  export const SOCKET_EVENTS = {
    // Common
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ERROR: 'error',
    
    // Chat
    JOIN_ROOM: 'joinRoom',
    LEAVE_ROOM: 'leaveRoom',
    SEND_MESSAGE: 'sendMessage',
    NEW_MESSAGE: 'newMessage',
    USER_TYPING: 'userTyping',
    USER_STOP_TYPING: 'userStopTyping',
    
    // Room
    ROOM_JOINED: 'roomJoined',
    ROOM_LEFT: 'roomLeft',
    VIEWER_JOINED: 'viewerJoined',
    VIEWER_LEFT: 'viewerLeft',
    STREAM_STARTED: 'streamStarted',
    STREAM_ENDED: 'streamEnded',
    
    // Gift
    SEND_GIFT: 'sendGift',
    GIFT_RECEIVED: 'giftReceived',
    
    // Game
    JOIN_GAME: 'joinGame',
    LEAVE_GAME: 'leaveGame',
    PLACE_BET: 'placeBet',
    GAME_STARTED: 'gameStarted',
    GAME_RESULT: 'gameResult',
    GAME_ENDED: 'gameEnded',
  };
  
  // Local Storage Keys
  export const STORAGE_KEYS = {
    TOKEN: 'token',
    REFRESH_TOKEN: 'refreshToken',
    USER: 'user',
    THEME: 'theme',
    LANGUAGE: 'language',
  };
  
  // App Routes
  export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    CHAT: '/chat',
    CHAT_ROOM: (id: string) => `/chat/${id}`,
    ROOMS: '/rooms',
    ROOM_DETAIL: (id: string) => `/rooms/${id}`,
    CREATE_ROOM: '/rooms/create',
    GAMES: '/games',
    GAME_DETAIL: (id: string) => `/games/${id}`,
    PAYMENT: '/payment',
  };
  
  // Validation Rules
  export const VALIDATION = {
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 30,
    PASSWORD_MIN_LENGTH: 6,
    MAX_ROOM_TITLE_LENGTH: 100,
    MAX_MESSAGE_LENGTH: 1000,
    MIN_KC_DEPOSIT: 10,
    MAX_KC_DEPOSIT: 10000,
  };
  
  // Limits and Settings
  export const LIMITS = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_UPLOAD_SIZE_MB: 10,
    MAX_ROOMS_PER_USER: 5,
    KC_TO_CURRENCY_RATIO: 100, // 1 KC = 100 VND
  };