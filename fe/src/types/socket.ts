export interface SocketEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  error: (error: any) => void;
  
  // Authentication events
  authenticate: (data: { token: string; userId: string }) => void;
  authenticated: () => void;
  authentication_error: (error: string) => void;
  
  // Room events
  join_room: (data: { roomId: string }) => void;
  leave_room: (data: { roomId: string }) => void;
  room_joined: (data: { roomId: string; user: UserBasic }) => void;
  room_left: (data: { roomId: string; userId: string }) => void;
  room_user_joined: (data: { roomId: string; user: UserBasic }) => void;
  room_user_left: (data: { roomId: string; userId: string }) => void;
  room_updated: (data: { roomId: string; room: Room }) => void;
  viewer_count_updated: (data: { roomId: string; viewers: number }) => void;
  
  // Message events
  send_message: (data: SendMessageDto) => void;
  new_message: (message: Message) => void;
  message_deleted: (data: { messageId: string; conversationId: string }) => void;
  message_updated: (message: Message) => void;
  
  // Typing events
  user_typing: (data: { conversationId: string; userId: string; username: string }) => void;
  user_stop_typing: (data: { conversationId: string; userId: string }) => void;
  typing_users: (data: { conversationId: string; users: UserBasic[] }) => void;
  
  // Streaming events
  stream_started: (data: { roomId: string; streamUrl: string }) => void;
  stream_ended: (data: { roomId: string }) => void;
  
  // Gift events
  send_gift: (data: { roomId: string; recipientId: string; giftId: string }) => void;
  gift_received: (data: {
    giftId: string;
    sender: UserBasic;
    recipient: UserBasic;
    roomId: string;
    value: number;
  }) => void;
  
  // Notification events
  new_notification: (notification: any) => void;
  notification_read: (data: { notificationId: string }) => void;
}