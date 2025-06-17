// src/components/chat/ChatHeader.tsx
import React from 'react';
import { Phone, Video, Gift, Zap, MoreVertical } from 'lucide-react';

const ChatHeader: React.FC = () => (
  <div className="h-16 border-b border-gray-200 px-4 flex items-center justify-between bg-white shadow-sm">
    <div className="flex items-center">
      <div className="relative">
        <img src="/api/placeholder/40/40" alt="Profile" className="w-10 h-10 rounded-full" />
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
      </div>
      <div className="ml-3">
        <h3 className="font-semibold">Tuấn Anh</h3>
        <p className="text-xs text-green-500">Online now</p>
      </div>
    </div>
    
    <div className="flex items-center space-x-3">
      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
        <Phone size={20} />
      </button>
      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
        <Video size={20} />
      </button>
      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
        <Gift size={20} />
      </button>
      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
        <MoreVertical size={20} />
      </button>
    </div>
  </div>
);

export default ChatHeader;