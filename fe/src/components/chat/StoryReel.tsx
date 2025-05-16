// src/components/chat/StoryReel.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import { ReelItem } from '@/types';

interface StoryReelProps {
  reels: ReelItem[];
}

const StoryReel: React.FC<StoryReelProps> = ({ reels }) => {
  return (
    <div className="flex space-x-4 pb-4 overflow-x-auto scrollbar-hide justify-center">
      {/* Your Story button */}
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center p-0.5 cursor-pointer">
          <div className="w-full h-full rounded-full border-2 border-purple-200 flex items-center justify-center bg-white">
            <Plus size={24} className="text-indigo-500" />
          </div>
        </div>
        <span className="text-xs mt-2 text-center">Your Story</span>
      </div>
      
      {/* User stories */}
      {reels.map(reel => (
        <div key={reel.id} className="flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full p-0.5 cursor-pointer ${
            reel.viewed 
              ? 'bg-gray-300' 
              : 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500'
          }`}>
            <img 
              src={reel.avatar} 
              alt={reel.user}
              className="w-full h-full rounded-full border-2 border-white object-cover" 
            />
          </div>
          <span className="text-xs mt-2 text-center">{reel.user}</span>
        </div>
      ))}
    </div>
  );
};

export default StoryReel;