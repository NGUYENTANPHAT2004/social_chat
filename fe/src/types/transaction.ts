import { CurrencyType, TransactionStatus, TransactionType } from "./enums";

export interface Transaction {
  _id: string;
  transactionCode: string;
  type: TransactionType;
  sender: string;
  recipient?: string;
  amount: number;
  currency: CurrencyType;
  exchangeRate: number;
  status: TransactionStatus;
  description: string;
  fee: number;
  senderBalanceBefore?: number;
  senderBalanceAfter?: number;
  recipientBalanceBefore?: number;
  recipientBalanceAfter?: number;
  payment?: string;
  relatedItemId?: string;
  relatedItemType?: string;
  metadata: Record<string, unknown>;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}