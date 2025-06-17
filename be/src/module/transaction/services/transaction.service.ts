// modules/transaction/services/transaction.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema as MongooseSchema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionDocument, TransactionType, TransactionStatus, CurrencyType } from '../schemas/transaction.schema';
import { CreateTransactionDto } from '../dto/create-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async createTransaction(createTransactionDto: CreateTransactionDto, senderId: string): Promise<Transaction> {
    const { type, recipientId, amount, currency = CurrencyType.KC, description, relatedItemId, relatedItemType, metadata } = createTransactionDto;
    
    // Tạo mã giao dịch
    const transactionCode = `TX-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    // Lấy thông tin số dư người gửi
    const senderBalance = await this.getKCBalance(senderId);
    
    // Kiểm tra số dư
    if (type !== TransactionType.DEPOSIT && amount > senderBalance.balance) {
      throw new BadRequestException('Số dư không đủ để thực hiện giao dịch');
    }
    
    // Tính toán số dư sau giao dịch
    let senderBalanceAfter = senderBalance.balance;
    
    if ([TransactionType.TRANSFER, TransactionType.GIFT, TransactionType.WITHDRAW, TransactionType.PURCHASE].includes(type)) {
      senderBalanceAfter -= amount;
    } else if (type === TransactionType.DEPOSIT) {
      senderBalanceAfter += amount;
    }
    
    // Tạo giao dịch mới
    const newTransaction = new this.transactionModel({
      transactionCode,
      type,
      sender: new MongooseSchema.Types.ObjectId(senderId),
      amount,
      currency,
      status: type === TransactionType.DEPOSIT ? TransactionStatus.PENDING : TransactionStatus.COMPLETED,
      description: description || this.getDefaultDescription(type),
      senderBalanceBefore: senderBalance.balance,
      senderBalanceAfter,
      relatedItemId,
      relatedItemType,
      metadata: metadata || {},
    });
    
    // Thêm thông tin người nhận nếu có
    if (recipientId) {
      newTransaction.recipient = new MongooseSchema.Types.ObjectId(recipientId);
      
      // Lấy số dư người nhận
      const recipientBalance = await this.getKCBalance(recipientId);
      newTransaction.recipientBalanceBefore = recipientBalance.balance;
      newTransaction.recipientBalanceAfter = recipientBalance.balance + amount;
    }
    
    // Nếu giao dịch hoàn thành
    if (newTransaction.status === TransactionStatus.COMPLETED) {
      newTransaction.completedAt = new Date();
    }
    
    return newTransaction.save();
  }

  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await this.transactionModel.findById(id)
      .populate('sender', 'username avatar')
      .populate('recipient', 'username avatar');
    
    if (!transaction) {
      throw new NotFoundException('Không tìm thấy giao dịch');
    }
    
    return transaction;
  }

  async getTransactions(
    filter: any = {},
    options = { page: 1, limit: 10 },
  ): Promise<{ transactions: Transaction[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username avatar')
        .populate('recipient', 'username avatar'),
      this.transactionModel.countDocuments(filter),
    ]);
    
    return {
      transactions,
      total,
      page,
      limit,
    };
  }

  async sendGift(
    recipientId: string,
    amount: number,
    senderId: string,
    relatedItemId?: string,
    relatedItemType?: string,
    message?: string,
  ): Promise<Transaction> {
    // Kiểm tra số dư
    const senderBalance = await this.getKCBalance(senderId);
    
    if (amount > senderBalance.balance) {
      throw new BadRequestException('Số dư không đủ để gửi quà');
    }
    
    // Tạo giao dịch quà tặng
    const giftTransaction = new this.transactionModel({
      transactionCode: `GIFT-${Date.now()}-${uuidv4().substring(0, 8)}`,
      type: TransactionType.GIFT,
      sender: senderId,
      recipient: recipientId,
      amount,
      currency: CurrencyType.KC,
      status: TransactionStatus.COMPLETED,
      description: message || 'Gửi quà tặng',
      senderBalanceBefore: senderBalance.balance,
      senderBalanceAfter: senderBalance.balance - amount,
      relatedItemId,
      relatedItemType,
      completedAt: new Date(),
    });
    
    // Lấy số dư người nhận
    const recipientBalance = await this.getKCBalance(recipientId);
    giftTransaction.recipientBalanceBefore = recipientBalance.balance;
    giftTransaction.recipientBalanceAfter = recipientBalance.balance + amount;
    
    return giftTransaction.save();
  }

  async getKCBalance(userId: string): Promise<{ balance: number }> {
    // Tính tổng số KC đã nhận
    const incomeResult = await this.transactionModel.aggregate([
      {
        $match: {
          recipient: userId,
          currency: CurrencyType.KC,
          status: TransactionStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);
    
    // Tính tổng số KC đã chi
    const expenseResult = await this.transactionModel.aggregate([
      {
        $match: {
          sender: userId,
          currency: CurrencyType.KC,
          status: TransactionStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);
    
    const income = incomeResult.length > 0 ? incomeResult[0].total : 0;
    const expense = expenseResult.length > 0 ? expenseResult[0].total : 0;
    
    return { balance: income - expense };
  }

  async getTransactionStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    const dateFilter: any = {};
    
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    // Tính tổng số KC theo loại giao dịch
    const transactionsByType = await this.transactionModel.aggregate([
      {
        $match: {
          ...dateFilter,
          status: TransactionStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);
    
    // Tính tổng số giao dịch theo trạng thái
    const transactionsByStatus = await this.transactionModel.aggregate([
      {
        $match: dateFilter,
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Tính tổng số KC đã nạp
    const totalDeposit = await this.transactionModel.aggregate([
      {
        $match: {
          ...dateFilter,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);
    
    // Tính tổng số KC đã rút
    const totalWithdraw = await this.transactionModel.aggregate([
      {
        $match: {
          ...dateFilter,
          type: TransactionType.WITHDRAW,
          status: TransactionStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);
    
    // Thống kê theo ngày
    const dailyStats = await this.transactionModel.aggregate([
      {
        $match: {
          ...dateFilter,
          status: TransactionStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    
    return {
      transactionsByType,
      transactionsByStatus,
      totalDeposit: totalDeposit.length > 0 ? totalDeposit[0].total : 0,
      totalWithdraw: totalWithdraw.length > 0 ? totalWithdraw[0].total : 0,
      dailyStats,
    };
  }

  private getDefaultDescription(type: TransactionType): string {
    switch (type) {
      case TransactionType.DEPOSIT:
        return 'Nạp KC';
      case TransactionType.WITHDRAW:
        return 'Rút KC';
      case TransactionType.TRANSFER:
        return 'Chuyển KC';
      case TransactionType.GIFT:
        return 'Tặng quà';
      case TransactionType.SUBSCRIPTION:
        return 'Đăng ký VIP';
      case TransactionType.SYSTEM:
        return 'Giao dịch hệ thống';
      case TransactionType.REWARD:
        return 'Phần thưởng';
      case TransactionType.PURCHASE:
        return 'Mua dịch vụ/hàng hóa';
      case TransactionType.REFUND:
        return 'Hoàn tiền';
      default:
        return 'Giao dịch KC';
    }
  }
}