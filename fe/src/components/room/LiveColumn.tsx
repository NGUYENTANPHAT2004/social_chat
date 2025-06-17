// src/components/room/LiveColumn.tsx
import React from 'react';
import { Video } from 'lucide-react';
import LiveStreamItem from './LiveStreamItem';
import { liveEvents } from '@/data/mockData';

const LiveColumn: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-3">Live Now</h2>
        <button className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all">
          <Video size={18} className="mr-2" />
          Go Live
        </button>
      </div>
      
      <div className="overflow-y-auto flex-grow p-3">
        {liveEvents.map(stream => (
          <LiveStreamItem key={stream.id} stream={stream} />
        ))}
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-3">Discover more streams</p>
          <button className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm transition-colors">
            Explore Live
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveColumn;