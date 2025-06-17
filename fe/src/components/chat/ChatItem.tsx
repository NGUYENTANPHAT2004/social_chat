// src/components/chat/ChatItem.tsx
import React from 'react';
import type  { ChatItem } from '@/types';

interface ChatItemProps {
  chat: ChatItem;
  isActive: boolean;
  onClick: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, isActive, onClick }) => (
  <div 
    className={`p-3 border-b border-gray-100 flex items-center hover:bg-indigo-50/50 cursor-pointer transition-all duration-200 ${isActive ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
    onClick={onClick}
  >
    <div className="relative">
      <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full shadow" />
      {chat.online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
      )}
      {chat.unread > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-sm">
          {chat.unread}
        </span>
      )}
    </div>
    <div className="ml-3 flex-grow">
      <div className="flex justify-between">
        <span className="font-medium">{chat.name}</span>
        <span className="text-xs text-gray-500">{chat.time}</span>
      </div>
      <p className="text-sm text-gray-600 truncate">{chat.message}</p>
    </div>
  </div>
);

export default ChatItem;