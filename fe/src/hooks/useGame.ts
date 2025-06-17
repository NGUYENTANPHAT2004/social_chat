import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchGameById, placeBet } from '@/store/slices/gameSlice';
import { useSocket } from './useSocket';

interface UseGameProps {
  gameId: string;
}

export const useGame = ({ gameId }: UseGameProps) => {
  const dispatch = useAppDispatch();
  const socket = useSocket();
  const { currentGame, loading, error } = useAppSelector((state) => state.game);
  
  const [gameState, setGameState] = useState({
    isPlaying: false,
    result: null,
    winAmount: 0,
  });

  useEffect(() => {
    if (gameId) {
      dispatch(fetchGameById(gameId));
      socket.joinGame(gameId);
    }

    // Listen for game events
    socket.onGameResult((result) => {
      setGameState({
        isPlaying: false,
        result: result.result,
        winAmount: result.winAmount || 0,
      });
    });

    return () => {
      socket.off('gameResult');
    };
  }, [gameId, dispatch, socket]);

  const playGame = useCallback(async (betData: any) => {
    setGameState(prev => ({ ...prev, isPlaying: true }));
    
    try {
      await dispatch(placeBet({ gameId, betData }));
    } catch (error) {
      setGameState(prev => ({ ...prev, isPlaying: false }));
      throw error;
    }
  }, [gameId, dispatch]);

  return {
    game: currentGame,
    gameState,
    playGame,
    loading,
    error,
  };
};
