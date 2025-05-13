import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { SlotGame, SlotGameDocument } from '../schemas/slot-game.schema';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { Transaction, TransactionDocument } from '../../transaction/schemas/transaction.schema';

@Injectable()
export class SlotGameService {
  private readonly logger = new Logger(SlotGameService.name);

  constructor(
    @InjectModel(SlotGame.name) private slotGameModel: Model<SlotGameDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private configService: ConfigService,
  ) {}

  /**
   * Get all slot games
   */
  async getAllSlotGames() {
    return this.slotGameModel.find({ status: 'active' }).exec();
  }

  /**
   * Get a slot game by ID
   */
  async getSlotGameById(id: string) {
    return this.slotGameModel.findById(id).exec();
  }

  /**
   * Place a bet and spin the reels
   */
  async spin(userId: string, slotGameId: string, betAmount: number) {
    // Validate bet amount
    const slotGame = await this.slotGameModel.findById(slotGameId);
    if (!slotGame) {
      throw new Error('Slot game not found');
    }

    if (betAmount < slotGame.minBet || betAmount > slotGame.maxBet) {
      throw new Error(`Bet amount must be between ${slotGame.minBet} and ${slotGame.maxBet} KC`);
    }

    // Check user balance
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.kcBalance < betAmount) {
      throw new Error('Insufficient balance');
    }

    // Deduct bet amount from user balance
    await this.userModel.updateOne(
      { _id: userId },
      { $inc: { kcBalance: -betAmount } }
    );

    // Record transaction
    await this.transactionModel.create({
      userId,
      type: 'bet',
      amount: -betAmount,
      status: 'completed',
      reference: {
        type: 'slot',
        gameId: slotGameId,
      },
    });

    // Generate random symbols for each reel
    const reelResults = this.spinReels(slotGame);

    // Calculate winnings
    const { winAmount, winningLines } = this.calculateWinnings(slotGame, reelResults, betAmount);

    // If user won, add to balance
    if (winAmount > 0) {
      await this.userModel.updateOne(
        { _id: userId },
        { $inc: { kcBalance: winAmount } }
      );

      // Record win transaction
      await this.transactionModel.create({
        userId,
        type: 'win',
        amount: winAmount,
        status: 'completed',
        reference: {
          type: 'slot',
          gameId: slotGameId,
        },
      });
    }

    return {
      reelResults,
      betAmount,
      winAmount,
      winningLines,
      newBalance: user.kcBalance - betAmount + winAmount,
    };
  }

  /**
   * Generate random symbols for each reel
   */
  private spinReels(slotGame: SlotGameDocument) {
    const reelResults = [];
    
    // Generate a grid of symbols based on their probabilities
    for (let i = 0; i < slotGame.reels; i++) {
      const reelSymbols = [];
      for (let j = 0; j < slotGame.rows; j++) {
        reelSymbols.push(this.getRandomSymbol(slotGame.symbols));
      }
      reelResults.push(reelSymbols);
    }
    
    return reelResults;
  }

  /**
   * Get a random symbol based on probability weights
   */
  private getRandomSymbol(symbols: any[]) {
    const totalProbability = symbols.reduce((sum, symbol) => sum + symbol.probability, 0);
    let random = Math.random() * totalProbability;
    
    for (const symbol of symbols) {
      random -= symbol.probability;
      if (random <= 0) {
        return symbol.id;
      }
    }
    
    // Fallback to first symbol
    return symbols[0].id;
  }

  /**
   * Calculate winnings based on paylines
   */
  private calculateWinnings(slotGame: SlotGameDocument, reelResults: string[][], betAmount: number) {
    let totalWin = 0;
    const winningLines = [];
    
    // Check each payline
    for (const payline of slotGame.paylines) {
      let symbolsOnLine = [];
      
      // Get symbols on this payline
      for (let i = 0; i < reelResults.length; i++) {
        const rowIndex = payline.positions[i] || 0;
        if (rowIndex >= 0 && rowIndex < reelResults[i].length) {
          symbolsOnLine.push(reelResults[i][rowIndex]);
        }
      }
      
      // Check for matching symbols
      const firstSymbol = symbolsOnLine[0];
      let matchCount = 1;
      
      for (let i = 1; i < symbolsOnLine.length; i++) {
        if (symbolsOnLine[i] === firstSymbol) {
          matchCount++;
        } else {
          break;
        }
      }
      
      // Calculate win for this line
      if (matchCount >= 3) {
        const symbolData = slotGame.symbols.find(s => s.id === firstSymbol);
        if (symbolData) {
          const lineWin = symbolData.value * matchCount * payline.multiplier * (betAmount / slotGame.minBet);
          totalWin += lineWin;
          
          winningLines.push({
            payline: payline.positions,
            symbolId: firstSymbol,
            matchCount,
            win: lineWin,
          });
        }
      }
    }
    
    return {
      winAmount: totalWin,
      winningLines,
    };
  }
}