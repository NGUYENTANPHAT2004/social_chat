import { NotificationStatus, NotificationType } from "./enums";

export interface GiftTransaction {
  _id: string;
  gift: string;
  sender: string;
  recipient: string;
  quantity: number;
  totalPrice: number;
  message: string;
  room?: string;
  transaction?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender?: string;
  type: NotificationType;
  title: string;
  content: string;
  link: string;
  image: string;
  status: NotificationStatus;
  data: Record<string, unknown>;
  emailSent: boolean;
  pushSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}