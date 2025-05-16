// src/components/room/LiveStreamItem.tsx
import React from 'react';
import { Play } from 'lucide-react';
import { LiveEvent } from '@/types';

interface LiveStreamItemProps {
  stream: LiveEvent;
}

const LiveStreamItem: React.FC<LiveStreamItemProps> = ({ stream }) => (
  <div className="mb-4 cursor-pointer group">
    <div className="relative h-40 rounded-xl overflow-hidden shadow-md">
      <img src={stream.thumbnail} alt={stream.title} className="w-full h-full object-cover" />
      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg shadow">
        LIVE
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent text-white">
        <h3 className="font-medium">{stream.title}</h3>
        <div className="flex justify-between items-center">
          <p className="text-xs opacity-80">{stream.host}</p>
          <p className="text-xs bg-black/40 px-2 py-1 rounded">{stream.viewers} viewers</p>
        </div>
      </div>
      <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="bg-white/90 text-indigo-600 rounded-full p-2 shadow-lg">
          <Play size={36} className="ml-1" />
        </div>
      </div>
    </div>
  </div>
);

export default LiveStreamItem;