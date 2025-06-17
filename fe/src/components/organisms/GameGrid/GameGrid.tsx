'use client';
import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchGames } from '@/store/slices/gameSlice';
import LuckyGame from '@/features/games/components/LuckyGame/LuckyGame';
import CoinFlip from '@/features/games/components/CoinFlip/CoinFlip';
import DailySpin from '@/features/games/components/DailySpin/DailySpin';

const GameGrid: React.FC = () => {
  const dispatch = useAppDispatch();
  const { games, loading } = useAppSelector((state) => state.game);
  const [selectedGame, setSelectedGame] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchGames());
  }, [dispatch]);

  const renderGame = () => {
    if (!selectedGame) return null;

    switch (selectedGame.type) {
      case 'lucky':
        return <LuckyGame gameId={selectedGame.id} onClose={() => setSelectedGame(null)} />;
      case 'coinflip':
        return <CoinFlip gameId={selectedGame.id} onClose={() => setSelectedGame(null)} />;
      case 'daily_spin':
        return <DailySpin gameId={selectedGame.id} onClose={() => setSelectedGame(null)} />;
      default:
        return null;
    }
  };

  if (selectedGame) {
    return renderGame();
  }

  return (
    <div className="container-responsive py-6">
      <h2 className="text-2xl font-bold mb-6">Choose Your Game</h2>
      
      {loading ? (
        <div className="grid-responsive">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-48"></div>
          ))}
        </div>
      ) : (
        <div className="grid-responsive">
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => setSelectedGame(game)}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
            >
              <div className="h-32 bg-gradient-to-br from-purple-500 to-pink-500 relative overflow-hidden">
                <img 
                  src={game.image} 
                  alt={game.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute bottom-2 left-2 text-white">
                  <h3 className="font-bold">{game.name}</h3>
                  <p className="text-xs opacity-90">{game.playCount} plays today</p>
                </div>
              </div>
              
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">{game.description}</p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Min: {game.minBet} KC
                  </div>
                  <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {game.multiplier}x
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameGrid;