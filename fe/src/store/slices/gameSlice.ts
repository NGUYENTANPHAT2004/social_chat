import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GameState, Game, GameSession as BaseGameSession, PlaceBetDto, ApiResponse, PaginatedResponse } from '@/types';
import { API_ENDPOINTS } from '@/constants';
import api from '@/services/api';

// Extend GameSession to include newBalance
interface GameSession extends BaseGameSession {
  newBalance?: number;
}

const initialState: GameState = {
  games: [],
  popularGames: [],
  currentGame: null,
  currentSession: null,
  history: [],
  balance: 0,
  currentBet: 0,
  loading: false,
  error: null,
};

// Async thunks
export const fetchGames = createAsyncThunk(
  'game/fetchGames',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<PaginatedResponse<Game>>>(API_ENDPOINTS.GAMES);
      return response.data.data.items || response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch games');
    }
  }
);

export const fetchPopularGames = createAsyncThunk(
  'game/fetchPopularGames',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<PaginatedResponse<Game>>>(`${API_ENDPOINTS.GAMES}?sort=playCount&order=desc&limit=5`);
      return response.data.data.items || response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch popular games');
    }
  }
);

export const fetchGameById = createAsyncThunk(
  'game/fetchGameById',
  async (gameId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<Game>>(API_ENDPOINTS.GAME_BY_ID(gameId));
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch game');
    }
  }
);

export const fetchGameHistory = createAsyncThunk(
  'game/fetchGameHistory',
  async (params: { gameId?: string; userId?: string; page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.gameId) queryParams.append('gameId', params.gameId);
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      const response = await api.get<ApiResponse<PaginatedResponse<GameSession>>>(`/games/history?${queryParams.toString()}`);
      return response.data.data.items || response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch game history');
    }
  }
);

export const placeBet = createAsyncThunk(
  'game/placeBet',
  async ({ gameId, betData }: { gameId: string; betData: PlaceBetDto }, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<GameSession>>(API_ENDPOINTS.PLACE_BET(gameId), betData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to place bet');
    }
  }
);

export const playDailySpin = createAsyncThunk(
  'game/playDailySpin',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<GameSession>>('/games/daily-spin/play');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to play daily spin');
    }
  }
);

export const getDailySpinStatus = createAsyncThunk(
  'game/getDailySpinStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<{ canPlay: boolean; nextPlayTime?: string }>>('/games/daily-spin/status');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get daily spin status');
    }
  }
);

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setCurrentGame: (state, action: PayloadAction<Game>) => {
      state.currentGame = action.payload;
    },
    clearCurrentGame: (state) => {
      state.currentGame = null;
      state.currentSession = null;
    },
    setCurrentBet: (state, action: PayloadAction<number>) => {
      state.currentBet = action.payload;
    },
    updateBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    addToHistory: (state, action: PayloadAction<GameSession>) => {
      state.history.unshift(action.payload);
      // Keep only last 50 sessions
      if (state.history.length > 50) {
        state.history = state.history.slice(0, 50);
      }
    },
    updateGameSession: (state, action: PayloadAction<Partial<GameSession>>) => {
      if (state.currentSession) {
        state.currentSession = { ...state.currentSession, ...action.payload };
      }
    },
    incrementGamePlayCount: (state, action: PayloadAction<string>) => {
      const gameId = action.payload;
      const game = state.games.find(g => g.id === gameId);
      if (game) {
        game.playCount += 1;
      }
      if (state.currentGame?.id === gameId) {
        state.currentGame.playCount += 1;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    resetGameState: (state) => {
      state.currentGame = null;
      state.currentSession = null;
      state.currentBet = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch games
      .addCase(fetchGames.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGames.fulfilled, (state, action) => {
        state.loading = false;
        state.games = action.payload;
      })
      .addCase(fetchGames.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch popular games
      .addCase(fetchPopularGames.fulfilled, (state, action) => {
        state.popularGames = action.payload;
      })
      
      // Fetch game by ID
      .addCase(fetchGameById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGameById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGame = action.payload;
      })
      .addCase(fetchGameById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch game history
      .addCase(fetchGameHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })
      
      // Place bet
      .addCase(placeBet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeBet.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = action.payload;
        state.balance = action.payload.newBalance || state.balance;
      })
      .addCase(placeBet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Daily spin
      .addCase(playDailySpin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(playDailySpin.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.newBalance || state.balance;
        // Add to history
        state.history.unshift(action.payload);
      })
      .addCase(playDailySpin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentGame,
  clearCurrentGame,
  setCurrentBet,
  updateBalance,
  addToHistory,
  updateGameSession,
  incrementGamePlayCount,
  clearError,
  resetGameState,
} = gameSlice.actions;

export default gameSlice.reducer;