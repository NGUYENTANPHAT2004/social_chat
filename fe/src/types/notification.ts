export interface Notification {
  _id: string;
  userId: string;
  type: 'message' | 'room' | 'gift' | 'system';
  title: string;
  content: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}