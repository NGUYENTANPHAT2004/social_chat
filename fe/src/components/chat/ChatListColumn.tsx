// src/components/chat/ChatListColumn.tsx
import React from 'react';
import { ChatItem } from '@/types';
import SearchInput from '../ui/SearchInput';
import ChatItemComponent from './ChatItem';
import  { chatList } from '@/data/mockData';

interface ChatListColumnProps {
  activeTab: string;
  currentChat: number;
  setCurrentChat: (id: number) => void;
}

const ChatListColumn: React.FC<ChatListColumnProps> = ({ activeTab, currentChat, setCurrentChat }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-3">Messages</h2>
        <SearchInput placeholder="Search conversations..." />
      </div>
      
      <div className="overflow-y-auto flex-grow">
        {chatList.map(chat => (
          <ChatItemComponent 
            key={chat.id} 
            chat={chat} 
            isActive={chat.id === currentChat}
            onClick={() => setCurrentChat(chat.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default ChatListColumn;