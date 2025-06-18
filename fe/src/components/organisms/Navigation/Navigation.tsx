'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  MessageCircle, 
  Video, 
  Users, 
  Play, 
  Star, 
  Settings,
  Home,
  Gamepad2
} from 'lucide-react';
import Avatar from '@/components/atoms/Avatar/Avatar';
import { useAuth } from '@/features/auth/context/AuthContext';

interface NavigationProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  showGames?: boolean;
  setShowGames?: (show: boolean) => void;
}

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
}

const NavigationIcon: React.FC<{
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  label?: string;
}> = ({ icon: Icon, isActive, onClick, label }) => (
  <button 
    className={`p-3 rounded-xl transition-all duration-200 group relative ${
      isActive 
        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg text-white' 
        : 'text-gray-300 hover:bg-indigo-800/30 hover:text-white'
    }`}
    onClick={onClick}
    title={label}
  >
    <Icon size={20} />
    {label && (
      <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {label}
      </span>
    )}
  </button>
);

const Logo: React.FC = () => (
  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
    <span className="font-bold text-white text-lg">LM</span>
  </div>
);

const Navigation: React.FC<NavigationProps> = ({ 
  activeTab = 'chat', 
  setActiveTab,
  showGames = false,
  setShowGames 
}) => {
  const { user } = useAuth();
  const pathname = usePathname();

  const navigationItems: NavItem[] = [
    {
      id: 'home',
      icon: Home,
      label: 'Home',
      href: '/',
      isActive: pathname === '/',
    },
    {
      id: 'chat',
      icon: MessageCircle,
      label: 'Messages',
      onClick: () => setActiveTab?.('chat'),
      isActive: activeTab === 'chat',
    },
    {
      id: 'video',
      icon: Video,
      label: 'Video Calls',
      onClick: () => setActiveTab?.('video'),
      isActive: activeTab === 'video',
    },
    {
      id: 'groups',
      icon: Users,
      label: 'Groups',
      onClick: () => setActiveTab?.('groups'),
      isActive: activeTab === 'groups',
    },
    {
      id: 'reels',
      icon: Play,
      label: 'Reels',
      onClick: () => setActiveTab?.('reels'),
      isActive: activeTab === 'reels',
    },
    {
      id: 'games',
      icon: Gamepad2,
      label: 'Games',
      onClick: () => setShowGames?.(!showGames),
      isActive: showGames,
    },
  ];

  const handleItemClick = (item: NavItem) => {
    if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <div className="w-20 bg-indigo-900 flex flex-col items-center py-6 text-white h-full">
      {/* Logo */}
      <Logo />
      
      {/* Navigation Items */}
      <div className="flex flex-col items-center space-y-4 mt-8 flex-1">
        {navigationItems.map((item) => (
          <div key={item.id}>
            {item.href ? (
              <Link href={item.href}>
                <NavigationIcon 
                  icon={item.icon} 
                  isActive={item.isActive || false} 
                  onClick={() => {}}
                  label={item.label}
                />
              </Link>
            ) : (
              <NavigationIcon 
                icon={item.icon} 
                isActive={item.isActive || false} 
                onClick={() => handleItemClick(item)}
                label={item.label}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Bottom Section */}
      <div className="mt-auto space-y-4">
        <NavigationIcon 
          icon={Settings} 
          isActive={false} 
          onClick={() => {}}
          label="Settings"
        />
        
        {/* User Profile */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow">
            <Avatar
              src={user?.avatar}
              name={user?.username}
              size="md"
              online={user?.isOnline}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
