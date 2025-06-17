// src/components/chat/Message.tsx
import React from 'react';
import { MessageItem } from '@/types';

interface MessageProps {
  message: MessageItem;
}

const Message: React.FC<MessageProps> = ({ message }) => (
  <div className={`flex mb-4 ${message.isMine ? 'justify-end' : 'justify-start'}`}>
    {!message.isMine && (
      <div className="flex-shrink-0 mr-2">
        <img src="/api/placeholder/32/32" alt={message.sender} className="w-8 h-8 rounded-full self-end shadow" />
      </div>
    )}
    
    <div className="flex flex-col">
      <div 
        className={`p-3 rounded-xl ${
          message.isMine 
            ? 'bg-indigo-600 text-white rounded-br-none' 
            : 'bg-white border border-gray-100 rounded-bl-none'
        }`}
      >
        <p className="text-sm">{message.text}</p>
      </div>
      <div className={`text-xs mt-1 ${message.isMine ? 'text-right' : 'text-left'} text-gray-500`}>
        {message.time}
      </div>
    </div>
  </div>
);

export default Message;