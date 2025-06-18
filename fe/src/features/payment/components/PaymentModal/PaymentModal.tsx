'use client';
import React, { useState } from 'react';
import { X, CreditCard, Smartphone, QrCode } from 'lucide-react';
import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import Badge from '@/components/atoms/Badge/Badge';
import { useAuth } from '@/features/auth/context/AuthContext';
import { apiService } from '@/services/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: 'card' | 'momo' | 'bank' | 'qr';
  fee: number;
  minAmount: number;
  maxAmount: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'details' | 'confirm'>('select');

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'momo',
      name: 'MoMo',
      icon: <Smartphone className="w-6 h-6" />,
      type: 'momo',
      fee: 0,
      minAmount: 10,
      maxAmount: 10000,
    },
    {
      id: 'banking',
      name: 'Internet Banking',
      icon: <CreditCard className="w-6 h-6" />,
      type: 'bank',
      fee: 0,
      minAmount: 50,
      maxAmount: 50000,
    },
    {
      id: 'qr',
      name: 'QR Code',
      icon: <QrCode className="w-6 h-6" />,
      type: 'qr',
      fee: 0,
      minAmount: 10,
      maxAmount: 5000,
    },
  ];

  const predefinedAmounts = [100, 500, 1000, 2000, 5000, 10000];

  const handleCreatePayment = async () => {
    if (!selectedMethod || !user) return;

    setLoading(true);
    try {
      const response = await apiService.post('/payments', {
        amount,
        method: selectedMethod.id,
        currency: 'VND',
      });

      const { transactionId, paymentUrl } = response.data;
      
      if (paymentUrl) {
        // Redirect to payment gateway
        window.open(paymentUrl, '_blank');
      }
      
      // Poll for payment status
      const pollPayment = async () => {
        try {
          const statusResponse = await apiService.get(`/payments/${transactionId}`);
          const { status } = statusResponse.data;
          
          if (status === 'completed') {
            onSuccess(amount);
            onClose();
          } else if (status === 'failed') {
            alert('Payment failed. Please try again.');
          } else {
            // Continue polling
            setTimeout(pollPayment, 2000);
          }
        } catch (error) {
          console.error('Failed to check payment status:', error);
        }
      };
      
      pollPayment();
    } catch (error) {
      console.error('Failed to create payment:', error);
      alert('Failed to create payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedMethod) return amount;
    return amount + selectedMethod.fee;
  };

  const calculateKC = () => {
    // 1 VND = 1 KC (you can adjust this ratio)
    return amount;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add KC to Wallet</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          {step === 'select' && (
            <div className="space-y-6">
              {/* Current Balance */}
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 text-white text-center">
                <h3 className="text-sm opacity-90">Current Balance</h3>
                <p className="text-2xl font-bold">{user?.balance} KC</p>
              </div>

              {/* Amount Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Amount
                </label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {predefinedAmounts.map((preAmount) => (
                    <button
                      key={preAmount}
                      onClick={() => setAmount(preAmount)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        amount === preAmount
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-medium">{preAmount} KC</div>
                      <div className="text-xs text-gray-500">{preAmount.toLocaleString()} VND</div>
                    </button>
                  ))}
                </div>
                
                <Input
                  type="number"
                  label="Custom Amount (VND)"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={10}
                  max={50000}
                />
                
                <p className="text-sm text-gray-500 mt-2">
                  You will receive: <span className="font-bold text-purple-600">{calculateKC()} KC</span>
                </p>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method)}
                      disabled={amount < method.minAmount || amount > method.maxAmount}
                      className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                        selectedMethod?.id === method.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-purple-600">{method.icon}</div>
                        <div className="text-left">
                          <h3 className="font-medium text-gray-900">{method.name}</h3>
                          <p className="text-sm text-gray-500">
                            {method.minAmount.toLocaleString()} - {method.maxAmount.toLocaleString()} VND
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {method.fee === 0 ? (
                          <Badge variant="success" size="sm">Free</Badge>
                        ) : (
                          <span className="text-sm text-gray-500">+{method.fee} VND</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setStep('confirm')}
                disabled={!selectedMethod || amount < (selectedMethod?.minAmount || 0)}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 'confirm' && selectedMethod && (
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-medium text-gray-900 mb-3">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">{amount.toLocaleString()} VND</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee:</span>
                    <span className="font-medium">{selectedMethod.fee.toLocaleString()} VND</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{selectedMethod.name}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{calculateTotal().toLocaleString()} VND</span>
                  </div>
                  <div className="flex justify-between text-purple-600 font-medium">
                    <span>You'll receive:</span>
                    <span>{calculateKC()} KC</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={() => setStep('select')}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onClick={handleCreatePayment}
                >
                  Pay Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;