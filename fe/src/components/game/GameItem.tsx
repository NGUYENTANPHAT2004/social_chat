// src/components/game/GameItem.tsx
import React from 'react';
import { Users } from 'lucide-react';
import type  { GameItem } from '@/types';

interface GameItemProps {
  game: GameItem;
}

const GameItem: React.FC<GameItemProps> = ({ game }) => (
  <div className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer group">
    <div className="flex items-center">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${game.color} flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-lg transition-all`}>
        {game.icon}
      </div>
      <div className="ml-3">
        <p className="font-medium group-hover:text-indigo-600 transition-colors">{game.name}</p>
        <div className="flex items-center text-xs text-gray-500">
          <Users size={12} className="mr-1" />
          <span>{game.players} playing now</span>
        </div>
      </div>
    </div>
  </div>
);

export default GameItem;