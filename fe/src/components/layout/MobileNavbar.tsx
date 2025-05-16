// components/layout/MobileNavbar.tsx
import React from 'react';
import { MessageCircle, Video, Menu, Settings, Star } from 'lucide-react';

interface MobileNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleChatPanel: () => void;
  toggleFeaturePanel: () => void;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({
  activeTab,
  setActiveTab,
  toggleChatPanel,
  toggleFeaturePanel,
}) => {
  return (
    <div className="h-16 bg-indigo-900 flex items-center justify-between px-4 text-white sticky top-0 z-20">
      <button onClick={toggleChatPanel} className="p-2">
        <Menu size={24} />
      </button>
      
      <div className="flex space-x-4">
        <button
          className={`p-2 ${activeTab === 'chat' ? 'text-indigo-300' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageCircle size={24} />
        </button>
        <button
          className={`p-2 ${activeTab === 'video' ? 'text-indigo-300' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          <Video size={24} />
        </button>
        <button
          className={`p-2 ${activeTab === 'games' ? 'text-indigo-300' : ''}`}
          onClick={() => setActiveTab('games')}
        >
          <Star size={24} />
        </button>
      </div>
      
      <button onClick={toggleFeaturePanel} className="p-2">
        <Settings size={24} />
      </button>
    </div>
  );
};

export default MobileNavbar;