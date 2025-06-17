import React from 'react';
import { Play, Users, TrendingUp } from 'lucide-react';
import Button from '@/components/atoms/Button/Button';
import Badge from '@/components/atoms/Badge/Badge';
import { Game } from '@/types';

interface GameCardProps {
  game: Game;
  onPlay: (gameId: string) => void;
  variant?: 'default' | 'compact';
}

const GameCard: React.FC<GameCardProps> = ({ game, onPlay, variant = 'default' }) => {
  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
           onClick={() => onPlay(game.id)}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
            {game.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{game.name}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{game.playCount} playing</span>
            </div>
          </div>
          <Badge variant="primary" size="sm">
            {game.multiplier}x
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Game Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 overflow-hidden">
        {game.image ? (
          <img 
            src={game.image} 
            alt={game.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl font-bold text-white opacity-50">
              {game.name.charAt(0)}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Play className="w-5 h-5" />}
            onClick={() => onPlay(game.id)}
          >
            Play Now
          </Button>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant={game.isActive ? 'success' : 'danger'} size="sm">
            {game.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      {/* Game Info */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{game.name}</h3>
            <p className="text-gray-600 text-sm line-clamp-2">{game.description}</p>
          </div>
          <Badge variant="primary" size="lg">
            {game.multiplier}x
          </Badge>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{game.playCount}</div>
            <div className="text-xs text-gray-500">Plays Today</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{game.minBet} KC</div>
            <div className="text-xs text-gray-500">Min Bet</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{game.winRate}%</div>
            <div className="text-xs text-gray-500">Win Rate</div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          leftIcon={<Play className="w-5 h-5" />}
          onClick={() => onPlay(game.id)}
        >
          Play {game.name}
        </Button>
      </div>
    </div>
  );
};

export default GameCard;