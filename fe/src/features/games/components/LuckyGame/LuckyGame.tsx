'use client';
import React, { useState, useEffect } from 'react';
import { Dices, TrendingUp, Users, Clock } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { apiService } from '@/services/api';
import { socketService } from '@/services/socket';

interface LuckyGameProps {
  gameId: string;
  onClose: () => void;
}

interface BetOption {
  type: 'high' | 'low' | 'odd' | 'even';
  label: string;
  multiplier: number;
  color: string;
}

const betOptions: BetOption[] = [
  { type: 'high', label: 'High (50-99)', multiplier: 1.95, color: 'bg-green-500' },
  { type: 'low', label: 'Low (1-49)', multiplier: 1.95, color: 'bg-red-500' },
  { type: 'odd', label: 'Odd', multiplier: 1.95, color: 'bg-blue-500' },
  { type: 'even', label: 'Even', multiplier: 1.95, color: 'bg-purple-500' },
];

const LuckyGame: React.FC<LuckyGameProps> = ({ gameId, onClose }) => {
  const { user } = useAuth();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [selectedBet, setSelectedBet] = useState<BetOption | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);

  useEffect(() => {
    socketService.joinGame(gameId);
    loadGameHistory();

    socketService.onGameResult((gameResult) => {
      setResult(gameResult.result);
      setWinAmount(gameResult.winAmount || 0);
      setIsPlaying(false);
      setShowResult(true);
      
      setTimeout(() => setShowResult(false), 3000);
      loadGameHistory();
    });

    return () => {
      socketService.off('gameResult');
    };
  }, [gameId]);

  const loadGameHistory = async () => {
    try {
      const response = await apiService.get(`/games/${gameId}/history`);
      setGameHistory(response.data.slice(0, 10));
    } catch (error) {
      console.error('Failed to load game history:', error);
    }
  };

  const handleBet = async () => {
    if (!selectedBet || !user || betAmount < 10) return;

    setIsPlaying(true);
    try {
      await apiService.post(`/games/${gameId}/bet`, {
        betType: selectedBet.type,
        amount: betAmount,
      });
    } catch (error) {
      console.error('Bet failed:', error);
      setIsPlaying(false);
    }
  };

  const checkWin = (result: number, betType: string): boolean => {
    switch (betType) {
      case 'high': return result >= 50;
      case 'low': return result < 50;
      case 'odd': return result % 2 === 1;
      case 'even': return result % 2 === 0;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <Dices className="w-8 h-8 text-yellow-400" />
          <div>
            <h1 className="text-xl font-bold">Lucky Number</h1>
            <p className="text-sm text-gray-300">Guess the lucky number!</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
        >
          ×
        </button>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Result Display */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 text-center">
              <div className={`mx-auto w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold ${
                isPlaying ? 'bg-yellow-500 animate-pulse' : 'bg-gradient-to-r from-purple-500 to-pink-500'
              } mb-4`}>
                {isPlaying ? '?' : result || '?'}
              </div>
              
              {showResult && result !== null && selectedBet && (
                <div className={`text-2xl font-bold ${
                  checkWin(result, selectedBet.type) ? 'text-green-400' : 'text-red-400'
                }`}>
                  {checkWin(result, selectedBet.type) 
                    ? `You Won ${winAmount} KC!` 
                    : 'Better luck next time!'
                  }
                </div>
              )}
            </div>

            {/* Bet Options */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Choose Your Bet</h3>
              <div className="grid grid-cols-2 gap-3">
                {betOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => setSelectedBet(option)}
                    disabled={isPlaying}
                    className={`p-4 rounded-xl transition-all ${
                      selectedBet?.type === option.type
                        ? `${option.color} shadow-lg`
                        : 'bg-white/10 hover:bg-white/20'
                    } ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-gray-300">{option.multiplier}x</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bet Amount & Action */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Bet Amount (KC)</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      min="10"
                      max={user?.balance || 0}
                      value={betAmount}
                      onChange={(e) => setBetAmount(Number(e.target.value))}
                      disabled={isPlaying}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                    />
                    <div className="flex space-x-1">
                      {[10, 50, 100, 500].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setBetAmount(amount)}
                          disabled={isPlaying}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBet}
                  disabled={!selectedBet || isPlaying || betAmount < 10}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-3 font-semibold text-lg transition-all"
                >
                  {isPlaying ? 'Playing...' : `Bet ${betAmount} KC`}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src={user?.avatar || '/default-avatar.png'} 
                  alt={user?.username}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="font-semibold">{user?.username}</h3>
                  <p className="text-sm text-gray-300">Balance: {user?.balance} KC</p>
                </div>
              </div>
            </div>

            {/* Game Stats */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Game Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Players Online</span>
                  <span className="font-semibold">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Games Today</span>
                  <span className="font-semibold">56,789</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Winnings</span>
                  <span className="font-semibold">2.3M KC</span>
                </div>
              </div>
            </div>

            {/* Recent Results */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Results</h3>
              <div className="space-y-2">
                {gameHistory.map((game, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      game.result >= 50 ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {game.result}
                    </span>
                    <span className="text-gray-300">
                      {new Date(game.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuckyGame;