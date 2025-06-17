'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Paperclip, MoreVertical } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import { MessageWithSender, ChatRoom } from '@/types';

interface ChatWindowProps {
  room: ChatRoom;
  messages: MessageWithSender[];
  onSendMessage: (content: string) => void;
  isTyping?: boolean;
  typingUsers?: string[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  room,
  messages,
  onSendMessage,
  isTyping = false,
  typingUsers = [],
}) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messageText, setMessageText] = useState('');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Join room when component mounts
    socket.joinRoom(room.id);
    
    return () => {
      socket.leaveRoom(room.id);
    };
  }, [room.id, socket]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText('');
      setIsUserTyping(false);
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    
    // Handle typing indicator
    if (!isUserTyping && e.target.value.length > 0) {
      setIsUserTyping(true);
      socket.emit('userTyping', { roomId: room.id });
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false);
      socket.emit('userStopTyping', { roomId: room.id });
    }, 2000);
  };

  const renderMessage = (message: MessageWithSender, index: number) => {
    const isOwnMessage = message.userId === user?.id;
    const prevMessage = messages[index - 1];
    const showAvatar = !prevMessage || prevMessage.userId !== message.userId;
    const showTimestamp = !prevMessage || 
      new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 300000; // 5 minutes

    return (
      <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs lg:max-w-md`}>
          {showAvatar && (
            <Avatar
              src={message.user.avatar}
              name={message.user.username}
              size="sm"
              className={isOwnMessage ? 'ml-2' : 'mr-2'}
            />
          )}
          
          <div className={`${showAvatar ? '' : isOwnMessage ? 'mr-10' : 'ml-10'}`}>
            {showTimestamp && (
              <div className={`text-xs text-gray-500 mb-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                {!isOwnMessage && `${message.user.username} • `}
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              </div>
            )}
            
            <div className={`px-4 py-2 rounded-2xl ${
              isOwnMessage
                ? 'bg-purple-500 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }`}>
              {message.type === 'text' ? (
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              ) : message.type === 'gift' ? (
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{message.metadata?.giftIcon}</span>
                  <span className="text-sm">sent a {message.metadata?.giftName}</span>
                </div>
              ) : (
                <p className="text-sm italic">{message.content}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <Avatar src={room.host?.avatar} name={room.name} size="md" />
          <div>
            <h3 className="font-semibold text-gray-900">{room.name}</h3>
            <p className="text-sm text-gray-500">
              {room.viewerCount} {room.viewerCount === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>
        
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>
              {typingUsers.length === 1 
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.length} people are typing...`
              }
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm">
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Type a message..."
              value={messageText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="border-none bg-white shadow-sm"
            />
          </div>
          
          <Button variant="ghost" size="sm">
            <Smile className="w-5 h-5" />
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
