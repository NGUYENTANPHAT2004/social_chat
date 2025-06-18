'use client';
import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchChatRooms, setActiveChat } from '@/store/slices/chatSlice';
import { fetchAllRooms, fetchLiveRooms } from '@/store/slices/roomSlice';
import { fetchGames } from '@/store/slices/gameSlice';
import SearchBox from '@/components/molecules/SearchBox/SearchBox';
import UserProfile from '@/components/molecules/UserProfile/UserProfile';
import GameCard from '@/components/molecules/GameCard/GameCard';
import TabButton from '@/components/atoms/Button/Button';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Badge from '@/components/atoms/Badge/Badge';
import { MessageCircle, Users, Play, Video, Gamepad2 } from 'lucide-react';

interface ChatPanelProps {
  activeTab: string;
  currentChat?: string;
  setCurrentChat?: (id: string) => void;
  showGames?: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  activeTab,
  currentChat,
  setCurrentChat,
  showGames = false,
}) => {
  const dispatch = useAppDispatch();
  const { chatRooms, loading: chatLoading } = useAppSelector((state) => state.chat);
  const { rooms, liveRooms, loading: roomLoading } = useAppSelector((state) => state.room);
  const { games, loading: gameLoading } = useAppSelector((state) => state.game);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    switch (activeTab) {
      case 'chat':
        dispatch(fetchChatRooms());
        break;
      case 'groups':
      case 'video':
        dispatch(fetchAllRooms());
        dispatch(fetchLiveRooms());
        break;
      case 'games':
        dispatch(fetchGames());
        break;
    }
  }, [activeTab, dispatch]);

  const renderChatList = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-3">Messages</h2>
        <SearchBox
          placeholder="Search conversations..."
          onSearch={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {chatLoading ? (
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {chatRooms
              .filter(room => 
                room.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((room) => (
                <div
                  key={room.id}
                  onClick={() => setCurrentChat?.(room.id)}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    currentChat === room.id ? 'bg-indigo-50 border-indigo-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar
                          src={room.image}
                          name={room.name}
                          size="md"
                          online={room.isActive}
                        />
                        {room.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {room.unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {room.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {room.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {room.lastMessageTime}
                      </p>
                      {room.isActive && (
                        <div className="w-2 h-2 bg-green-500 rounded-full ml-auto mt-1"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderRoomList = () => {
    const roomsToShow = activeTab === 'video' ? liveRooms : rooms;
    
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold mb-3">
            {activeTab === 'video' ? 'Live Rooms' : 'All Rooms'}
          </h2>
          <SearchBox
            placeholder="Search rooms..."
            onSearch={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
        </div>

        {/* Categories */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-2 overflow-x-auto">
            {['all', 'gaming', 'music', 'talk', 'education'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {roomLoading ? (
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="mb-4 p-3 border border-gray-200 rounded-lg animate-pulse">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {roomsToShow
                .filter(room => {
                  const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesCategory = selectedCategory === 'all' || room.category === selectedCategory;
                  return matchesSearch && matchesCategory;
                })
                .map((room) => (
                  <div
                    key={room.id}
                    className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden">
                        <img 
                          src={room.image} 
                          alt={room.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900 truncate">
                            {room.name}
                          </h3>
                          {room.isLive && (
                            <Badge variant="danger" size="sm">
                              LIVE
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Users className="w-4 h-4" />
                          <span>{room.viewerCount} viewers</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {room.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-1">
                        <Avatar
                          src={room.host.avatar}
                          name={room.host.username}
                          size="xs"
                        />
                        <span className="text-xs text-gray-500">
                          {room.host.username}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        {room.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGameList = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-3">Games</h2>
        <SearchBox
          placeholder="Search games..."
          onSearch={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* Game Categories */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-2 overflow-x-auto">
          {['all', 'lucky', 'card', 'dice', 'spin'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Game List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {gameLoading ? (
          <div className="p-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="mb-3 animate-pulse">
                <div className="flex items-center space-x-3 p-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {games
              .filter(game => {
                const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCategory = selectedCategory === 'all' || game.type === selectedCategory;
                return matchesSearch && matchesCategory;
              })
              .map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  variant="compact"
                  onPlay={(gameId) => console.log('Play game:', gameId)}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render based on active tab
  switch (activeTab) {
    case 'chat':
      return renderChatList();
    case 'groups':
    case 'video':
      return renderRoomList();
    default:
      if (showGames) {
        return renderGameList();
      }
      return renderChatList();
  }
};

export default ChatPanel;