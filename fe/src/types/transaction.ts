export interface Transaction {
  _id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'gift' | 'game' | 'fee';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}