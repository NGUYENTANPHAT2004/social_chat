// src/components/room/RoomItem.tsx
import React from 'react';
import type  { RoomItem } from '@/types';

interface RoomItemProps {
  room: RoomItem;
}

const RoomItem: React.FC<RoomItemProps> = ({ room }) => (
  <div className="p-3 border-b border-gray-100 hover:bg-indigo-50/50 transition-all cursor-pointer">
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm">
          <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
        </div>
        <div className="ml-3">
          <span className="font-medium">{room.name}</span>
          <p className="text-xs text-gray-600">{room.members} members</p>
        </div>
      </div>
      <span className={`w-2.5 h-2.5 rounded-full ${room.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
    </div>
  </div>
);

export default RoomItem;