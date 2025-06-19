import { GameResult, GameStatus, GameType } from "./enums";

export interface Game {
  _id: string;
  name: string;
  description: string;
  type: GameType;
  status: GameStatus;
  image: string;
  minBet: number;
  maxBet: number;
  winRate: number;
  multiplier: number;
  config: Record<string, unknown>;
  playCount: number;
  totalKCWon: number;
  totalKCBet: number;
  totalWinners: number;
  totalLosers: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GamePlay {
  _id: string;
  player: string;
  game: string;
  betAmount: number;
  result: GameResult;
  kcAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  gameData: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}