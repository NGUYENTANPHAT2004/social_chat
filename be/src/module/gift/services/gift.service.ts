// modules/gift/services/gift.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema as MongooseSchema } from 'mongoose';
import { Gift, GiftDocument, GiftStatus } from '../schemas/gift.schema';
import { GiftTransaction, GiftTransactionDocument } from '../schemas/gift-transaction.schema';
import { CreateGiftDto } from '../dto/create-gift.dto';
import { SendGiftDto } from '../dto/send-gift.dto';

@Injectable()
export class GiftService {
  constructor(
    @InjectModel(Gift.name) private giftModel: Model<GiftDocument>,
    @InjectModel(GiftTransaction.name) private giftTransactionModel: Model<GiftTransactionDocument>,
  ) {}

  async createGift(createGiftDto: CreateGiftDto): Promise<Gift> {
    const newGift = new this.giftModel(createGiftDto);
    return newGift.save();
  }

  async getGiftById(id: string): Promise<Gift> {
    const gift = await this.giftModel.findById(id);
    
    if (!gift) {
      throw new NotFoundException('Không tìm thấy quà tặng');
    }
    
    return gift;
  }

  async getGifts(
    filter: any = {},
    options = { page: 1, limit: 10 },
  ): Promise<{ gifts: Gift[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    // Mặc định chỉ hiển thị quà tặng active
    if (!filter.status) {
      filter.status = GiftStatus.ACTIVE;
    }
    
    const [gifts, total] = await Promise.all([
      this.giftModel
        .find(filter)
        .sort({ displayOrder: 1, price: 1 })
        .skip(skip)
        .limit(limit),
      this.giftModel.countDocuments(filter),
    ]);
    
    return {
      gifts,
      total,
      page,
      limit,
    };
  }

  async getGiftCategories(): Promise<{ categories: string[] }> {
    const result = await this.giftModel.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 0 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    
    const categories = result.map(item => item._id);
    
    return { categories };
  }

  async updateGift(id: string, updateGiftDto: CreateGiftDto): Promise<Gift> {
    const gift = await this.giftModel.findById(id);
    
    if (!gift) {
      throw new NotFoundException('Không tìm thấy quà tặng');
    }
    
    // Cập nhật các trường
    Object.assign(gift, updateGiftDto);
    
    return gift.save();
  }

  async deleteGift(id: string): Promise<{ success: boolean; message: string }> {
    const gift = await this.giftModel.findById(id);
    
    if (!gift) {
      throw new NotFoundException('Không tìm thấy quà tặng');
    }
    
    // Thay vì xóa, chuyển trạng thái thành INACTIVE
    gift.status = GiftStatus.INACTIVE;
    await gift.save();
    
    return { success: true, message: 'Quà tặng đã được vô hiệu hóa' };
  }

  async sendGift(sendGiftDto: SendGiftDto, senderId: string): Promise<GiftTransaction> {
    const { giftId, recipientId, quantity = 1, message, roomId } = sendGiftDto;
    
    // Lấy thông tin quà tặng
    const gift = await this.giftModel.findById(giftId);
    
    if (!gift) {
      throw new NotFoundException('Không tìm thấy quà tặng');
    }
    
    if (gift.status !== GiftStatus.ACTIVE) {
      throw new BadRequestException('Quà tặng này hiện không khả dụng');
    }
    
    // Tính tổng giá trị KC
    const totalPrice = gift.price * quantity;
    
    // Trong thực tế, bạn sẽ kiểm tra số dư KC và tạo giao dịch
    // Ví dụ: await this.transactionService.processGiftTransaction(...)
    
    // Tạo giao dịch quà tặng
    const giftTransaction = new this.giftTransactionModel({
      gift: giftId,
      sender: senderId,
      recipient: recipientId,
      quantity,
      totalPrice,
      message: message || '',
      createdAt: new Date(),
    });
    
    // Thêm phòng nếu có
    if (roomId) {
      giftTransaction.room = new MongooseSchema.Types.ObjectId(roomId);
    }
    
    // Tăng số lượng đã gửi của quà tặng
    gift.sentCount += quantity;
    await gift.save();
    
    return giftTransaction.save();
  }

  async getUserSentGifts(
    userId: string,
    options = { page: 1, limit: 10 },
  ): Promise<{ transactions: GiftTransaction[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      this.giftTransactionModel
        .find({ sender: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('gift')
        .populate('recipient', 'username avatar')
        .populate('room', 'name'),
      this.giftTransactionModel.countDocuments({ sender: userId }),
    ]);
    
    return {
      transactions,
      total,
      page,
      limit,
    };
  }

  async getUserReceivedGifts(
    userId: string,
    options = { page: 1, limit: 10 },
  ): Promise<{ transactions: GiftTransaction[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      this.giftTransactionModel
        .find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('gift')
        .populate('sender', 'username avatar')
        .populate('room', 'name'),
      this.giftTransactionModel.countDocuments({ recipient: userId }),
    ]);
    
    return {
      transactions,
      total,
      page,
      limit,
    };
  }

  async getUserGiftTransactions(
    userId: string,
    options = { page: 1, limit: 10 },
  ): Promise<{ transactions: GiftTransaction[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      this.giftTransactionModel
        .find({
          $or: [{ sender: userId }, { recipient: userId }],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('gift')
        .populate('sender', 'username avatar')
        .populate('recipient', 'username avatar')
        .populate('room', 'name'),
      this.giftTransactionModel.countDocuments({
        $or: [{ sender: userId }, { recipient: userId }],
      }),
    ]);
    
    return {
      transactions,
      total,
      page,
      limit,
    };
  }

  async getRoomGiftTransactions(
    roomId: string,
    options = { page: 1, limit: 10 },
  ): Promise<{ transactions: GiftTransaction[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      this.giftTransactionModel
        .find({ room: roomId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('gift')
        .populate('sender', 'username avatar')
        .populate('recipient', 'username avatar'),
      this.giftTransactionModel.countDocuments({ room: roomId }),
    ]);
    
    return {
      transactions,
      total,
      page,
      limit,
    };
  }

  async getTopGiftReceivers(
    limit: number = 10,
    period: 'day' | 'week' | 'month' | 'all' = 'all',
  ): Promise<{ users: any[] }> {
    // Tạo bộ lọc thời gian
    const dateFilter: any = {};
    
    if (period !== 'all') {
      const now = new Date();
      dateFilter.createdAt = { $gte: this.getStartDateForPeriod(now, period) };
    }
    
    const result = await this.giftTransactionModel.aggregate([
      {
        $match: dateFilter,
      },
      {
        $group: {
          _id: '$recipient',
          totalGifts: { $sum: '$quantity' },
          totalValue: { $sum: '$totalPrice' },
          transactions: { $sum: 1 },
        },
      },
      {
        $sort: { totalValue: -1 },
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
          totalGifts: 1,
          totalValue: 1,
          transactions: 1,
        },
      },
    ]);
    
    return { users: result };
  }

  async getTopGiftSenders(
    limit: number = 10,
    period: 'day' | 'week' | 'month' | 'all' = 'all',
  ): Promise<{ users: any[] }> {
    // Tạo bộ lọc thời gian
    const dateFilter: any = {};
    
    if (period !== 'all') {
      const now = new Date();
      dateFilter.createdAt = { $gte: this.getStartDateForPeriod(now, period) };
    }
    
    const result = await this.giftTransactionModel.aggregate([
      {
        $match: dateFilter,
      },
      {
        $group: {
          _id: '$sender',
          totalGifts: { $sum: '$quantity' },
          totalValue: { $sum: '$totalPrice' },
          transactions: { $sum: 1 },
        },
      },
      {
        $sort: { totalValue: -1 },
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
          totalGifts: 1,
          totalValue: 1,
          transactions: 1,
        },
      },
    ]);
    
    return { users: result };
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
}