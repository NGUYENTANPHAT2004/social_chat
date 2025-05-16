// src/components/game/GamesColumn.tsx
import React, { useState } from 'react';
import GameItem from './GameItem';
import TabButton from '../ui/TabButton';
import { games } from '@/data/mockData';

const GamesColumn: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-3">Games</h2>
        <div className="flex space-x-2">
          <TabButton 
            text="All Games" 
            isActive={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          />
          <TabButton 
            text="Favorites" 
            isActive={activeTab === 'favorites'}
            onClick={() => setActiveTab('favorites')}
          />
          <TabButton 
            text="New" 
            isActive={activeTab === 'new'}
            onClick={() => setActiveTab('new')}
          />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-grow">
        {games.map(game => (
          <GameItem key={game.id} game={game} />
        ))}
        
        <div className="p-4">
          <button className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all">
            Browse All Games
          </button>
        </div>
      </div>
    </div>
  );
};

export default GamesColumn;