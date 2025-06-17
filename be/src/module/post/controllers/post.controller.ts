// modules/post/controllers/post.controller.ts
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
  import { PostService } from '../services/post.service';
  import { CreatePostDto } from '../dto/create-post.dto';
  import { UpdatePostDto } from '../dto/update-post.dto';
  import { PostStatus, PostType } from '../schemas/post.schema';
  
  @ApiTags('posts')
  @Controller('posts')
  export class PostController {
    constructor(private readonly postService: PostService) {}
  
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo bài viết mới' })
    @ApiResponse({ status: 201, description: 'Bài viết đã được tạo thành công' })
    async createPost(@Body() createPostDto: CreatePostDto, @Request() req) {
      return this.postService.createPost(createPostDto, req.user.id);
    }
  
    @Get()
    @ApiOperation({ summary: 'Lấy danh sách bài viết' })
    @ApiResponse({ status: 200, description: 'Danh sách bài viết' })
    async getPosts(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('type') type?: PostType,
      @Query('status') status?: PostStatus,
      @Query('hashtag') hashtag?: string,
      @Query('author') authorId?: string,
      @Query('room') roomId?: string,
    ) {
      const filter: any = { status: PostStatus.ACTIVE };
      
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (hashtag) filter.hashtags = hashtag;
      if (authorId) filter.author = authorId;
      if (roomId) filter.room = roomId;
      
      return this.postService.getPosts(filter, { page, limit });
    }
  
    @Get('trending')
    @ApiOperation({ summary: 'Lấy danh sách bài viết thịnh hành' })
    @ApiResponse({ status: 200, description: 'Danh sách bài viết thịnh hành' })
    async getTrendingPosts(
      @Query('limit') limit: number = 10,
    ) {
      return this.postService.getTrendingPosts(limit);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin bài viết theo ID' })
    @ApiResponse({ status: 200, description: 'Thông tin bài viết' })
    async getPostById(@Param('id') id: string) {
      return this.postService.getPostById(id);
    }
  
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật bài viết' })
    @ApiResponse({ status: 200, description: 'Bài viết đã được cập nhật' })
    async updatePost(
      @Param('id') id: string,
      @Body() updatePostDto: UpdatePostDto,
      @Request() req,
    ) {
      const post = await this.postService.getPostById(id);
      
      if (post.author.toString() !== req.user.id) {
        throw new ForbiddenException('Bạn không có quyền cập nhật bài viết này');
      }
      
      return this.postService.updatePost(id, updatePostDto);
    }
  
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa bài viết' })
    @ApiResponse({ status: 200, description: 'Bài viết đã được xóa' })
    async deletePost(@Param('id') id: string, @Request() req) {
      const post = await this.postService.getPostById(id);
      
      if (post.author.toString() !== req.user.id) {
        throw new ForbiddenException('Bạn không có quyền xóa bài viết này');
      }
      
      return this.postService.deletePost(id);
    }
  
    @Post(':id/like')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Thích bài viết' })
    @ApiResponse({ status: 200, description: 'Đã thích bài viết thành công' })
    async likePost(@Param('id') id: string, @Request() req) {
      return this.postService.likePost(id, req.user.id);
    }
  
    @Post(':id/unlike')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Bỏ thích bài viết' })
    @ApiResponse({ status: 200, description: 'Đã bỏ thích bài viết thành công' })
    async unlikePost(@Param('id') id: string, @Request() req) {
      return this.postService.unlikePost(id, req.user.id);
    }
  
    @Post(':id/share')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Chia sẻ bài viết' })
    @ApiResponse({ status: 201, description: 'Đã chia sẻ bài viết thành công' })
    async sharePost(
      @Param('id') id: string,
      @Body('content') content: string,
      @Request() req,
    ) {
      return this.postService.sharePost(id, content, req.user.id);
    }
  
    @Get(':id/comments')
    @ApiOperation({ summary: 'Lấy danh sách bình luận của bài viết' })
    @ApiResponse({ status: 200, description: 'Danh sách bình luận' })
    async getPostComments(
      @Param('id') id: string,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      return this.postService.getPostComments(id, { page, limit });
    }
  }