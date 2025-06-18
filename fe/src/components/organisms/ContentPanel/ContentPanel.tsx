'use client';
import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import ChatWindow from '@/features/chat/components/ChatWindow/ChatWindow';
import LiveStream from '@/features/rooms/components/LiveStream/LiveStream';
import GameGrid from '@/components/organisms/GameGrid/GameGrid';
import { MessageCircle, Users, Play, Gamepad2 } from 'lucide-react';

interface ContentPanelProps {
  activeTab: string;
  currentChat?: string;
  currentRoom?: string;
  showGames?: boolean;
}

const ContentPanel: React.FC<ContentPanelProps> = ({
  activeTab,
  currentChat,
  currentRoom,
  showGames = false,
}) => {
  const { chatRooms } = useAppSelector((state) => state.chat);
  const { rooms } = useAppSelector((state) => state.room);
  const [contentType, setContentType] = useState<'default' | 'chat' | 'room' | 'games'>('default');

  useEffect(() => {
    if (showGames) {
      setContentType('games');
    } else if (currentChat) {
      setContentType('chat');
    } else if (currentRoom) {
      setContentType('room');
    } else {
      setContentType('default');
    }
  }, [showGames, currentChat, currentRoom]);

  const renderDefaultContent = () => (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to LiveMate
        </h2>
        <p className="text-gray-600 mb-6">
          Connect with friends, play games, and join live streams. 
          Select a conversation or room to get started.
        </p>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-500">
            <MessageCircle className="w-4 h-4 mr-2" />
            <span>Chat with friends in real-time</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Gamepad2 className="w-4 h-4 mr-2" />
            <span>Play exciting games and win KC</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Play className="w-4 h-4 mr-2" />
            <span>Watch and create live streams</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChatContent = () => {
    const room = chatRooms.find(room => room.id === currentChat);
    if (!room) return renderDefaultContent();

    return (
      <ChatWindow
        room={room}
        messages={[]} // This would come from Redux store
        onSendMessage={(content) => {
          console.log('Send message:', content);
        }}
      />
    );
  };

  const renderRoomContent = () => {
    const room = rooms.find(room => room.id === currentRoom);
    if (!room) return renderDefaultContent();

    return (
      <LiveStream
        room={room}
        viewers={[]} // This would come from Redux store
        onSendGift={(giftId) => {
          console.log('Send gift:', giftId);
        }}
        onFollow={() => {
          console.log('Follow streamer');
        }}
        onShare={() => {
          console.log('Share stream');
        }}
      />
    );
  };

  const renderGamesContent = () => (
    <div className="h-full bg-gray-50">
      <GameGrid />
    </div>
  );

  // Render based on content type
  switch (contentType) {
    case 'chat':
      return renderChatContent();
    case 'room':
      return renderRoomContent();
    case 'games':
      return renderGamesContent();
    default:
      return renderDefaultContent();
  }
};

export default ContentPanel;