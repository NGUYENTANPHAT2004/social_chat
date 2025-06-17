// modules/message/services/message.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema as MongooseSchema } from 'mongoose';
import { Message, MessageDocument, MessageStatus, MessageType } from '../schemas/message.schema';
import { Conversation, ConversationDocument, ConversationStatus } from '../schemas/conversation.schema';
import { SendMessageDto } from '../dto/send-message.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
  ) {}

  async sendMessage(sendMessageDto: SendMessageDto, senderId: string): Promise<Message> {
    const { recipientId, content, type = MessageType.TEXT, image, metadata } = sendMessageDto;
    
    // Lấy hoặc tạo cuộc trò chuyện
    const conversation = await this.getOrCreateConversation(senderId, recipientId);
    
    // Tạo tin nhắn mới
    const newMessage = new this.messageModel({
      sender: new MongooseSchema.Types.ObjectId(senderId),
      recipient: new MongooseSchema.Types.ObjectId(recipientId),
      conversation: conversation._id,
      content,
      type,
      status: MessageStatus.SENT,
      createdAt: new Date(),
    });
    
    // Thêm hình ảnh và metadata nếu có
    if (image) {
      newMessage.image = image;
    }
    
    if (metadata) {
      newMessage.metadata = metadata;
    }
    
    // Lưu tin nhắn
    const savedMessage = await newMessage.save();
    
    // Cập nhật thông tin cuộc trò chuyện
    conversation.lastMessage = savedMessage._id;
    conversation.lastMessageContent = content;
    conversation.lastMessageSender = new MongooseSchema.Types.ObjectId(senderId);
    conversation.lastMessageTime = new Date();
    
    // Tăng số tin nhắn chưa đọc cho người nhận
    const unreadCount = conversation.unreadCount.get(recipientId) || 0;
    conversation.unreadCount.set(recipientId, unreadCount + 1);
    
    // Nếu cuộc trò chuyện đã bị archive thì chuyển về active
    if (conversation.status === ConversationStatus.ARCHIVED) {
      conversation.status = ConversationStatus.ACTIVE;
    }
    
    await conversation.save();
    
    return savedMessage;
  }

  async getUserConversations(
    userId: string,
    options = { page: 1, limit: 10 },
  ): Promise<{ conversations: any[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    const [conversations, total] = await Promise.all([
      this.conversationModel
        .find({
          participants: userId,
          status: { $ne: ConversationStatus.BLOCKED },
        })
        .sort({ lastMessageTime: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'participants',
          select: 'username avatar',
        })
        .populate({
          path: 'lastMessage',
          select: 'content type image status createdAt',
        }),
      this.conversationModel.countDocuments({
        participants: userId,
        status: { $ne: ConversationStatus.BLOCKED },
      }),
    ]);
    
    // Chuyển đổi dữ liệu để dễ sử dụng hơn
    const formattedConversations = conversations.map(conversation => {
      const otherParticipants = conversation.participants.filter(
        p => p.toString() !== userId
      );
      
      return {
        id: conversation._id,
        otherUser: otherParticipants[0] || null,
        participants: conversation.participants,
        lastMessage: conversation.lastMessage,
        lastMessageTime: conversation.lastMessageTime,
        unreadCount: conversation.unreadCount.get(userId) || 0,
      };
    });
    
    return {
      conversations: formattedConversations,
      total,
      page,
      limit,
    };
  }

  async getConversationById(id: string): Promise<Conversation> {
    const conversation = await this.conversationModel.findById(id)
      .populate({
        path: 'participants',
        select: 'username avatar',
      });
    
    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }
    
    return conversation;
  }

  async getOrCreateConversation(userId1: string, userId2: string): Promise<ConversationDocument> {
    // Tìm cuộc trò chuyện hiện có
    const existingConversation = await this.conversationModel.findOne({
      participants: { $all: [userId1, userId2] },
      $expr: { $eq: [{ $size: '$participants' }, 2] }, // Đảm bảo chỉ có 2 người tham gia
    });
    
    if (existingConversation) {
      return existingConversation;
    }
    
    // Tạo cuộc trò chuyện mới
    const newConversation = new this.conversationModel({
      participants: [userId1, userId2],
      unreadCount: new Map(),
      status: ConversationStatus.ACTIVE,
      createdAt: new Date(),
    });
    
    // Khởi tạo số tin nhắn chưa đọc
    newConversation.unreadCount.set(userId1, 0);
    newConversation.unreadCount.set(userId2, 0);
    
    return newConversation.save();
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    options = { page: 1, limit: 20 },
  ): Promise<{ messages: Message[]; total: number; page: number; limit: number }> {
    const conversation = await this.conversationModel.findById(conversationId);
    
    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }
    
    // Kiểm tra người dùng có quyền xem không
    if (!conversation.participants.some(p => p.toString() === userId)) {
      throw new ForbiddenException('Bạn không có quyền xem cuộc trò chuyện này');
    }
    
    const { page, limit } = options;
    // Lấy tin nhắn theo thứ tự mới nhất đến cũ nhất
    const skip = (page - 1) * limit;
    
    const [messages, total] = await Promise.all([
      this.messageModel
        .find({
          conversation: conversationId,
          status: { $ne: MessageStatus.DELETED },
        })
        .sort({ createdAt: -1 }) // Mới nhất đến cũ nhất
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username avatar')
        .populate('recipient', 'username avatar'),
      this.messageModel.countDocuments({
        conversation: conversationId,
        status: { $ne: MessageStatus.DELETED },
      }),
    ]);
    
    // Đánh dấu đã đọc các tin nhắn
    await this.markConversationAsRead(conversationId, userId);
    
    return {
      messages: messages.reverse(), // Đảo ngược để hiển thị theo thứ tự thời gian tăng dần
      total,
      page,
      limit,
    };
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<{ success: boolean; count: number }> {
    const conversation = await this.conversationModel.findById(conversationId);
    
    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }
    
    // Kiểm tra người dùng có quyền không
    if (!conversation.participants.some(p => p.toString() === userId)) {
      throw new ForbiddenException('Bạn không có quyền trong cuộc trò chuyện này');
    }
    
    // Đặt số tin nhắn chưa đọc về 0
    conversation.unreadCount.set(userId, 0);
    await conversation.save();
    
    // Đánh dấu tất cả tin nhắn là đã đọc
    const result = await this.messageModel.updateMany(
      {
        conversation: conversationId,
        recipient: userId,
        status: MessageStatus.SENT,
      },
      {
        $set: {
          status: MessageStatus.READ,
          readAt: new Date(),
        },
      },
    );
    
    return {
      success: true,
      count: result.modifiedCount,
    };
  }

  async deleteConversation(conversationId: string, userId: string): Promise<{ success: boolean }> {
    const conversation = await this.conversationModel.findById(conversationId);
    
    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }
    
    // Kiểm tra người dùng có quyền không
    if (!conversation.participants.some(p => p.toString() === userId)) {
      throw new ForbiddenException('Bạn không có quyền xóa cuộc trò chuyện này');
    }
    
    // Thay vì xóa, chuyển trạng thái thành ARCHIVED
    conversation.status = ConversationStatus.ARCHIVED;
    await conversation.save();
    
    return { success: true };
  }

  async deleteMessage(messageId: string, userId: string): Promise<{ success: boolean }> {
    const message = await this.messageModel.findById(messageId);
    
    if (!message) {
      throw new NotFoundException('Không tìm thấy tin nhắn');
    }
    
    // Kiểm tra người dùng có quyền không
    if (message.sender.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa tin nhắn này');
    }
    
    // Thay vì xóa, chuyển trạng thái thành DELETED
    message.status = MessageStatus.DELETED;
    message.content = 'Tin nhắn đã bị xóa';
    await message.save();
    
    return { success: true };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    // Lấy tổng số tin nhắn chưa đọc từ tất cả các cuộc trò chuyện
    const conversations = await this.conversationModel.find({
      participants: userId,
      status: { $ne: ConversationStatus.BLOCKED },
    });
    
    let totalUnread = 0;
    
    for (const conversation of conversations) {
      totalUnread += conversation.unreadCount.get(userId) || 0;
    }
    
    return { count: totalUnread };
  }
}