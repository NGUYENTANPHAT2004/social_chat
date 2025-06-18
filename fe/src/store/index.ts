import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import chatReducer from './slices/chatSlice';
import gameReducer from './slices/gameSlice';
import roomReducer from './slices/roomSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    game: gameReducer,
    room: roomReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const rootReducer = {
  auth: authReducer,
  chat: chatReducer,
  game: gameReducer,
  room: roomReducer,
  user: userReducer,
};