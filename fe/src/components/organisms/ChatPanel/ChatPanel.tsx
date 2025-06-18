// components/organisms/ChatPanel/ChatPanelUI.tsx
import React from 'react';
import { MessageCircle, Users, Play, Video, Search, Plus } from 'lucide-react';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Badge from '@/components/atoms/Badge/Badge';
import Input from '@/components/atoms/Input/Input';
import Button from '@/components/atoms/Button/Button';
import LoadingSpinner from '@/components/atoms/LoadingSpinner/LoadingSpinner';
import EmptyState from '@/components/molecules/EmptyState/EmptyState';

// Types
export interface ChatRoom {
  id: string;
  name: string;
  type: 'private' | 'group';
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
  participants?: Array<{
    id: string;
    username: string;
    avatar?: string;
    isOnline: boolean;
  }>;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  viewerCount: number;
  isLive: boolean;
  thumbnail?: string;
  category?: string;
}

export interface Game {
  id: string;
  name: string;
  type: string;
  minBet: number;
  maxBet: number;
  playCount: number;
  thumbnail: string;
  category?: string;
}

export interface ChatPanelUIProps {
  activeTab: 'chat' | 'groups' | 'video' | 'reels' | 'games';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading?: boolean;
  
  // Chat tab props
  chatRooms?: ChatRoom[];
  currentChatId?: string;
  onChatSelect?: (chatId: string) => void;
  onCreateChat?: () => void;
  
  // Groups/Rooms tab props
  rooms?: Room[];
  onRoomSelect?: (roomId: string) => void;
  onCreateRoom?: () => void;
  
  // Games tab props
  games?: Game[];
  gameCategories?: string[];
  selectedGameCategory?: string;
  onGameSelect?: (gameId: string) => void;
  onGameCategoryChange?: (category: string) => void;
}

const ChatPanelUI: React.FC<ChatPanelUIProps> = ({
  activeTab,
  searchQuery,
  onSearchChange,
  loading = false,
  chatRooms = [],
  currentChatId,
  onChatSelect,
  onCreateChat,
  rooms = [],
  onRoomSelect,
  onCreateRoom,
  games = [],
  gameCategories = ['All', 'Popular', 'New', 'Slots', 'Cards', 'Dice'],
  selectedGameCategory = 'All',
  onGameSelect,
  onGameCategoryChange,
}) => {
  // Tab Icons
  const getTabIcon = () => {
    switch (activeTab) {
      case 'chat':
        return <MessageCircle className="w-5 h-5" />;
      case 'groups':
        return <Users className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'games':
        return <Play className="w-5 h-5" />;
      default:
        return null;
    }
  };

  // Tab Titles
  const getTabTitle = () => {
    switch (activeTab) {
      case 'chat':
        return 'Messages';
      case 'groups':
        return 'Rooms';
      case 'video':
        return 'Live Streams';
      case 'games':
        return 'Games';
      default:
        return '';
    }
  };

  // Chat Room Item
  const ChatRoomItem: React.FC<{ room: ChatRoom }> = ({ room }) => (
    <div
      className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
        currentChatId === room.id ? 'bg-indigo-50' : ''
      }`}
      onClick={() => onChatSelect?.(room.id)}
    >
      <div className="relative">
        <Avatar
          src={room.avatar}
          name={room.name}
          size="md"
          online={room.isOnline}
        />
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {room.name}
          </h4>
          {room.lastMessageTime && (
            <span className="text-xs text-gray-500 ml-2">
              {room.lastMessageTime}
            </span>
          )}
        </div>
        {room.lastMessage && (
          <p className="text-sm text-gray-600 truncate">{room.lastMessage}</p>
        )}
      </div>
      {room.unreadCount > 0 && (
        <Badge variant="primary" size="sm">
          {room.unreadCount}
        </Badge>
      )}
    </div>
  );

  // Room Item
  const RoomItem: React.FC<{ room: Room }> = ({ room }) => (
    <div
      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg"
      onClick={() => onRoomSelect?.(room.id)}
    >
      <div className="flex items-start space-x-3">
        {room.thumbnail ? (
          <img
            src={room.thumbnail}
            alt={room.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">{room.name}</h4>
          <p className="text-xs text-gray-600 mt-1">{room.hostName}</p>
          <div className="flex items-center mt-2 space-x-3">
            {room.isLive && (
              <Badge variant="danger" size="sm">
                LIVE
              </Badge>
            )}
            <span className="text-xs text-gray-500 flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {room.viewerCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Game Item
  const GameItem: React.FC<{ game: Game }> = ({ game }) => (
    <div
      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg"
      onClick={() => onGameSelect?.(game.id)}
    >
      <div className="flex items-center space-x-3">
        <img
          src={game.thumbnail}
          alt={game.name}
          className="w-12 h-12 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">{game.name}</h4>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <span>{game.playCount} playing</span>
            <span className="mx-2">•</span>
            <span>{game.minBet}-{game.maxBet} KC</span>
          </div>
        </div>
        <Button variant="outline" size="sm">
          Play
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getTabIcon()}
            <h2 className="text-xl font-semibold">{getTabTitle()}</h2>
          </div>
          {(activeTab === 'chat' || activeTab === 'groups') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={activeTab === 'chat' ? onCreateChat : onCreateRoom}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder={`Search ${getTabTitle().toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Game Categories */}
        {activeTab === 'games' && (
          <div className="flex space-x-2 mt-3 overflow-x-auto">
            {gameCategories.map((category) => (
              <Button
                key={category}
                variant={selectedGameCategory === category ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onGameCategoryChange?.(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Chat List */}
            {activeTab === 'chat' && (
              <div className="divide-y divide-gray-100">
                {chatRooms.length > 0 ? (
                  chatRooms.map((room) => (
                    <ChatRoomItem key={room.id} room={room} />
                  ))
                ) : (
                  <EmptyState
                    icon={MessageCircle}
                    title="No conversations"
                    description="Start a new chat to connect with friends"
                    action={{
                      label: 'Start Chat',
                      onClick: onCreateChat,
                    }}
                  />
                )}
              </div>
            )}

            {/* Rooms List */}
            {(activeTab === 'groups' || activeTab === 'video') && (
              <div className="p-2 space-y-2">
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <RoomItem key={room.id} room={room} />
                  ))
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No rooms available"
                    description="Create a room or wait for others to go live"
                    action={{
                      label: 'Create Room',
                      onClick: onCreateRoom,
                    }}
                  />
                )}
              </div>
            )}

            {/* Games List */}
            {activeTab === 'games' && (
              <div className="p-2 space-y-2">
                {games.length > 0 ? (
                  games.map((game) => (
                    <GameItem key={game.id} game={game} />
                  ))
                ) : (
                  <EmptyState
                    icon={Play}
                    title="No games found"
                    description="Check back later for new games"
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPanelUI;