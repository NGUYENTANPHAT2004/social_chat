import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ChatPanelUI, { ChatRoom, Room, Game } from '@/components/organisms/ChatPanel/ChatPanel';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useSocket } from '@/hooks/useSocket';
import { useDebounce } from '@/hooks/useDebounce';
import { apiService } from '@/services/api';
import { API_ENDPOINTS, SOCKET_EVENTS } from '@/constants';
import toast from 'react-hot-toast';

interface ChatPanelContainerProps {
  activeTab: 'chat' | 'groups' | 'video' | 'reels' | 'games';
  showGames?: boolean;
}

const ChatPanelContainer: React.FC<ChatPanelContainerProps> = ({
  activeTab,
  showGames = false,
}) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const socket = useSocket();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [selectedGameCategory, setSelectedGameCategory] = useState('All');
  
  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch chat rooms
  const fetchChatRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ items: ChatRoom[] }>(
        API_ENDPOINTS.CHAT_ROOMS,
        { search: debouncedSearch }
      );
      setChatRooms(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'video' 
        ? API_ENDPOINTS.LIVE_ROOMS 
        : API_ENDPOINTS.ROOMS_LIST;
        
      const response = await apiService.get<{ items: Room[] }>(
        endpoint,
        { search: debouncedSearch }
      );
      setRooms(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch]);

  // Fetch games
  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { search: debouncedSearch };
      if (selectedGameCategory !== 'All') {
        params.category = selectedGameCategory.toLowerCase();
      }
      
      const response = await apiService.get<{ items: Game[] }>(
        API_ENDPOINTS.GAMES_LIST,
        params
      );
      setGames(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch games:', error);
      toast.error('Failed to load games');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedGameCategory]);

  // Load data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case 'chat':
        fetchChatRooms();
        break;
      case 'groups':
      case 'video':
        fetchRooms();
        break;
      case 'games':
        fetchGames();
        break;
    }
  }, [activeTab, fetchChatRooms, fetchRooms, fetchGames]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Chat events
    const handleNewMessage = (data: any) => {
      setChatRooms(prev => prev.map(room => {
        if (room.id === data.roomId) {
          return {
            ...room,
            lastMessage: data.message.content,
            lastMessageTime: new Date(data.message.createdAt).toLocaleTimeString(),
            unreadCount: currentChatId !== room.id ? room.unreadCount + 1 : room.unreadCount
          };
        }
        return room;
      }));
    };

    // Room events
    const handleRoomUpdate = (data: any) => {
      setRooms(prev => prev.map(room => {
        if (room.id === data.roomId) {
          return { ...room, ...data.updates };
        }
        return room;
      }));
    };

    // User status events
    const handleUserStatusUpdate = (data: any) => {
      setChatRooms(prev => prev.map(room => {
        if (room.participants?.some(p => p.id === data.userId)) {
          return {
            ...room,
            participants: room.participants.map(p => 
              p.id === data.userId ? { ...p, isOnline: data.isOnline } : p
            )
          };
        }
        return room;
      }));
    };

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
    socket.on(SOCKET_EVENTS.ROOM_UPDATE, handleRoomUpdate);
    socket.on(SOCKET_EVENTS.USER_STATUS_UPDATE, handleUserStatusUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS.ROOM_UPDATE, handleRoomUpdate);
      socket.off(SOCKET_EVENTS.USER_STATUS_UPDATE, handleUserStatusUpdate);
    };
  }, [socket, currentChatId]);

  // Handlers
  const handleChatSelect = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
    
    // Mark as read
    apiService.patch(`${API_ENDPOINTS.CHAT_MESSAGES_READ(chatId)}`);
    
    // Update unread count
    setChatRooms(prev => prev.map(room => 
      room.id === chatId ? { ...room, unreadCount: 0 } : room
    ));
    
    // Navigate to chat
    router.push(`/chat/${chatId}`);
  }, [router]);

  const handleRoomSelect = useCallback((roomId: string) => {
    router.push(`/room/${roomId}`);
  }, [router]);

  const handleGameSelect = useCallback((gameId: string) => {
    router.push(`/game/${gameId}`);
  }, [router]);

  const handleCreateChat = useCallback(() => {
    router.push('/chat/new');
  }, [router]);

  const handleCreateRoom = useCallback(() => {
    router.push('/room/create');
  }, [router]);

  return (
    <ChatPanelUI
      activeTab={activeTab}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      loading={loading}
      chatRooms={chatRooms}
      currentChatId={currentChatId}
      onChatSelect={handleChatSelect}
      onCreateChat={handleCreateChat}
      rooms={rooms}
      onRoomSelect={handleRoomSelect}
      onCreateRoom={handleCreateRoom}
      games={games}
      selectedGameCategory={selectedGameCategory}
      onGameSelect={handleGameSelect}
      onGameCategoryChange={setSelectedGameCategory}
    />
  );
};

export default ChatPanelContainer;
export const useChatPanel = () => {
    const [activeTab, setActiveTab] = useState<'chat' | 'groups' | 'video' | 'reels' | 'games'>('chat');
    const [showGames, setShowGames] = useState(false);
  
    return {
      activeTab,
      setActiveTab,
      showGames,
      setShowGames,
    };
  };