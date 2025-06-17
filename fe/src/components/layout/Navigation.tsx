// components/layout/Navigation.tsx
import React from 'react';
import { MessageCircle, Video, Phone, Users, Play, Star, Settings } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showGames: boolean;
  setShowGames: (show: boolean) => void;
}

const NavigationIcon: React.FC<{
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, isActive, onClick }) => (
  <button 
    className={`p-3 rounded-xl transition-all duration-200 ${
      isActive 
        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg text-white' 
        : 'text-gray-300 hover:bg-indigo-800/30'
    }`}
    onClick={onClick}
  >
    <Icon size={20} />
  </button>
);

const Logo: React.FC = () => (
  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
    <span className="font-bold text-white text-lg">LM</span>
  </div>
);

const Navigation: React.FC<NavigationProps> = ({ 
  activeTab, 
  setActiveTab, 
  showGames, 
  setShowGames 
}) => (
  <div className="w-20 bg-indigo-900 flex flex-col items-center py-6 text-white h-full">
    <Logo />
    
    <div className="flex flex-col items-center space-y-4 mt-8">
      <NavigationIcon 
        icon={MessageCircle} 
        isActive={activeTab === 'chat'} 
        onClick={() => setActiveTab('chat')}
      />
      <NavigationIcon 
        icon={Video} 
        isActive={activeTab === 'video'} 
        onClick={() => setActiveTab('video')}
      />
      <NavigationIcon 
        icon={Users} 
        isActive={activeTab === 'groups'} 
        onClick={() => setActiveTab('groups')}
      />
      <NavigationIcon 
        icon={Play} 
        isActive={activeTab === 'reels'} 
        onClick={() => setActiveTab('reels')}
      />
      <NavigationIcon 
        icon={Star} 
        isActive={showGames} 
        onClick={() => setShowGames(!showGames)}
      />
    </div>
    
    <div className="mt-auto">
      <NavigationIcon 
        icon={Settings} 
        isActive={false} 
        onClick={() => {}}
      />
      <div className="mt-4 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center cursor-pointer mb-2">
        <img src="/api/placeholder/32/32" alt="Profile" className="w-10 h-10 rounded-full border-2 border-white" />
      </div>
    </div>
  </div>
);

export default Navigation;