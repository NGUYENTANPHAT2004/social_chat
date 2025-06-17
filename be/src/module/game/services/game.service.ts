// modules/game/services/game.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Game, GameDocument, GameType, GameStatus } from '../schemas/game.schema';
import { GamePlay, GamePlayDocument, GameResult } from '../schemas/game-play.schema';
import { PlayGameDto } from '../dto/play-game.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    @InjectModel(GamePlay.name) private gamePlayModel: Model<GamePlayDocument>,
    private configService: ConfigService,
  ) {
    // Khởi tạo các game mặc định nếu chưa có
    this.initDefaultGames();
  }

  private async initDefaultGames() {
    const count = await this.gameModel.countDocuments();
    
    if (count === 0) {
      // Tạo các game mặc định
      await this.gameModel.create([
        {
          name: 'Lucky',
          description: 'Đoán số may mắn từ 1-6',
          type: GameType.LUCKY,
          minBet: 10,
          maxBet: 1000,
          winRate: 40,
          multiplier: 2.5,
          config: {
            minNumber: 1,
            maxNumber: 6,
          },
        },
        {
          name: 'Lucky 7',
          description: 'Quay số may mắn 777',
          type: GameType.LUCKY7,
          minBet: 10,
          maxBet: 500,
          winRate: 30,
          multiplier: 3.0,
          config: {
            patterns: {
              three7s: { multiplier: 7.0 },
              threeOfAKind: { multiplier: 3.0 },
              straight: { multiplier: 2.0 },
            },
          },
        },
        {
          name: 'Coinflip',
          description: 'Đoán mặt đồng xu',
          type: GameType.COINFLIP,
          minBet: 5,
          maxBet: 200,
          winRate: 48,
          multiplier: 1.95,
          config: {
            options: ['heads', 'tails'],
          },
        },
        {
          name: 'Daily Spin',
          description: 'Vòng quay may mắn hàng ngày',
          type: GameType.DAILY_SPIN,
          status: GameStatus.ACTIVE,
          minBet: 0,
          maxBet: 0,
          winRate: 100,
          multiplier: 1,
          config: {
            freeSpinsPerDay: 3,
            premiumSpinCost: 50,
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
        },
      ]);
    }
  }

  async getGames(filter: any = {}): Promise<Game[]> {
    // Mặc định chỉ hiển thị game active
    if (!filter.status) {
      filter.status = GameStatus.ACTIVE;
    }
    
    return this.gameModel.find(filter);
  }

  async getGameById(id: string): Promise<Game> {
    const game = await this.gameModel.findById(id);
    
    if (!game) {
      throw new NotFoundException('Không tìm thấy game');
    }
    
    return game;
  }

  async playGame(playGameDto: PlayGameDto, userId: string): Promise<any> {
    const { gameId, betAmount, choices } = playGameDto;
    
    // Tìm game
    const game = await this.gameModel.findById(gameId);
    
    if (!game) {
      throw new NotFoundException('Không tìm thấy game');
    }
    
    if (game.status !== GameStatus.ACTIVE) {
      throw new BadRequestException('Game hiện không khả dụng');
    }
    
    // Kiểm tra mức cược
    if (betAmount < game.minBet || betAmount > game.maxBet) {
      throw new BadRequestException(
        `Mức cược phải từ ${game.minBet} đến ${game.maxBet} KC`
      );
    }
    
    // Lấy số dư KC
    // Giả sử có một service để lấy số dư KC
    const balance = await this.getUserKCBalance(userId);
    
    if (balance < betAmount) {
      throw new BadRequestException('Số dư KC không đủ');
    }
    
    // Xử lý trò chơi dựa vào loại
    let result;
    let gameData;
    
    switch (game.type) {
      case GameType.LUCKY:
        ({ result, gameData } = this.playLuckyGame(game, choices));
        break;
      case GameType.LUCKY7:
        ({ result, gameData } = this.playLucky7Game(game));
        break;
      case GameType.COINFLIP:
        ({ result, gameData } = this.playCoinflipGame(game, choices));
        break;
      default:
        throw new BadRequestException('Loại game không hợp lệ');
    }
    
    // Tính toán số KC thắng/thua
    const isWin = result === GameResult.WIN;
    const kcAmount = isWin ? Math.floor(betAmount * game.multiplier) - betAmount : -betAmount;
    const newBalance = balance + kcAmount;
    
    // Lưu lịch sử chơi game
    const gamePlay = new this.gamePlayModel({
      player: userId,
      game: gameId,
      betAmount,
      result,
      kcAmount,
      balanceBefore: balance,
      balanceAfter: newBalance,
      gameData,
      createdAt: new Date(),
    });
    
    await gamePlay.save();
    
    // Cập nhật thống kê game
    await this.updateGameStats(game, result, betAmount, kcAmount);
    
    // Cập nhật số dư KC của người dùng
    // Giả sử có một service để cập nhật số dư KC
    await this.updateUserKCBalance(userId, kcAmount);
    
    return {
      result,
      kcAmount,
      balanceAfter: newBalance,
      gameData,
    };
  }

  async getDailySpinStatus(userId: string): Promise<{ remainingSpins: number; lastSpin: Date }> {
    // Lấy game Daily Spin
    const dailySpin = await this.gameModel.findOne({ type: GameType.DAILY_SPIN });
    
    if (!dailySpin) {
      throw new NotFoundException('Không tìm thấy Daily Spin');
    }
    
    const freeSpinsPerDay = dailySpin.config.freeSpinsPerDay || 3;
    
    // Lấy số lần đã quay trong ngày hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const spinsToday = await this.gamePlayModel.countDocuments({
      player: userId,
      game: dailySpin._id,
      createdAt: { $gte: today },
      'gameData.isFree': true,
    });
    
    // Lấy thời gian quay gần nhất
    const lastSpin = await this.gamePlayModel.findOne({
      player: userId,
      game: dailySpin._id,
    })
      .sort({ createdAt: -1 })
      .select('createdAt');
    
    return {
      remainingSpins: Math.max(0, freeSpinsPerDay - spinsToday),
      lastSpin: lastSpin?.createdAt,
    };
  }

  async playDailySpin(userId: string): Promise<any> {
    // Lấy game Daily Spin
    const dailySpin = await this.gameModel.findOne({ type: GameType.DAILY_SPIN });
    
    if (!dailySpin) {
      throw new NotFoundException('Không tìm thấy Daily Spin');
    }
    
    // Kiểm tra số lần quay miễn phí còn lại
    const { remainingSpins } = await this.getDailySpinStatus(userId);
    const isFree = remainingSpins > 0;
    
    // Nếu hết lượt miễn phí, kiểm tra và trừ KC
    if (!isFree) {
      const premiumSpinCost = dailySpin.config.premiumSpinCost || 50;
      const balance = await this.getUserKCBalance(userId);
      
      if (balance < premiumSpinCost) {
        throw new BadRequestException('Số dư KC không đủ để quay Premium');
      }
      
      // Trừ KC
      await this.updateUserKCBalance(userId, -premiumSpinCost);
    }
    
    // Xác định phần thưởng
    const reward = this.determineSpinReward(dailySpin.config.rewards);
    
    // Ghi lại lịch sử quay
    const gamePlay = new this.gamePlayModel({
      player: userId,
      game: dailySpin._id,
      betAmount: isFree ? 0 : dailySpin.config.premiumSpinCost,
      result: GameResult.WIN,
      kcAmount: reward.type === 'kc' ? reward.amount : 0,
      balanceBefore: await this.getUserKCBalance(userId),
      balanceAfter: await this.getUserKCBalance(userId) + (reward.type === 'kc' ? reward.amount : 0),
      gameData: {
        isFree,
        reward,
      },
      createdAt: new Date(),
    });
    
    await gamePlay.save();
    
    // Cập nhật thống kê game
    await this.updateGameStats(
      dailySpin,
      GameResult.WIN,
      gamePlay.betAmount,
      gamePlay.kcAmount
    );
    
    // Nếu phần thưởng là KC, cập nhật số dư
    if (reward.type === 'kc') {
      await this.updateUserKCBalance(userId, reward.amount);
    }
    
    // Nếu phần thưởng khác, xử lý tương ứng
    // Ví dụ: thêm quà, huy hiệu, v.v.
    
    return {
      reward,
      isFree,
      balanceAfter: gamePlay.balanceAfter,
    };
  }

  async getUserGameHistory(
    userId: string,
    options = { page: 1, limit: 10 },
    gameType?: GameType,
  ): Promise<{ plays: GamePlay[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    const filter: any = { player: userId };
    
    if (gameType) {
      const games = await this.gameModel.find({ type: gameType }).select('_id');
      const gameIds = games.map(game => game._id);
      filter.game = { $in: gameIds };
    }
    
    const [plays, total] = await Promise.all([
      this.gamePlayModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('game', 'name type'),
      this.gamePlayModel.countDocuments(filter),
    ]);
    
    return {
      plays,
      total,
      page,
      limit,
    };
  }

  async getLeaderboard(
    limit: number = 10,
    period: 'day' | 'week' | 'month' | 'all' = 'all',
  ): Promise<{ leaderboard: any[] }> {
    // Tạo bộ lọc thời gian
    const dateFilter: any = {};
    
    if (period !== 'all') {
      const now = new Date();
      dateFilter.createdAt = { $gte: this.getStartDateForPeriod(now, period) };
    }
    
    const leaderboard = await this.gamePlayModel.aggregate([
      {
        $match: {
          ...dateFilter,
          result: GameResult.WIN,
        },
      },
      {
        $group: {
          _id: '$player',
          totalPlays: { $sum: 1 },
          totalWinnings: { $sum: '$kcAmount' },
          totalBets: { $sum: '$betAmount' },
        },
      },
      {
        $sort: { totalWinnings: -1 },
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $unwind: '$userInfo',
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          username: '$userInfo.username',
          avatar: '$userInfo.avatar',
          totalPlays: 1,
          totalWinnings: 1,
          totalBets: 1,
          profitRate: {
            $multiply: [
              { $divide: [{ $subtract: ['$totalWinnings', '$totalBets'] }, '$totalBets'] },
              100,
            ],
          },
        },
      },
    ]);
    
    return { leaderboard };
  }

  async getGameStatistics(): Promise<any> {
    // Thống kê tổng hợp
    const overallStats = await this.gamePlayModel.aggregate([
      {
        $group: {
          _id: null,
          totalPlays: { $sum: 1 },
          totalBets: { $sum: '$betAmount' },
          totalWinnings: {
            $sum: {
              $cond: [{ $eq: ['$result', GameResult.WIN] }, '$kcAmount', 0],
            },
          },
          totalLosses: {
            $sum: {
              $cond: [{ $eq: ['$result', GameResult.LOSE] }, '$betAmount', 0],
            },
          },
          winCount: {
            $sum: {
              $cond: [{ $eq: ['$result', GameResult.WIN] }, 1, 0],
            },
          },
          loseCount: {
            $sum: {
              $cond: [{ $eq: ['$result', GameResult.LOSE] }, 1, 0],
            },
          },
        },
      },
    ]);
    
    // Thống kê theo từng game
    const gameStats = await this.gamePlayModel.aggregate([
      {
        $group: {
          _id: '$game',
          totalPlays: { $sum: 1 },
          totalBets: { $sum: '$betAmount' },
          totalWinnings: {
            $sum: {
              $cond: [{ $eq: ['$result', GameResult.WIN] }, '$kcAmount', 0],
            },
          },
          totalLosses: {
            $sum: {
              $cond: [{ $eq: ['$result', GameResult.LOSE] }, '$betAmount', 0],
            },
          },
          winCount: {
            $sum: {
              $cond: [{ $eq: ['$result', GameResult.WIN] }, 1, 0],
            },
          },
          loseCount: {
            $sum: {
              $cond: [{ $eq: ['$result', GameResult.LOSE] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'games',
          localField: '_id',
          foreignField: '_id',
          as: 'gameInfo',
        },
      },
      {
        $unwind: '$gameInfo',
      },
      {
        $project: {
          gameId: '$_id',
          gameName: '$gameInfo.name',
          gameType: '$gameInfo.type',
          totalPlays: 1,
          totalBets: 1,
          totalWinnings: 1,
          totalLosses: 1,
          winCount: 1,
          loseCount: 1,
          winRate: {
            $multiply: [
              { $divide: ['$winCount', { $add: ['$winCount', '$loseCount'] }] },
              100,
            ],
          },
        },
      },
    ]);
    
    // Thống kê theo ngày trong 7 ngày qua
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyStats = await this.gamePlayModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          totalPlays: { $sum: 1 },
          totalBets: { $sum: '$betAmount' },
          totalWinnings: {
            $sum: {
              $cond: [{ $eq: ['$result', GameResult.WIN] }, '$kcAmount', 0],
            },
          },
          totalLosses: {
            $sum: {
              $cond: [{ $eq: ['$result', GameResult.LOSE] }, '$betAmount', 0],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    
    return {
      overall: overallStats[0] || {},
      gameStats,
      dailyStats,
    };
  }

  // Private helper methods
  private playLuckyGame(game: Game, choices: any): { result: GameResult; gameData: any } {
    // Kiểm tra lựa chọn
    if (!choices || !choices.number) {
      throw new BadRequestException('Vui lòng chọn một số');
    }
    
    const selectedNumber = parseInt(choices.number, 10);
    const minNumber = game.config.minNumber || 1;
    const maxNumber = game.config.maxNumber || 6;
    
    if (selectedNumber < minNumber || selectedNumber > maxNumber) {
      throw new BadRequestException(`Số phải từ ${minNumber} đến ${maxNumber}`);
    }
    
    // Tung xúc xắc
    const diceResult = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
    
    // Xác định kết quả
    const isWin = selectedNumber === diceResult;
    
    return {
      result: isWin ? GameResult.WIN : GameResult.LOSE,
      gameData: {
        selectedNumber,
        diceResult,
      },
    };
  }

  private playLucky7Game(game: Game): { result: GameResult; gameData: any } {
    // Quay 3 số từ 1-7
    const spin1 = Math.floor(Math.random() * 7) + 1;
    const spin2 = Math.floor(Math.random() * 7) + 1;
    const spin3 = Math.floor(Math.random() * 7) + 1;
    
    const spins = [spin1, spin2, spin3];
    
    // Kiểm tra các mẫu trúng thưởng
    let result = GameResult.LOSE;
    let pattern = null;
    let multiplier = 1;
    
    // Kiểm tra 3 số 7
    if (spin1 === 7 && spin2 === 7 && spin3 === 7) {
      result = GameResult.WIN;
      pattern = 'three7s';
      multiplier = game.config.patterns.three7s.multiplier;
    }
    // Kiểm tra 3 số giống nhau
    else if (spin1 === spin2 && spin2 === spin3) {
      result = GameResult.WIN;
      pattern = 'threeOfAKind';
      multiplier = game.config.patterns.threeOfAKind.multiplier;
    }
    // Kiểm tra dãy số liên tiếp
    else {
      const sortedSpins = [...spins].sort((a, b) => a - b);
      if (
        sortedSpins[1] === sortedSpins[0] + 1 &&
        sortedSpins[2] === sortedSpins[1] + 1
      ) {
        result = GameResult.WIN;
        pattern = 'straight';
        multiplier = game.config.patterns.straight.multiplier;
      }
    }
    
    return {
      result,
      gameData: {
        spins,
        pattern,
        multiplier,
      },
    };
  }

  private playCoinflipGame(game: Game, choices: any): { result: GameResult; gameData: any } {
    // Kiểm tra lựa chọn
    if (!choices || !choices.side) {
      throw new BadRequestException('Vui lòng chọn mặt đồng xu');
    }
    
    const selectedSide = choices.side;
    const options = game.config.options || ['heads', 'tails'];
    
    if (!options.includes(selectedSide)) {
      throw new BadRequestException('Lựa chọn không hợp lệ');
    }
    
    // Tung đồng xu
    const coinResult = options[Math.floor(Math.random() * options.length)];
    
    // Xác định kết quả
    const isWin = selectedSide === coinResult;
    
    return {
      result: isWin ? GameResult.WIN : GameResult.LOSE,
      gameData: {
        selectedSide,
        coinResult,
      },
    };
  }

  private determineSpinReward(rewards: any[]): any {
    // Tính tổng xác suất
    const totalChance = rewards.reduce((sum, reward) => sum + reward.chance, 0);
    
    // Chuẩn hóa xác suất nếu tổng không bằng 1
    const normalizedRewards = rewards.map(reward => ({
      ...reward,
      chance: reward.chance / totalChance,
    }));
    
    // Random số từ 0-1
    const random = Math.random();
    
    // Chọn phần thưởng dựa trên xác suất
    let cumulativeChance = 0;
    
    for (const reward of normalizedRewards) {
      cumulativeChance += reward.chance;
      
      if (random <= cumulativeChance) {
        return reward;
      }
    }
    
    // Mặc định trả về phần thưởng đầu tiên
    return normalizedRewards[0];
  }

  private async updateGameStats(game: GameDocument, result: GameResult, betAmount: number, kcAmount: number): Promise<void> {
    const update: any = {
      $inc: {
        playCount: 1,
        totalKCBet: betAmount,
      },
    };
    
    if (result === GameResult.WIN) {
      update.$inc.totalKCWon = kcAmount;
      update.$inc.totalWinners = 1;
    } else {
      update.$inc.totalLosers = 1;
    }
    
    await this.gameModel.updateOne({ _id: game._id }, update);
  }

  private getStartDateForPeriod(now: Date, period: 'day' | 'week' | 'month'): Date {
    const startDate = new Date(now);
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }
    
    return startDate;
  }

  // Phương thức này sẽ được thay thế bằng service thực tế
  private async getUserKCBalance(userId: string): Promise<number> {
    // Giả sử một số dư KC
    return 1000;
  }

  // Phương thức này sẽ được thay thế bằng service thực tế
  private async updateUserKCBalance(userId: string, amount: number): Promise<void> {
    // Giả định cập nhật số dư KC
    console.log(`Cập nhật số dư KC của ${userId}: ${amount}`);
  }
}