// src/components/reel/ReelItem.tsx
import React from 'react';
import { Play } from 'lucide-react';
import type  { ReelItem } from '@/types';

interface ReelItemProps {
  reel: ReelItem;
}

const ReelItem: React.FC<ReelItemProps> = ({ reel }) => (
  <div className="relative cursor-pointer group">
    <div className={`aspect-[9/16] rounded-xl overflow-hidden ${
      reel.viewed ? 'bg-gradient-to-tr from-gray-200 to-gray-300' : 'bg-gradient-to-tr from-pink-500 to-purple-600'
    }`}>
      <div className="absolute inset-0 flex items-center justify-center opacity-80">
        <img src={reel.avatar} alt={reel.user} className="w-14 h-14 rounded-full border-2 border-white shadow-lg" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent text-white">
        <p className="text-sm font-medium">{reel.user}</p>
      </div>
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Play size={30} className="text-white" />
      </div>
    </div>
  </div>
);

export default ReelItem;