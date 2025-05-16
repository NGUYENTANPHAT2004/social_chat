import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GameState, Game, GameSession, PlaceBetDto } from '@/types';
import { API_ENDPOINTS } from '@/constants';
import api from '@/services/api';

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
      const response = await api.get(API_ENDPOINTS.GAMES);
      return response.data.data.items;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch games');
    }
  }
);

export const fetchPopularGames = createAsyncThunk(
  'game/fetchPopularGames',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.GAMES}?sort=players&limit=5`);
      return response.data.data.items;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch popular games');
    }
  }
);

export const fetchGameById = createAsyncThunk(
  'game/fetchGameById',
  async (gameId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ENDPOINTS.GAME_BY_ID(gameId));
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch game');
    }
  }
);

export const fetchGameHistory = createAsyncThunk(
  'game/fetchGameHistory',
  async (gameId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.GAME_BY_ID(gameId)}/history`);
      return response.data.data.items;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch game history');
    }
  }
);

export const placeBet = createAsyncThunk(
  'game/placeBet',
  async ({ gameId, betData }: { gameId: string; betData: PlaceBetDto }, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ENDPOINTS.PLACE_BET(gameId), betData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to place bet');
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
    
    setCurrentSession: (state, action: PayloadAction<GameSession>) => {
      state.currentSession = action.payload;
    },
    
    clearCurrentSession: (state) => {
      state.currentSession = null;
    },
    
    setCurrentBet: (state, action: PayloadAction<number>) => {
      state.currentBet = action.payload;
    },
    
    setBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    
    incrementActivePlayerCount: (state, action: PayloadAction<string>) => {
      const gameId = action.payload;
      
      // Find game in all lists and increment active player count
      const gameIndex = state.games.findIndex(game => game.id === gameId);
      if (gameIndex !== -1 && state.games[gameIndex].activePlayers !== undefined) {
        state.games[gameIndex].activePlayers! += 1;
      }
      
      const popularGameIndex = state.popularGames.findIndex(game => game.id === gameId);
      if (popularGameIndex !== -1 && state.popularGames[popularGameIndex].activePlayers !== undefined) {
        state.popularGames[popularGameIndex].activePlayers! += 1;
      }
      
      // Update current game if it's the same
      if (state.currentGame && state.currentGame.id === gameId && state.currentGame.activePlayers !== undefined) {
        state.currentGame.activePlayers! += 1;
      }
    },
    
    decrementActivePlayerCount: (state, action: PayloadAction<string>) => {
      const gameId = action.payload;
      
      // Find game in all lists and decrement active player count
      const gameIndex = state.games.findIndex(game => game.id === gameId);
      if (gameIndex !== -1 && state.games[gameIndex].activePlayers !== undefined && state.games[gameIndex].activePlayers! > 0) {
        state.games[gameIndex].activePlayers! -= 1;
      }
      
      const popularGameIndex = state.popularGames.findIndex(game => game.id === gameId);
      if (popularGameIndex !== -1 && state.popularGames[popularGameIndex].activePlayers !== undefined && state.popularGames[popularGameIndex].activePlayers! > 0) {
        state.popularGames[popularGameIndex].activePlayers! -= 1;
      }
      
      // Update current game if it's the same
      if (state.currentGame && state.currentGame.id === gameId && state.currentGame.activePlayers !== undefined && state.currentGame.activePlayers! > 0) {
        state.currentGame.activePlayers! -= 1;
      }
    },
    
    addGameResult: (state, action: PayloadAction<GameSession>) => {
      const gameSession = action.payload;
      
      // Add to history if not already there
      if (!state.history.some(session => session.id === gameSession.id)) {
        // Keep only the 10 most recent game sessions
        if (state.history.length >= 10) {
          state.history.pop();
        }
        
        state.history.unshift(gameSession);
      }
      
      // Update current session if it's the same
      if (state.currentSession && state.currentSession.id === gameSession.id) {
        state.currentSession = gameSession;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch games cases
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
      
      // Fetch popular games cases
      .addCase(fetchPopularGames.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPopularGames.fulfilled, (state, action) => {
        state.loading = false;
        state.popularGames = action.payload;
      })
      .addCase(fetchPopularGames.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch game by id cases
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
      
      // Fetch game history cases
      .addCase(fetchGameHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGameHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchGameHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Place bet cases
      .addCase(placeBet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeBet.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update session if returned
        if (action.payload.sessionId) {
          // This action might return a full session or just the ID, handle both cases
          if (typeof action.payload.sessionId === 'string') {
            // We only have the ID, we'll need to fetch the full session later
            state.currentSession = state.currentSession;
          } else {
            // We have the full session object
            state.currentSession = action.payload.sessionId as unknown as GameSession;
          }
        }
        
        // Update balance
        if (action.payload.newBalance !== undefined) {
          state.balance = action.payload.newBalance;
        }
        
        // Reset current bet after placing a bet
        state.currentBet = 0;
      })
      .addCase(placeBet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setCurrentGame, 
  clearCurrentGame, 
  setCurrentSession, 
  clearCurrentSession, 
  setCurrentBet, 
  setBalance,
  incrementActivePlayerCount,
  decrementActivePlayerCount,
  addGameResult
} = gameSlice.actions;

export default gameSlice.reducer;