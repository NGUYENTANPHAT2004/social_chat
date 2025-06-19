// src/hooks/useRoom.ts
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
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
  setCurrentRoom,
  clearError,
} from '@/store/slices/roomSlice';
import { CreateRoomDto, UpdateRoomDto, RoomQueryParams } from '@/services/room.service';
import { useAuth } from '@/features/auth/context/AuthContext';

// Hook for general room operations
export const useRoom = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const roomState = useSelector((state: RootState) => state.room);

  const {
    rooms,
    trendingRooms,
    currentRoom,
    roomMembers,
    loading,
    error,
    filters,
    pagination,
    streaming,
  } = roomState;

  // Actions
  const getRooms = useCallback((params?: RoomQueryParams) => {
    return dispatch(fetchRooms(params));
  }, [dispatch]);

  const getTrendingRooms = useCallback((params?: RoomQueryParams) => {
    return dispatch(fetchTrendingRooms(params));
  }, [dispatch]);

  const getRoomById = useCallback((id: string) => {
    return dispatch(fetchRoomById(id));
  }, [dispatch]);

  const createNewRoom = useCallback(async (data: CreateRoomDto) => {
    try {
      const result = await dispatch(createRoom(data)).unwrap();
      toast.success('Room created successfully!');
      return result;
    } catch (error: any) {
      toast.error(error || 'Failed to create room');
      throw error;
    }
  }, [dispatch]);

  const updateRoomData = useCallback(async (id: string, data: UpdateRoomDto) => {
    try {
      const result = await dispatch(updateRoom({ id, data })).unwrap();
      toast.success('Room updated successfully!');
      return result;
    } catch (error: any) {
      toast.error(error || 'Failed to update room');
      throw error;
    }
  }, [dispatch]);

  const deleteRoomById = useCallback(async (id: string) => {
    try {
      await dispatch(deleteRoom(id)).unwrap();
      toast.success('Room deleted successfully!');
    } catch (error: any) {
      toast.error(error || 'Failed to delete room');
      throw error;
    }
  }, [dispatch]);

  const joinRoomById = useCallback(async (id: string, password?: string) => {
    try {
      const result = await dispatch(joinRoom({ id, password })).unwrap();
      toast.success('Joined room successfully!');
      return result;
    } catch (error: any) {
      toast.error(error || 'Failed to join room');
      throw error;
    }
  }, [dispatch]);

  const leaveRoomById = useCallback(async (id: string) => {
    try {
      await dispatch(leaveRoom(id)).unwrap();
      toast.success('Left room successfully!');
    } catch (error: any) {
      toast.error(error || 'Failed to leave room');
      throw error;
    }
  }, [dispatch]);

  const followRoomById = useCallback(async (id: string) => {
    try {
      await dispatch(followRoom(id)).unwrap();
      toast.success('Following room!');
    } catch (error: any) {
      toast.error(error || 'Failed to follow room');
      throw error;
    }
  }, [dispatch]);

  const unfollowRoomById = useCallback(async (id: string) => {
    try {
      await dispatch(unfollowRoom(id)).unwrap();
      toast.success('Unfollowed room!');
    } catch (error: any) {
      toast.error(error || 'Failed to unfollow room');
      throw error;
    }
  }, [dispatch]);

  const getRoomMembers = useCallback((id: string) => {
    return dispatch(fetchRoomMembers(id));
  }, [dispatch]);

  const startRoomStream = useCallback(async (id: string) => {
    try {
      const result = await dispatch(startStream(id)).unwrap();
      toast.success('Stream started successfully!');
      return result;
    } catch (error: any) {
      toast.error(error || 'Failed to start stream');
      throw error;
    }
  }, [dispatch]);

  const endRoomStream = useCallback(async (id: string) => {
    try {
      await dispatch(endStream(id)).unwrap();
      toast.success('Stream ended successfully!');
    } catch (error: any) {
      toast.error(error || 'Failed to end stream');
      throw error;
    }
  }, [dispatch]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    dispatch(setFilters(newFilters));
  }, [dispatch, filters]);

  const resetFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const selectRoom = useCallback((room: any) => {
    dispatch(setCurrentRoom(room));
  }, [dispatch]);

  const clearRoomError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Computed values
  const isRoomOwner = useMemo(() => {
    return currentRoom && user && currentRoom.owner._id === user._id;
  }, [currentRoom, user]);

  const isRoomMember = useMemo(() => {
    return currentRoom && user && currentRoom.members.includes(user._id);
  }, [currentRoom, user]);

  const isRoomFollower = useMemo(() => {
    return currentRoom && user && currentRoom.followers.includes(user._id);
  }, [currentRoom, user]);

  const canJoinRoom = useMemo(() => {
    if (!currentRoom || !user) return false;
    return user.kcBalance >= currentRoom.settings.minKCToJoin;
  }, [currentRoom, user]);

  const canStartStream = useMemo(() => {
    return isRoomOwner && !streaming.isStreaming;
  }, [isRoomOwner, streaming.isStreaming]);

  const canEndStream = useMemo(() => {
    return isRoomOwner && streaming.isStreaming;
  }, [isRoomOwner, streaming.isStreaming]);

  return {
    // State
    rooms,
    trendingRooms,
    currentRoom,
    roomMembers,
    loading,
    error,
    filters,
    pagination,
    streaming,
    
    // Actions
    getRooms,
    getTrendingRooms,
    getRoomById,
    createNewRoom,
    updateRoomData,
    deleteRoomById,
    joinRoomById,
    leaveRoomById,
    followRoomById,
    unfollowRoomById,
    getRoomMembers,
    startRoomStream,
    endRoomStream,
    updateFilters,
    resetFilters,
    selectRoom,
    clearRoomError,
    
    // Computed
    isRoomOwner,
    isRoomMember,
    isRoomFollower,
    canJoinRoom,
    canStartStream,
    canEndStream,
  };
};

