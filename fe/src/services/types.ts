// src/services/types.ts
import {
    User,
    Room,
    Message,
    Game,
    Gift,
    Transaction,
    ApiResponse,
    PaginatedResponse
  } from '@/types';
  
  // Auth API responses
  export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    user: User;
  }
  
  export interface RegisterResponse {
    access_token: string;
    refresh_token: string;
    user: User;
  }
  
  // User API responses
  export type GetUserProfileResponse = ApiResponse<User>;
  export type UpdateUserProfileResponse = ApiResponse<User>;
  export type GetUserTransactionsResponse = ApiResponse<PaginatedResponse<Transaction>>;
  
  // Chat API responses
  export type GetChatRoomsResponse = ApiResponse<PaginatedResponse<Room>>;
  export type GetMessagesResponse = ApiResponse<PaginatedResponse<Message>>;
  export type SendMessageResponse = ApiResponse<Message>;
  
  // Room API responses
  export type GetRoomsResponse = ApiResponse<PaginatedResponse<Room>>;
  export type GetRoomByIdResponse = ApiResponse<Room>;
  export type CreateRoomResponse = ApiResponse<Room>;
  export type UpdateRoomResponse = ApiResponse<Room>;
  export type DeleteRoomResponse = ApiResponse<{ success: boolean }>;
  
  // Game API responses
  export type GetGamesResponse = ApiResponse<PaginatedResponse<Game>>;
  export type GetGameByIdResponse = ApiResponse<Game>;
  export type PlaceBetResponse = ApiResponse<{
    sessionId: string;
    bet: number;
    result?: any;
    winAmount?: number;
    newBalance: number;
  }>;
  
  // Payment API responses
  export type CreatePaymentResponse = ApiResponse<{
    transactionId: string;
    paymentUrl?: string;
  }>;
  export type GetTransactionStatusResponse = ApiResponse<Transaction>;