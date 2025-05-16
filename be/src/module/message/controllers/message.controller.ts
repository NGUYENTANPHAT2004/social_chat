 // modules/message/controllers/message.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { MessageService } from '../services/message.service';
  import { SendMessageDto } from '../dto/send-message.dto';
  
  @ApiTags('messages')
  @Controller('messages')
  export class MessageController {
    constructor(private readonly messageService: MessageService) {}
  
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Gửi tin nhắn mới' })
    @ApiResponse({ status: 201, description: 'Tin nhắn đã được gửi thành công' })
    async sendMessage(@Body() sendMessageDto: SendMessageDto, @Request() req) {
      return this.messageService.sendMessage(sendMessageDto, req.user.id);
    }
  
    @Get('conversations')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách cuộc trò chuyện' })
    @ApiResponse({ status: 200, description: 'Danh sách cuộc trò chuyện' })
    async getConversations(
      @Request() req,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      return this.messageService.getUserConversations(req.user.id, { page, limit });
    }
  
    @Get('conversations/:conversationId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy tin nhắn của cuộc trò chuyện' })
    @ApiResponse({ status: 200, description: 'Danh sách tin nhắn' })
    async getConversationMessages(
      @Param('conversationId') conversationId: string,
      @Request() req,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 20,
    ) {
      return this.messageService.getConversationMessages(
        conversationId,
        req.user.id,
        { page, limit },
      );
    }
  
    @Patch('conversations/:conversationId/read')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Đánh dấu đã đọc tất cả tin nhắn trong cuộc trò chuyện' })
    @ApiResponse({ status: 200, description: 'Tin nhắn đã được đánh dấu đã đọc' })
    async markConversationAsRead(
      @Param('conversationId') conversationId: string,
      @Request() req,
    ) {
      return this.messageService.markConversationAsRead(conversationId, req.user.id);
    }
  
    @Delete('conversations/:conversationId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa cuộc trò chuyện' })
    @ApiResponse({ status: 200, description: 'Cuộc trò chuyện đã được xóa' })
    async deleteConversation(
      @Param('conversationId') conversationId: string,
      @Request() req,
    ) {
      return this.messageService.deleteConversation(conversationId, req.user.id);
    }
  
    @Get('unread-count')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy số lượng tin nhắn chưa đọc' })
    @ApiResponse({ status: 200, description: 'Số lượng tin nhắn chưa đọc' })
    async getUnreadCount(@Request() req) {
      return this.messageService.getUnreadCount(req.user.id);
    }
  
    @Get('with/:userId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy/Tạo cuộc trò chuyện với người dùng cụ thể' })
    @ApiResponse({ status: 200, description: 'Thông tin cuộc trò chuyện' })
    async getOrCreateConversation(
      @Param('userId') userId: string,
      @Request() req,
    ) {
      return this.messageService.getOrCreateConversation(req.user.id, userId);
    }
  
    @Delete(':messageId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa tin nhắn' })
    @ApiResponse({ status: 200, description: 'Tin nhắn đã được xóa' })
    async deleteMessage(
      @Param('messageId') messageId: string,
      @Request() req,
    ) {
      return this.messageService.deleteMessage(messageId, req.user.id);
    }
  }