// Hook for specific room operations
export const useRoomDetail = (roomId?: string) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useAuth();
  const roomHook = useRoom();

  const { currentRoom, roomMembers, loading, error } = roomHook;

  // Load room data when roomId changes
  useEffect(() => {
    if (roomId) {
      dispatch(fetchRoomById(roomId));
      dispatch(fetchRoomMembers(roomId));
    }
  }, [dispatch, roomId]);

  // Navigation helpers
  const navigateToRoom = useCallback((id: string) => {
    router.push(`/rooms/${id}`);
  }, [router]);

  const navigateToRooms = useCallback(() => {
    router.push('/rooms');
  }, [router]);

  // Room-specific actions
  const handleJoinRoom = useCallback(async (password?: string) => {
    if (!roomId) return;
    
    try {
      await roomHook.joinRoomById(roomId, password);
      // Refresh room data after joining
      dispatch(fetchRoomById(roomId));
      dispatch(fetchRoomMembers(roomId));
    } catch (error) {
      // Error already handled in useRoom hook
    }
  }, [roomId, roomHook, dispatch]);

  const handleLeaveRoom = useCallback(async () => {
    if (!roomId) return;
    
    try {
      await roomHook.leaveRoomById(roomId);
      // Refresh room data after leaving
      dispatch(fetchRoomById(roomId));
      dispatch(fetchRoomMembers(roomId));
    } catch (error) {
      // Error already handled in useRoom hook
    }
  }, [roomId, roomHook, dispatch]);

  const handleFollowRoom = useCallback(async () => {
    if (!roomId) return;
    
    try {
      await roomHook.followRoomById(roomId);
      // Refresh room data after following
      dispatch(fetchRoomById(roomId));
    } catch (error) {
      // Error already handled in useRoom hook
    }
  }, [roomId, roomHook, dispatch]);

  const handleUnfollowRoom = useCallback(async () => {
    if (!roomId) return;
    
    try {
      await roomHook.unfollowRoomById(roomId);
      // Refresh room data after unfollowing
      dispatch(fetchRoomById(roomId));
    } catch (error) {
      // Error already handled in useRoom hook
    }
  }, [roomId, roomHook, dispatch]);

  const handleUpdateRoom = useCallback(async (data: UpdateRoomDto) => {
    if (!roomId) return;
    
    try {
      await roomHook.updateRoomData(roomId, data);
      // Refresh room data after updating
      dispatch(fetchRoomById(roomId));
    } catch (error) {
      // Error already handled in useRoom hook
    }
  }, [roomId, roomHook, dispatch]);

  const handleDeleteRoom = useCallback(async () => {
    if (!roomId) return;
    
    if (!confirm('Are you sure you want to delete this room?')) return;
    
    try {
      await roomHook.deleteRoomById(roomId);
      navigateToRooms();
    } catch (error) {
      // Error already handled in useRoom hook
    }
  }, [roomId, roomHook, navigateToRooms]);

  const handleStartStream = useCallback(async () => {
    if (!roomId) return;
    
    try {
      const result = await roomHook.startRoomStream(roomId);
      return result;
    } catch (error) {
      // Error already handled in useRoom hook
      throw error;
    }
  }, [roomId, roomHook]);

  const handleEndStream = useCallback(async () => {
    if (!roomId) return;
    
    try {
      await roomHook.endRoomStream(roomId);
    } catch (error) {
      // Error already handled in useRoom hook
    }
  }, [roomId, roomHook]);

  // Computed values specific to this room
  const isCurrentRoom = useMemo(() => {
    return currentRoom && currentRoom._id === roomId;
  }, [currentRoom, roomId]);

  const roomExists = useMemo(() => {
    return !!currentRoom && isCurrentRoom;
  }, [currentRoom, isCurrentRoom]);

  const canModifyRoom = useMemo(() => {
    return roomExists && roomHook.isRoomOwner;
  }, [roomExists, roomHook.isRoomOwner]);

  const needsPassword = useMemo(() => {
    return currentRoom && currentRoom.type === 'password' && !roomHook.isRoomMember;
  }, [currentRoom, roomHook.isRoomMember]);

  return {
    // State
    room: currentRoom,
    members: roomMembers,
    loading,
    error,
    
    // Computed
    isCurrentRoom,
    roomExists,
    canModifyRoom,
    needsPassword,
    isOwner: roomHook.isRoomOwner,
    isMember: roomHook.isRoomMember,
    isFollower: roomHook.isRoomFollower,
    canJoin: roomHook.canJoinRoom,
    canStartStream: roomHook.canStartStream,
    canEndStream: roomHook.canEndStream,
    
    // Actions
    handleJoinRoom,
    handleLeaveRoom,
    handleFollowRoom,
    handleUnfollowRoom,
    handleUpdateRoom,
    handleDeleteRoom,
    handleStartStream,
    handleEndStream,
    
    // Navigation
    navigateToRoom,
    navigateToRooms,
  };
};

