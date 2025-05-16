// modules/post/controllers/comment.controller.ts
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
    ForbiddenException,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { CommentService } from '../services/comment.service';
  import { CreateCommentDto } from '../dto/create-comment.dto';
  import { UpdateCommentDto } from '../dto/update-comment.dto';
  
  @ApiTags('comments')
  @Controller('comments')
  export class CommentController {
    constructor(private readonly commentService: CommentService) {}
  
    @Post(':postId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Thêm bình luận mới cho bài viết' })
    @ApiResponse({ status: 201, description: 'Bình luận đã được tạo thành công' })
    async createComment(
      @Param('postId') postId: string,
      @Body() createCommentDto: CreateCommentDto,
      @Request() req,
    ) {
      return this.commentService.createComment(postId, createCommentDto, req.user.id);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin bình luận theo ID' })
    @ApiResponse({ status: 200, description: 'Thông tin bình luận' })
    async getCommentById(@Param('id') id: string) {
      return this.commentService.getCommentById(id);
    }
  
    @Get(':id/replies')
    @ApiOperation({ summary: 'Lấy danh sách phản hồi của bình luận' })
    @ApiResponse({ status: 200, description: 'Danh sách phản hồi' })
    async getCommentReplies(
      @Param('id') id: string,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      return this.commentService.getCommentReplies(id, { page, limit });
    }
  
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật bình luận' })
    @ApiResponse({ status: 200, description: 'Bình luận đã được cập nhật' })
    async updateComment(
      @Param('id') id: string,
      @Body() updateCommentDto: UpdateCommentDto,
      @Request() req,
    ) {
      const comment = await this.commentService.getCommentById(id);
      
      if (comment.author.toString() !== req.user.id) {
        throw new ForbiddenException('Bạn không có quyền cập nhật bình luận này');
      }
      
      return this.commentService.updateComment(id, updateCommentDto);
    }
  
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa bình luận' })
    @ApiResponse({ status: 200, description: 'Bình luận đã được xóa' })
    async deleteComment(@Param('id') id: string, @Request() req) {
      const comment = await this.commentService.getCommentById(id);
      
      if (comment.author.toString() !== req.user.id) {
        throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
      }
      
      return this.commentService.deleteComment(id);
    }
  
    @Post(':id/like')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Thích bình luận' })
    @ApiResponse({ status: 200, description: 'Đã thích bình luận thành công' })
    async likeComment(@Param('id') id: string, @Request() req) {
      return this.commentService.likeComment(id, req.user.id);
    }
  
    @Post(':id/unlike')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Bỏ thích bình luận' })
    @ApiResponse({ status: 200, description: 'Đã bỏ thích bình luận thành công' })
    async unlikeComment(@Param('id') id: string, @Request() req) {
      return this.commentService.unlikeComment(id, req.user.id);
    }
  }