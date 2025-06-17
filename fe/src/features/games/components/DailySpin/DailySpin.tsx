'use client';
import React, { useState, useEffect } from 'react';
import { RotateCcw, Gift, Star } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { apiService } from '@/services/api';

interface DailySpinProps {
  gameId: string;
  onClose: () => void;
}

interface SpinReward {
  id: number;
  label: string;
  value: number;
  color: string;
  icon: string;
}

const spinRewards: SpinReward[] = [
  { id: 1, label: '10 KC', value: 10, color: 'bg-gray-500', icon: '💰' },
  { id: 2, label: '50 KC', value: 50, color: 'bg-blue-500', icon: '💎' },
  { id: 3, label: '100 KC', value: 100, color: 'bg-green-500', icon: '🎁' },
  { id: 4, label: '500 KC', value: 500, color: 'bg-purple-500', icon: '👑' },
  { id: 5, label: '1000 KC', value: 1000, color: 'bg-yellow-500', icon: '⭐' },
  { id: 6, label: 'Try Again', value: 0, color: 'bg-red-500', icon: '🔄' },
  { id: 7, label: '25 KC', value: 25, color: 'bg-indigo-500', icon: '💫' },
  { id: 8, label: 'Bonus', value: 200, color: 'bg-pink-500', icon: '🎉' },
];

const DailySpin: React.FC<DailySpinProps> = ({ gameId, onClose }) => {
  const { user } = useAuth();
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [canSpin, setCanSpin] = useState<boolean>(true);
  const [lastSpinTime, setLastSpinTime] = useState<Date | null>(null);
  const [selectedReward, setSelectedReward] = useState<SpinReward | null>(null);
  const [spinAngle, setSpinAngle] = useState<number>(0);

  useEffect(() => {
    checkSpinStatus();
  }, []);

  const checkSpinStatus = async () => {
    try {
      const response = await apiService.get(`/games/daily-spin/status`);
      const { canSpin, lastSpinTime } = response.data;
      setCanSpin(canSpin);
      setLastSpinTime(lastSpinTime ? new Date(lastSpinTime) : null);
    } catch (error) {
      console.error('Failed to check spin status:', error);
    }
  };

  const handleSpin = async () => {
    if (!canSpin || isSpinning) return;

    setIsSpinning(true);
    
    try {
      const response = await apiService.post('/games/daily-spin/play');
      const { reward, newBalance } = response.data;
      
      // Calculate spin angle based on reward
      const rewardIndex = spinRewards.findIndex(r => r.value === reward.value);
      const segmentAngle = 360 / spinRewards.length;
      const targetAngle = (rewardIndex * segmentAngle) + (segmentAngle / 2);
      const finalAngle = 360 * 5 + targetAngle; // 5 full rotations + target
      
      setSpinAngle(finalAngle);
      
      setTimeout(() => {
        setSelectedReward(reward);
        setIsSpinning(false);
        setCanSpin(false);
        setLastSpinTime(new Date());
      }, 3000);
      
    } catch (error) {
      console.error('Spin failed:', error);
      setIsSpinning(false);
    }
  };

  const getTimeUntilNextSpin = (): string => {
    if (!lastSpinTime) return '';
    
    const nextSpinTime = new Date(lastSpinTime);
    nextSpinTime.setHours(nextSpinTime.getHours() + 24);
    
    const now = new Date();
    const diff = nextSpinTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      setCanSpin(true);
      return '';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <Star className="w-8 h-8 text-yellow-400" />
          <div>
            <h1 className="text-xl font-bold">Daily Spin</h1>
            <p className="text-sm text-gray-300">Spin once every 24 hours!</p>
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
          {/* Spin Wheel */}
          <div className="relative mx-auto w-96 h-96">
            <div 
              className={`w-full h-full rounded-full border-8 border-yellow-400 shadow-2xl transition-transform duration-3000 ease-out`}
              style={{ transform: `rotate(${spinAngle}deg)` }}
            >
              {spinRewards.map((reward, index) => {
                const angle = (index * 360) / spinRewards.length;
                return (
                  <div
                    key={reward.id}
                    className={`absolute w-full h-full ${reward.color} clip-path-segment`}
                    style={{ 
                      transform: `rotate(${angle}deg)`,
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((360/spinRewards.length) * Math.PI/180)}% ${50 - 50 * Math.sin((360/spinRewards.length) * Math.PI/180)}%)`
                    }}
                  >
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center">
                      <div className="text-2xl">{reward.icon}</div>
                      <div className="text-xs font-bold">{reward.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Center Hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <RotateCcw className="w-8 h-8 text-yellow-900" />
            </div>
            
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-6 h-8 bg-yellow-400 clip-path-triangle"></div>
          </div>

          {/* Result Display */}
          {selectedReward && (
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
              <div className="text-4xl mb-4">{selectedReward.icon}</div>
              <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
              <p className="text-xl">You won {selectedReward.label}!</p>
            </div>
          )}

          {/* Spin Button */}
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
            {canSpin ? (
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-4 font-semibold text-xl transition-all"
              >
                {isSpinning ? 'Spinning...' : 'SPIN NOW!'}
              </button>
            ) : (
              <div className="text-center">
                <p className="text-lg mb-2">Come back tomorrow!</p>
                <p className="text-sm text-gray-300">
                  Next spin in: {getTimeUntilNextSpin()}
                </p>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 max-w-sm mx-auto">
            <div className="text-sm text-gray-300">Your Balance</div>
            <div className="text-2xl font-bold">{user?.balance} KC</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySpin;