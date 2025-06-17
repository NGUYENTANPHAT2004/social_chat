// src/components/reel/ReelsColumn.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import ReelItem from './ReelItem';
import  { reels } from '@/data/mockData';

const ReelsColumn: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-3">Reels</h2>
        <button className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all">
          <Plus size={18} className="mr-2" />
          New Reel
        </button>
      </div>
      
      <div className="p-3 grid grid-cols-2 gap-3">
        {reels.map(reel => (
          <ReelItem key={reel.id} reel={reel} />
        ))}
      </div>
    </div>
  );
};

export default ReelsColumn;