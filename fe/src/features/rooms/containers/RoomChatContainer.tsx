'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';

// Redux
import { RootState } from '@/store';
import {
  fetchRooms,
  fetchTrendingRooms,
  fetchRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  followRoom,
  unfollowRoom,
  fetchRoomMembers,
  startStream,
  endStream,
  setFilters,
  clearFilters,
  clearError,
} from '@/store/slices/roomSlice';

import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  markConversationAsRead,
  deleteConversation,
  getOrCreateConversationWithUser,
  setCurrentConversation,
  clearError as clearMessageError,
} from '@/store/slices/messageSlice';

// Services
import { CreateRoomDto, UpdateRoomDto } from '@/services/room.service';
import { SendMessageDto } from '@/services/message.service';

// Hooks
import { useSocket, useRoomSocket, useConversationSocket } from '@/hooks/useSocket';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

// Components (assume these exist)
// import RoomListUI from '@/components/room/RoomList';
// import RoomDetailUI from '@/components/room/RoomDetail';
// import ChatUI from '@/components/chat/Chat';
// import MessageListUI from '@/components/chat/MessageList';

interface RoomChatContainerProps {
  initialView?: 'rooms' | 'chat' | 'trending';
  roomId?: string;
  conversationId?: string;
}

export const RoomChatContainer: React.FC<RoomChatContainerProps> = ({
  initialView = 'rooms',
  roomId,
  conversationId,
}) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();

  // Local state
  const [currentView, setCurrentView] = useState(initialView);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showRoomSettingsModal, setShowRoomSettingsModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(roomId || null);
  const [messageInput, setMessageInput] = useState('');

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Redux state
  const roomState = useSelector((state: RootState) => state.room);
  const messageState = useSelector((state: RootState) => state.message);

  const {
    rooms,
    trendingRooms,
    currentRoom,
    roomMembers,
    loading: roomLoading,
    error: roomError,
    filters,
    streaming,
  } = roomState;

  const {
    conversations,
    currentConversation,
    messages,
    loading: messageLoading,
    sending: messageSending,
    error: messageError,
    totalUnreadCount,
    typingUsers,
  } = messageState;

  // Socket hooks
  const { isConnected } = useSocket();
  const roomSocket = useRoomSocket(selectedRoom || undefined);
  const conversationSocket = useConversationSocket(currentConversation?._id);

  // Memoized data
  const currentMessages = useMemo(() => {
    return currentConversation ? messages[currentConversation._id] || [] : [];
  }, [currentConversation, messages]);

  const currentTypingUsers = useMemo(() => {
    return currentConversation ? typingUsers[currentConversation._id] || [] : [];
  }, [currentConversation, typingUsers]);

  // Effects
  useEffect(() => {
    if (isAuthenticated) {
      // Load initial data
      dispatch(fetchConversations());
      
      if (currentView === 'rooms') {
        dispatch(fetchRooms());
      } else if (currentView === 'trending') {
        dispatch(fetchTrendingRooms());
      }
    }
  }, [dispatch, isAuthenticated, currentView]);

  useEffect(() => {
    // Update search filter
    dispatch(setFilters({ search: debouncedSearch }));
  }, [dispatch, debouncedSearch]);

  useEffect(() => {
    if (roomId && roomId !== selectedRoom) {
      setSelectedRoom(roomId);
      dispatch(fetchRoomById(roomId));
    }
  }, [dispatch, roomId, selectedRoom]);

  useEffect(() => {
    if (conversationId) {
      const conversation = conversations.find(c => c._id === conversationId);
      if (conversation) {
        dispatch(setCurrentConversation(conversation));
        dispatch(fetchMessages(conversationId));
        dispatch(markConversationAsRead(conversationId));
      }
    }
  }, [dispatch, conversationId, conversations]);

  useEffect(() => {
    // Clear errors after showing them
    if (roomError) {
      toast.error(roomError);
      dispatch(clearError());
    }
    if (messageError) {
      toast.error(messageError);
      dispatch(clearMessageError());
    }
  }, [dispatch, roomError, messageError]);

  // Handlers
  const handleViewChange = useCallback((view: 'rooms' | 'chat' | 'trending') => {
    setCurrentView(view);
    setSelectedRoom(null);
    dispatch(setCurrentConversation(null));
    
    if (view === 'trending') {
      dispatch(fetchTrendingRooms());
    } else if (view === 'rooms') {
      dispatch(fetchRooms());
    }
  }, [dispatch]);

  const handleRoomSelect = useCallback(async (roomId: string) => {
    try {
      setSelectedRoom(roomId);
      await dispatch(fetchRoomById(roomId)).unwrap();
      await dispatch(fetchRoomMembers(roomId)).unwrap();
      router.push(`/rooms/${roomId}`);
    } catch (error) {
      toast.error('Failed to load room');
    }
  }, [dispatch, router]);

  const handleCreateRoom = useCallback(async (data: CreateRoomDto) => {
    try {
      const room = await dispatch(createRoom(data)).unwrap();
      setShowCreateRoomModal(false);
      setSelectedRoom(room._id);
      router.push(`/rooms/${room._id}`);
      toast.success('Room created successfully!');
    } catch (error) {
      toast.error('Failed to create room');
    }
  }, [dispatch, router]);

  const handleUpdateRoom = useCallback(async (roomId: string, data: UpdateRoomDto) => {
    try {
      await dispatch(updateRoom({ id: roomId, data })).unwrap();
      setShowRoomSettingsModal(false);
      toast.success('Room updated successfully!');
    } catch (error) {
      toast.error('Failed to update room');
    }
  }, [dispatch]);

  const handleDeleteRoom = useCallback(async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    
    try {
      await dispatch(deleteRoom(roomId)).unwrap();
      setSelectedRoom(null);
      router.push('/rooms');
      toast.success('Room deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete room');
    }
  }, [dispatch, router]);

  const handleJoinRoom = useCallback(async (roomId: string, password?: string) => {
    try {
      await dispatch(joinRoom({ id: roomId, password })).unwrap();
      toast.success('Joined room successfully!');
    } catch (error) {
      toast.error('Failed to join room');
    }
  }, [dispatch]);

  const handleLeaveRoom = useCallback(async (roomId: string) => {
    try {
      await dispatch(leaveRoom(roomId)).unwrap();
      toast.success('Left room successfully!');
    } catch (error) {
      toast.error('Failed to leave room');
    }
  }, [dispatch]);

  const handleFollowRoom = useCallback(async (roomId: string) => {
    try {
      await dispatch(followRoom(roomId)).unwrap();
      toast.success('Following room!');
    } catch (error) {
      toast.error('Failed to follow room');
    }
  }, [dispatch]);

  const handleUnfollowRoom = useCallback(async (roomId: string) => {
    try {
      await dispatch(unfollowRoom(roomId)).unwrap();
      toast.success('Unfollowed room!');
    } catch (error) {
      toast.error('Failed to unfollow room');
    }
  }, [dispatch]);

  const handleStartStream = useCallback(async (roomId: string) => {
    try {
      const result = await dispatch(startStream(roomId)).unwrap();
      toast.success('Stream started successfully!');
      return result;
    } catch (error) {
      toast.error('Failed to start stream');
      throw error;
    }
  }, [dispatch]);

  const handleEndStream = useCallback(async (roomId: string) => {
    try {
      await dispatch(endStream(roomId)).unwrap();
      toast.success('Stream ended successfully!');
    } catch (error) {
      toast.error('Failed to end stream');
    }
  }, [dispatch]);

  // Chat handlers
  const handleConversationSelect = useCallback(async (conversation: any) => {
    try {
      dispatch(setCurrentConversation(conversation));
      await dispatch(fetchMessages(conversation._id)).unwrap();
      await dispatch(markConversationAsRead(conversation._id)).unwrap();
      router.push(`/chat/${conversation._id}`);
    } catch (error) {
      toast.error('Failed to load conversation');
    }
  }, [dispatch, router]);

  const handleSendMessage = useCallback(async (content: string, type?: string, replyToId?: string) => {
    if (!currentConversation || !content.trim()) return;

    const messageData: SendMessageDto = {
      content: content.trim(),
      conversationId: currentConversation._id,
      type,
      replyToId,
    };

    try {
      await dispatch(sendMessage(messageData)).unwrap();
      setMessageInput('');
      conversationSocket.stopTyping();
    } catch (error) {
      toast.error('Failed to send message');
    }
  }, [dispatch, currentConversation, conversationSocket]);

  const handleStartChat = useCallback(async (userId: string) => {
    try {
      const conversation = await dispatch(getOrCreateConversationWithUser(userId)).unwrap();
      router.push(`/chat/${conversation._id}`);
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  }, [dispatch, router]);

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    
    try {
      await dispatch(deleteConversation(conversationId)).unwrap();
      if (currentConversation && currentConversation._id === conversationId) {
        dispatch(setCurrentConversation(null));
        router.push('/chat');
      }
      toast.success('Conversation deleted!');
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  }, [dispatch, currentConversation, router]);

  // Typing handlers
  const handleTyping = useCallback(() => {
    conversationSocket.startTyping();
  }, [conversationSocket]);

  const handleStopTyping = useCallback(() => {
    conversationSocket.stopTyping();
  }, [conversationSocket]);

  // Filter handlers
  const handleFilterChange = useCallback((newFilters: any) => {
    dispatch(setFilters(newFilters));
  }, [dispatch]);

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
    setSearchQuery('');
  }, [dispatch]);

  // Component data
  const containerProps = {
    // State
    currentView,
    isAuthenticated,
    user,
    isConnected,
    
    // Room data
    rooms,
    trendingRooms,
    currentRoom,
    roomMembers,
    selectedRoom,
    streaming,
    roomLoading,
    roomError,
    filters,
    
    // Chat data
    conversations,
    currentConversation,
    currentMessages,
    currentTypingUsers,
    messageLoading,
    messageSending,
    messageError,
    totalUnreadCount,
    
    // UI state
    searchQuery,
    messageInput,
    showCreateRoomModal,
    showRoomSettingsModal,
    
    // Handlers
    onViewChange: handleViewChange,
    onRoomSelect: handleRoomSelect,
    onCreateRoom: handleCreateRoom,
    onUpdateRoom: handleUpdateRoom,
    onDeleteRoom: handleDeleteRoom,
    onJoinRoom: handleJoinRoom,
    onLeaveRoom: handleLeaveRoom,
    onFollowRoom: handleFollowRoom,
    onUnfollowRoom: handleUnfollowRoom,
    onStartStream: handleStartStream,
    onEndStream: handleEndStream,
    
    onConversationSelect: handleConversationSelect,
    onSendMessage: handleSendMessage,
    onStartChat: handleStartChat,
    onDeleteConversation: handleDeleteConversation,
    onTyping: handleTyping,
    onStopTyping: handleStopTyping,
    
    onSearchChange: setSearchQuery,
    onMessageInputChange: setMessageInput,
    onFilterChange: handleFilterChange,
    onClearFilters: handleClearFilters,
    
    onShowCreateRoom: () => setShowCreateRoomModal(true),
    onHideCreateRoom: () => setShowCreateRoomModal(false),
    onShowRoomSettings: () => setShowRoomSettingsModal(true),
    onHideRoomSettings: () => setShowRoomSettingsModal(false),
  };

  // For now, return a placeholder since the actual UI components are not implemented
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          {(['rooms', 'chat', 'trending'] as const).map((view) => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              className={`flex-1 py-3 px-4 text-sm font-medium capitalize ${
                currentView === view
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {view}
              {view === 'chat' && totalUnreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {totalUnreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder={`Search ${currentView}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {currentView === 'rooms' && (
            <div className="p-4">
              <div className="mb-4">
                <button
                  onClick={() => setShowCreateRoomModal(true)}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Room
                </button>
              </div>
              
              {roomLoading ? (
                <div className="text-center py-4">Loading rooms...</div>
              ) : (
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <div
                      key={room._id}
                      onClick={() => handleRoomSelect(room._id)}
                      className={`p-3 rounded-lg cursor-pointer border ${
                        selectedRoom === room._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{room.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full text-white ${
                            room.status === 'live' ? 'bg-red-500' : 'bg-gray-500'
                          }`}
                        >
                          {room.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>{room.viewers} viewers</span>
                        <span>{room.owner.username}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentView === 'chat' && (
            <div className="p-4">
              {messageLoading ? (
                <div className="text-center py-4">Loading conversations...</div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation._id}
                      onClick={() => handleConversationSelect(conversation)}
                      className={`p-3 rounded-lg cursor-pointer border ${
                        currentConversation?._id === conversation._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                          {conversation.name || 'Direct Message'}
                        </h3>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentView === 'trending' && (
            <div className="p-4">
              {roomLoading ? (
                <div className="text-center py-4">Loading trending rooms...</div>
              ) : (
                <div className="space-y-2">
                  {trendingRooms.map((room) => (
                    <div
                      key={room._id}
                      onClick={() => handleRoomSelect(room._id)}
                      className="p-3 rounded-lg cursor-pointer border border-gray-200 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{room.name}</h3>
                        <span className="text-red-500 text-sm font-medium">
                          🔥 {room.viewers}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Current Room/Chat Header */}
        {(currentRoom || currentConversation) && (
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentRoom?.name || currentConversation?.name || 'Chat'}
                </h2>
                {currentRoom && (
                  <p className="text-sm text-gray-600">
                    {currentRoom.viewers} viewers • {currentRoom.status}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <span className="text-green-500 text-sm">Connected</span>
                ) : (
                  <span className="text-red-500 text-sm">Disconnected</span>
                )}
                
                {currentRoom && user && currentRoom.owner._id === user._id && (
                  <div className="flex space-x-2">
                    {streaming.isStreaming ? (
                      <button
                        onClick={() => handleEndStream(currentRoom._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        End Stream
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartStream(currentRoom._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Start Stream
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowRoomSettingsModal(true)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Settings
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages/Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentConversation ? (
            <div className="space-y-4">
              {currentMessages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${
                    message.sender._id === user?._id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender._id === user?._id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {currentTypingUsers.length > 0 && (
                <div className="text-sm text-gray-500">
                  Someone is typing...
                </div>
              )}
            </div>
          ) : currentRoom ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900">
                Welcome to {currentRoom.name}
              </h3>
              <p className="text-gray-600 mt-2">{currentRoom.description}</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Select a room or conversation to get started
            </div>
          )}
        </div>

        {/* Message Input */}
        {currentConversation && (
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  handleTyping();
                }}
                onBlur={handleStopTyping}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(messageInput);
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={messageSending}
              />
              <button
                onClick={() => handleSendMessage(messageInput)}
                disabled={messageSending || !messageInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {messageSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals would go here */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Room</h3>
            <p className="text-gray-600 mb-4">Create room form would go here</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateRoomModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle create room
                  setShowCreateRoomModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showRoomSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Room Settings</h3>
            <p className="text-gray-600 mb-4">Room settings form would go here</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowRoomSettingsModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle update room
                  setShowRoomSettingsModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomChatContainer;