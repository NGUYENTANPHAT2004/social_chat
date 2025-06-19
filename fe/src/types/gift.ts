export interface Gift {
  _id: string;
  name: string;
  image: string;
  value: number;
  category: string;
  isActive: boolean;
  animation?: string;
  sound?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GiftTransaction {
  _id: string;
  giftId: string;
  senderId: string;
  recipientId: string;
  roomId?: string;
  conversationId?: string;
  value: number;
  message?: string;
  createdAt: string;
}