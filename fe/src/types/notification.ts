export interface notification {
  _id: string;
  userId: string;
  type: 'message' | 'room' | 'gift' | 'system';
  title: string;
  content: string;
  data?: unknown;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}