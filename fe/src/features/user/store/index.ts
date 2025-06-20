import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  User,
  UserStats,
  UserState,
  UserActions,
  UserError,
} from '../type';

// Initial state
const initialState: UserState = {
  currentUser: null,
  users: {},
  searchResults: [],
  followers: {},
  following: {},
  stats: {},
  isLoading: false,
  error: null,
};

// Store interface
interface UserStore extends UserState, UserActions {}

/**
 * User Store - Quản lý state cho users
 */
export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      immer((set) => ({
        // State
        ...initialState,

        // Actions - User management
        setCurrentUser: (user: User | null) =>
          set((state) => {
            state.currentUser = user;
            if (user) {
              state.users[user.id] = user;
            }
          }),

        updateCurrentUser: (updates: Partial<User>) =>
          set((state) => {
            if (state.currentUser) {
              Object.assign(state.currentUser, updates);
              state.users[state.currentUser.id] = { ...state.currentUser };
            }
          }),

        setUser: (user: User) =>
          set((state) => {
            state.users[user.id] = user;
          }),

        setUsers: (users: User[]) =>
          set((state) => {
            users.forEach((user) => {
              state.users[user.id] = user;
            });
          }),

        removeUser: (userId: string) =>
          set((state) => {
            delete state.users[userId];
            delete state.followers[userId];
            delete state.following[userId];
            delete state.stats[userId];
          }),

        // Actions - Search
        setSearchResults: (users: User[]) =>
          set((state) => {
            state.searchResults = users;
            // Also add to users cache
            users.forEach((user) => {
              state.users[user.id] = user;
            });
          }),

        clearSearchResults: () =>
          set((state) => {
            state.searchResults = [];
          }),

        // Actions - Follow/Following
        setFollowers: (userId: string, followers: User[]) =>
          set((state) => {
            state.followers[userId] = followers;
            // Add to users cache
            followers.forEach((user) => {
              state.users[user.id] = user;
            });
          }),

        setFollowing: (userId: string, following: User[]) =>
          set((state) => {
            state.following[userId] = following;
            // Add to users cache
            following.forEach((user) => {
              state.users[user.id] = user;
            });
          }),

        addFollower: (userId: string, follower: User) =>
          set((state) => {
            if (!state.followers[userId]) {
              state.followers[userId] = [];
            }
            const existingIndex = state.followers[userId].findIndex(
              (f) => f.id === follower.id
            );
            if (existingIndex === -1) {
              state.followers[userId].push(follower);
              state.users[follower.id] = follower;
            }
          }),

        removeFollower: (userId: string, followerId: string) =>
          set((state) => {
            if (state.followers[userId]) {
              state.followers[userId] = state.followers[userId].filter(
                (f) => f.id !== followerId
              );
            }
          }),

        addFollowing: (userId: string, following: User) =>
          set((state) => {
            if (!state.following[userId]) {
              state.following[userId] = [];
            }
            const existingIndex = state.following[userId].findIndex(
              (f) => f.id === following.id
            );
            if (existingIndex === -1) {
              state.following[userId].push(following);
              state.users[following.id] = following;
            }
          }),

        removeFollowing: (userId: string, followingId: string) =>
          set((state) => {
            if (state.following[userId]) {
              state.following[userId] = state.following[userId].filter(
                (f) => f.id !== followingId
              );
            }
          }),

        // Actions - Stats
        setUserStats: (userId: string, stats: UserStats) =>
          set((state) => {
            state.stats[userId] = stats;
          }),

        // Actions - Loading & Error states
        setLoading: (loading: boolean) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setError: (error: UserError | null) =>
          set((state) => {
            state.error = error;
          }),

        clearError: () =>
          set((state) => {
            state.error = null;
          }),

        // Actions - Reset
        reset: () =>
          set((state) => {
            Object.assign(state, initialState);
          }),
      })),
      {
        name: 'user-store',
        // Only persist essential user data
        partialize: (state) => ({
          currentUser: state.currentUser,
          users: state.users,
        }),
      }
    ),
    {
      name: 'user-store',
    }
  )
);

/**
 * Selector hooks for easier access to specific parts of state
 */

// Current user
export const useCurrentUser = () => useUserStore((state) => state.currentUser);

// Users
export const useUsers = () => useUserStore((state) => state.users);

export const useUserById = (id: string) =>
  useUserStore((state) => state.users[id]);

// Search
export const useSearchResults = () => useUserStore((state) => state.searchResults);

// Follow/Following
export const useFollowers = (userId: string) =>
  useUserStore((state) => state.followers[userId] || []);

export const useFollowing = (userId: string) =>
  useUserStore((state) => state.following[userId] || []);

// Stats
export const useUserStats = (userId: string) =>
  useUserStore((state) => state.stats[userId]);

