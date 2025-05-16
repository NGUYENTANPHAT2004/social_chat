// src/store/types.ts
import { ThunkAction, Action } from '@reduxjs/toolkit';
import { store } from './index';

// Inference type từ store để tái sử dụng
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;