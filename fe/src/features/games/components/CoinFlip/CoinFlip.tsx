'use client';
import React, { useState, useEffect } from 'react';
import { Coins, RotateCcw } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { apiService } from '@/services/api';

interface CoinFlipProps {
  gameId: string;
  onClose: () => void;
}

const CoinFlip: React.FC<CoinFlipProps> = ({ gameId, onClose }) => {
  const { user } = useAuth();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [selectedSide, setSelectedSide] = useState<'heads' | 'tails' | null>(null);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [winAmount, setWinAmount] = useState<number>(0);

  const handleFlip = async () => {
    if (!selectedSide || !user) return;

    setIsFlipping(true);
    setShowResult(false);

    try {
      const response = await apiService.post(`/games/${gameId}/bet`, {
        betType: selectedSide,
        amount: betAmount,
      });

      // Simulate coin flip animation
      setTimeout(() => {
        setResult(response.data.result);
        setWinAmount(response.data.winAmount || 0);
        setIsFlipping(false);
        setShowResult(true);
      }, 2000);
    } catch (error) {
      console.error('Coin flip failed:', error);
      setIsFlipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-orange-900 to-red-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <Coins className="w-8 h-8 text-yellow-400" />
          <div>
            <h1 className="text-xl font-bold">Coin Flip</h1>
            <p className="text-sm text-gray-300">Heads or Tails?</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
        >
          ×
        </button>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center space-y-8">
          {/* Coin */}
          <div className="relative mx-auto w-48 h-48 perspective-1000">
            <div className={`absolute inset-0 rounded-full transition-transform duration-2000 preserve-3d ${
              isFlipping ? 'animate-spin' : ''
            }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-2xl flex items-center justify-center text-6xl font-bold backface-hidden">
                H
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full shadow-2xl flex items-center justify-center text-6xl font-bold backface-hidden rotate-y-180">
                T
              </div>
            </div>
          </div>

          {/* Result */}
          {showResult && result && (
            <div className={`text-3xl font-bold ${
              result === selectedSide ? 'text-green-400' : 'text-red-400'
            }`}>
              {result === selectedSide 
                ? `You Won ${winAmount} KC!` 
                : 'Better luck next time!'
              }
            </div>
          )}

          {/* Bet Selection */}
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold mb-6">Choose Your Side</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setSelectedSide('heads')}
                disabled={isFlipping}
                className={`p-6 rounded-xl transition-all ${
                  selectedSide === 'heads'
                    ? 'bg-yellow-500 shadow-lg'
                    : 'bg-white/10 hover:bg-white/20'
                } ${isFlipping ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-4xl mb-2">👑</div>
                <div className="font-semibold">HEADS</div>
                <div className="text-sm text-gray-300">2.0x</div>
              </button>
              
              <button
                onClick={() => setSelectedSide('tails')}
                disabled={isFlipping}
                className={`p-6 rounded-xl transition-all ${
                  selectedSide === 'tails'
                    ? 'bg-gray-500 shadow-lg'
                    : 'bg-white/10 hover:bg-white/20'
                } ${isFlipping ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-4xl mb-2">🦅</div>
                <div className="font-semibold">TAILS</div>
                <div className="text-sm text-gray-300">2.0x</div>
              </button>
            </div>

            {/* Bet Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Bet Amount (KC)</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="10"
                  max={user?.balance || 0}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  disabled={isFlipping}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-center text-xl"
                />
              </div>
              <div className="flex justify-center space-x-2 mt-2">
                {[10, 50, 100, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    disabled={isFlipping}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleFlip}
              disabled={!selectedSide || isFlipping || betAmount < 10}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-4 font-semibold text-xl transition-all"
            >
              {isFlipping ? 'Flipping...' : `Flip for ${betAmount} KC`}
            </button>
          </div>

          {/* User Balance */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 max-w-sm mx-auto">
            <div className="text-sm text-gray-300">Your Balance</div>
            <div className="text-2xl font-bold">{user?.balance} KC</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinFlip;