// be/src/config/games.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('games', () => ({
  enabled: process.env.ENABLE_GAMES === 'true',
  liveEvents: {
    enabled: process.env.ENABLE_LIVE_EVENTS === 'true',
    scheduledCheckInterval: 60 * 1000, // 1 minute
  },
  rewards: {
    bonusMultiplierForVip: 1.5,
    minKCReward: 1,
    maxKCReward: 1000,
  },
  lucky: {
    minBet: 10, // KC
    maxBet: 1000, // KC
    winChance: 0.4, // 40% chance of winning
    minMultiplier: 1.5,
    maxMultiplier: 3.0,
  },
  lucky7: {
    minBet: 10, // KC
    maxBet: 500, // KC
    patterns: {
      three7s: {
        multiplier: 7.0,
        chance: 0.01, // 1%
      },
      threeOfAKind: {
        multiplier: 3.0,
        chance: 0.03, // 3%
      },
      straight: {
        multiplier: 2.0,
        chance: 0.05, // 5%
      },
    },
  },
  coinflip: {
    minBet: 5, // KC
    maxBet: 200, // KC
    winMultiplier: 1.95,
  },
  dailySpin: {
    freeSpinsPerDay: 3,
    premiumSpinCost: 50, // KC
    rewards: [
      { type: 'kc', amount: 5, chance: 0.3 },
      { type: 'kc', amount: 10, chance: 0.2 },
      { type: 'kc', amount: 20, chance: 0.1 },
      { type: 'kc', amount: 50, chance: 0.05 },
      { type: 'kc', amount: 100, chance: 0.01 },
      { type: 'gift', id: 'gift_1', chance: 0.2 },
      { type: 'gift', id: 'gift_2', chance: 0.1 },
      { type: 'badge', id: 'badge_1', chance: 0.04 },
    ],
  },
}));