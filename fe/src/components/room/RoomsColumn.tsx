// src/components/room/RoomsColumn.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import RoomItem from './RoomItem';
import { rooms } from '@/data/mockData';

const RoomsColumn: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-3">Rooms</h2>
        <button className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all">
          <Plus size={18} className="mr-2" />
          Create Room
        </button>
      </div>
      
      <div className="overflow-y-auto flex-grow">
        {rooms.map(room => (
          <RoomItem key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
};

export default RoomsColumn;