// Loading & Error
export const useUserLoading = () => useUserStore((state) => state.isLoading);

export const useUserError = () => useUserStore((state) => state.error);

// Actions
export const useUserActions = () =>
  useUserStore((state) => ({
    setCurrentUser: state.setCurrentUser,
    updateCurrentUser: state.updateCurrentUser,
    setUser: state.setUser,
    setUsers: state.setUsers,
    removeUser: state.removeUser,
    setSearchResults: state.setSearchResults,
    clearSearchResults: state.clearSearchResults,
    setFollowers: state.setFollowers,
    setFollowing: state.setFollowing,
    addFollower: state.addFollower,
    removeFollower: state.removeFollower,
    addFollowing: state.addFollowing,
    removeFollowing: state.removeFollowing,
    setUserStats: state.setUserStats,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
    reset: state.reset,
  }));

/**
 * Computed selectors
 */

// Check if current user is following a specific user
export const useIsCurrentUserFollowing = (userId: string) =>
  useUserStore((state) => {
    if (!state.currentUser || !userId) return false;
    return state.currentUser.following.includes(userId);
  });

// Get follower count for a user
export const useFollowerCount = (userId: string) =>
  useUserStore((state) => {
    const user = state.users[userId];
    if (user) return user.followers.length;
    
    const followers = state.followers[userId];
    return followers ? followers.length : 0;
  });

// Get following count for a user
export const useFollowingCount = (userId: string) =>
  useUserStore((state) => {
    const user = state.users[userId];
    if (user) return user.following.length;
    
    const following = state.following[userId];
    return following ? following.length : 0;
  });

// Check if current user can perform admin actions
export const useCanPerformAdminActions = () =>
  useUserStore((state) => {
    if (!state.currentUser) return false;
    return ['admin', 'moderator'].includes(state.currentUser.role);
  });

// Get users by status
export const useUsersByStatus = (status: string) =>
  useUserStore((state) => {
    return Object.values(state.users).filter((user) => user.status === status);
  });

// Get users by role
export const useUsersByRole = (role: string) =>
  useUserStore((state) => {
    return Object.values(state.users).filter((user) => user.role === role);
  });

/**
 * Complex operations that combine multiple actions
 */
export const useUserOperations = () => {
  const actions = useUserActions();
  const store = useUserStore;

  const followUser = (targetUserId: string) => {
    const currentUser = store.getState().currentUser;
    if (!currentUser) return;

    // Optimistically update following list
    const updatedCurrentUser = {
      ...currentUser,
      following: [...currentUser.following, targetUserId],
    };
    actions.updateCurrentUser(updatedCurrentUser);

    // Add current user to target's followers
    actions.addFollower(targetUserId, currentUser);
  };

  const unfollowUser = (targetUserId: string) => {
    const currentUser = store.getState().currentUser;
    if (!currentUser) return;

    // Optimistically update following list
    const updatedCurrentUser = {
      ...currentUser,
      following: currentUser.following.filter((id : any) => id !== targetUserId),
    };
    actions.updateCurrentUser(updatedCurrentUser);

    // Remove current user from target's followers
    actions.removeFollower(targetUserId, currentUser.id);
  };

  const updateUserBalance = (userId: string, amount: number) => {
    const user = store.getState().users[userId];
    if (user) {
      const updatedUser = {
        ...user,
        kcBalance: user.kcBalance + amount,
      };
      actions.setUser(updatedUser);

      // If it's current user, update current user too
      if (userId === store.getState().currentUser?.id) {
        actions.setCurrentUser(updatedUser);
      }
    }
  };

  const bulkUpdateUsers = (users: User[]) => {
    actions.setUsers(users);
  };

  return {
    followUser,
    unfollowUser,
    updateUserBalance,
    bulkUpdateUsers,
  };
};

/**
 * Store initialization hook
 */
export const useUserStoreInitialization = () => {
  const actions = useUserActions();

  const initializeStore = () => {
    // Clear any existing data
    actions.reset();
  };

  const hydrateUserData = (userData: { 
    currentUser?: User; 
    users?: User[];
    followers?: Record<string, User[]>;
    following?: Record<string, User[]>;
  }) => {
    if (userData.currentUser) {
      actions.setCurrentUser(userData.currentUser);
    }
    
    if (userData.users) {
      actions.setUsers(userData.users);
    }

    if (userData.followers) {
      Object.entries(userData.followers).forEach(([userId, followers]) => {
        actions.setFollowers(userId, followers);
      });
    }

    if (userData.following) {
      Object.entries(userData.following).forEach(([userId, following]) => {
        actions.setFollowing(userId, following);
      });
    }
  };

  return {
    initializeStore,
    hydrateUserData,
  };
};

// Export store and selectors
export default useUserStore;