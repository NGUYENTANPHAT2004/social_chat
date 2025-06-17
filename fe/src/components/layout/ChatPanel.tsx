// components/layout/ChatPanel.tsx
import React from 'react';
import ChatListColumn from '../chat/ChatListColumn';
import RoomsColumn from '../room/RoomsColumn';
import ReelsColumn from '../reel/ReelsColumn';
import LiveColumn from '../room/LiveColumn';
import GamesColumn from '../game/GamesColumn';

interface ChatPanelProps {
  activeTab: string;
  currentChat: number;
  setCurrentChat: (id: number) => void;
  showGames: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  activeTab,
  currentChat,
  setCurrentChat,
  showGames,
}) => {
  return (
    <div className="h-full">
      {activeTab === 'chat' && (
        <ChatListColumn 
          activeTab={activeTab} 
          currentChat={currentChat} 
          setCurrentChat={setCurrentChat} 
        />
      )}
      
      {activeTab === 'groups' && <RoomsColumn />}
      {activeTab === 'reels' && <ReelsColumn />}
      {activeTab === 'video' && <LiveColumn />}
      {showGames && <GamesColumn />}
    </div>
  );
};

export default ChatPanel;