// Hook for room creation
export const useRoomCreation = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { createNewRoom } = useRoom();

  const [isCreating, setIsCreating] = useState(false);

  const createRoom = useCallback(async (data: CreateRoomDto) => {
    setIsCreating(true);
    try {
      const room = await createNewRoom(data);
      router.push(`/rooms/${room._id}`);
      return room;
    } finally {
      setIsCreating(false);
    }
  }, [createNewRoom, router]);

  return {
    isCreating,
    createRoom,
  };
};

// Hook for room list management
export const useRoomList = (type: 'all' | 'trending' | 'my' = 'all') => {
  const dispatch = useDispatch();
  const {
    rooms,
    trendingRooms,
    myRooms,
    loading,
    error,
    filters,
    pagination,
    getRooms,
    getTrendingRooms,
    updateFilters,
    resetFilters,
  } = useRoom();

  // Get the appropriate room list based on type
  const roomList = useMemo(() => {
    switch (type) {
      case 'trending':
        return trendingRooms;
      case 'my':
        return myRooms;
      default:
        return rooms;
    }
  }, [type, rooms, trendingRooms, myRooms]);

  // Get the appropriate pagination based on type
  const currentPagination = useMemo(() => {
    switch (type) {
      case 'trending':
        return pagination.trending;
      default:
        return pagination.rooms;
    }
  }, [type, pagination]);

  // Load rooms based on type
  const loadRooms = useCallback((params?: RoomQueryParams) => {
    switch (type) {
      case 'trending':
        return getTrendingRooms(params);
      default:
        return getRooms(params);
    }
  }, [type, getRooms, getTrendingRooms]);

  // Load more rooms (pagination)
  const loadMore = useCallback(() => {
    if (currentPagination.hasMore && !loading) {
      loadRooms({
        page: currentPagination.page + 1,
      });
    }
  }, [currentPagination, loading, loadRooms]);

  // Refresh room list
  const refresh = useCallback(() => {
    loadRooms({ page: 1 });
  }, [loadRooms]);

  // Initialize
  useEffect(() => {
    loadRooms();
  }, [type]); // Don't include loadRooms in deps to avoid infinite loop

  return {
    rooms: roomList,
    loading,
    error,
    filters,
    pagination: currentPagination,
    loadRooms,
    loadMore,
    refresh,
    updateFilters,
    resetFilters,
  };
};