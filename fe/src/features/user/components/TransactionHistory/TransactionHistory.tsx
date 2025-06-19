// fe/src/features/transaction/components/TransactionHistory/TransactionHistory.tsx
// NOTE: This component should be moved from user module to transaction module
'use client';
import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Calendar } from 'lucide-react';
import Button from '@/components/atoms/Button/Button';
import Badge from '@/components/atoms/Badge/Badge';
import { useUser } from '@/hooks/useUserProfile';
import { apiService } from '@/services/api';
import { TransactionType, TransactionStatus } from '@/types/enums';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  status: TransactionStatus;
  createdAt: string;
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
  const { currentUser } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | TransactionType>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadTransactions(true);
    }
  }, [isOpen, filter]);

  const loadTransactions = async (resetPage = true) => {
    setLoading(true);
    try {
      const currentPage = resetPage ? 1 : page;
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (filter !== 'all') {
        params.type = filter;
      }

      const response = await apiService.get<TransactionResponse>('/transactions', { params });
      const newTransactions = response.data.transactions || [];

      if (resetPage) {
        setTransactions(newTransactions);
        setPage(1);
      } else {
        setTransactions(prev => [...prev, ...newTransactions]);
      }

      setHasMore(newTransactions.length === 20);
      
      if (!resetPage) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadTransactions(false);
    }
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
      case TransactionType.REWARD:
        return <ArrowDownCircle className="w-5 h-5 text-green-500" />;
      case TransactionType.WITHDRAW:
      case TransactionType.PURCHASE:
        return <ArrowUpCircle className="w-5 h-5 text-red-500" />;
      case TransactionType.GIFT:
        return <ArrowUpCircle className="w-5 h-5 text-purple-500" />;
      case TransactionType.TRANSFER:
        return <ArrowDownCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <ArrowDownCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
      case TransactionType.REWARD:
      case TransactionType.REFUND:
        return 'text-green-600';
      case TransactionType.WITHDRAW:
      case TransactionType.PURCHASE:
      case TransactionType.GIFT:
        return 'text-red-600';
      case TransactionType.TRANSFER:
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAmountPrefix = (type: TransactionType): string => {
    switch (type) {
      case TransactionType.DEPOSIT:
      case TransactionType.REWARD:
      case TransactionType.REFUND:
        return '+';
      case TransactionType.WITHDRAW:
      case TransactionType.PURCHASE:
      case TransactionType.GIFT:
        return '-';
      default:
        return '';
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return <Badge variant="success" size="sm">Completed</Badge>;
      case TransactionStatus.PENDING:
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case TransactionStatus.FAILED:
        return <Badge variant="danger" size="sm">Failed</Badge>;
      case TransactionStatus.CANCELLED:
        return <Badge variant="default" size="sm">Cancelled</Badge>;
      case TransactionStatus.REFUNDED:
        return <Badge variant="info" size="sm">Refunded</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: TransactionType.DEPOSIT, label: 'Deposits' },
    { key: TransactionType.WITHDRAW, label: 'Withdrawals' },
    { key: TransactionType.GIFT, label: 'Gifts' },
    { key: TransactionType.REWARD, label: 'Rewards' },
    { key: TransactionType.PURCHASE, label: 'Purchases' },
  ];

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
            <p className="text-2xl font-bold">{currentUser?.kcBalance || 0} KC</p>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-2 overflow-x-auto">
            {filterOptions.map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
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
          {loading && transactions.length === 0 ? (
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
                {filter === 'all' 
                  ? 'Your transaction history will appear here.'
                  : `No ${filter.toLowerCase()} transactions found.`
                }
              </p>
            </div>
          ) : (
            <div>
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {transaction.description}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                        {getAmountPrefix(transaction.type)}{transaction.amount} KC
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        {transaction.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="p-4 text-center">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={loadMore}
                    loading={loading}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;