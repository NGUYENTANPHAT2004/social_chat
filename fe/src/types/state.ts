export interface RoomState {
  // Room lists
  rooms: Room[];
  trendingRooms: Room[];
  myRooms: Room[];
  
  // Current room details
  currentRoom: Room | null;
  roomMembers: RoomMember[];
  
  // UI state
  loading: boolean;
  error: string | null;
  
  // Pagination
  pagination: {
    rooms: PaginationState;
    trending: PaginationState;
    members: PaginationState;
  };
  
  // Filters
  filters: RoomFilters;
  
  // Streaming state
  streaming: StreamingInfo;
}

export interface MessageState {
  // Conversations
  conversations: Conversation[];
  currentConversation: Conversation | null;
  
  // Messages
  messages: { [conversationId: string]: Message[] };
  
  // UI state
  loading: boolean;
  sending: boolean;
  error: string | null;
  
  // Unread counts
  totalUnreadCount: number;
  
  // Pagination
  pagination: {
    conversations: PaginationState;
    messages: { [conversationId: string]: MessagePaginationState };
  };
  
  // Typing indicators
  typingUsers: { [conversationId: string]: string[] };
  
  // Search
  searchResults: Message[];
  searchLoading: boolean;
  searchQuery: string;
  
  // Filters
  filters: ConversationFilters;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface MessagePaginationState extends PaginationState {
  oldestMessageId?: string;
}