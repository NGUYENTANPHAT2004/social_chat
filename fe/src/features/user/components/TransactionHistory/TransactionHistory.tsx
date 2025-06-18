'use client';
import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Calendar, Filter } from 'lucide-react';
import Button from '@/components/atoms/Button/Button';
import Badge from '@/components/atoms/Badge/Badge';
import { useAuth } from '@/features/auth/context/AuthContext';
import { apiService } from '@/services/api';

interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'GAME_WIN' | 'GAME_LOSE' | 'GIFT_SEND' | 'GIFT_RECEIVE';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  metadata?: any;
}

interface TransactionResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'DEPOSIT' | 'GAME' | 'GIFT'>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
  }, [isOpen, filter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await apiService.get<TransactionResponse>('/transactions', {
        params: {
          type: filter !== 'all' ? filter : undefined,
          page,
          limit: 20,
        },
      });
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownCircle className="w-5 h-5 text-green-500" />;
      case 'WITHDRAW':
        return <ArrowUpCircle className="w-5 h-5 text-red-500" />;
      case 'GAME_WIN':
        return <ArrowDownCircle className="w-5 h-5 text-green-500" />;
      case 'GAME_LOSE':
        return <ArrowUpCircle className="w-5 h-5 text-red-500" />;
      case 'GIFT_SEND':
        return <ArrowUpCircle className="w-5 h-5 text-purple-500" />;
      case 'GIFT_RECEIVE':
        return <ArrowDownCircle className="w-5 h-5 text-purple-500" />;
      default:
        return <ArrowDownCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'GAME_WIN':
      case 'GIFT_RECEIVE':
        return 'text-green-600';
      case 'WITHDRAW':
      case 'GAME_LOSE':
      case 'GIFT_SEND':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'failed':
        return <Badge variant="danger" size="sm">Failed</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
          
          {/* Balance */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 text-white text-center">
            <h3 className="text-sm opacity-90">Current Balance</h3>
            <p className="text-2xl font-bold">{user?.balance} KC</p>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-2 overflow-x-auto">
            {[
              { key: 'all', label: 'All' },
              { key: 'DEPOSIT', label: 'Deposits' },
              { key: 'GAME', label: 'Games' },
              { key: 'GIFT', label: 'Gifts' },
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  filter === filterOption.key
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
          {loading ? (
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border-b border-gray-100 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No transactions
              </h3>
              <p className="text-gray-500">
                Your transaction history will appear here.
              </p>
            </div>
          ) : (
            <div>
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {transaction.description}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type.includes('SEND') || transaction.type.includes('LOSE') || transaction.type === 'WITHDRAW' ? '-' : '+'}
                        {transaction.amount} KC
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;