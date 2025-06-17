// modules/post/services/comment.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema } from 'mongoose';
import { Comment, CommentDocument, CommentStatus } from '../schemas/comment.schema';
import { Post, PostDocument } from '../schemas/post.schema';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async createComment(postId: string, createCommentDto: CreateCommentDto, authorId: string): Promise<Comment> {
    const post = await this.postModel.findById(postId);
    
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    
    const { content, parentId, image, mentionIds } = createCommentDto;
    
    // Tạo comment mới
    const newComment = new this.commentModel({
      post: new Schema.Types.ObjectId(postId),
      author: new Schema.Types.ObjectId(authorId),
      content,
      status: CommentStatus.ACTIVE,
    });
    
    // Thêm parent nếu là reply
    if (parentId) {
      const parentComment = await this.commentModel.findById(parentId);
      
      if (!parentComment) {
        throw new NotFoundException('Không tìm thấy bình luận cha');
      }
      
      newComment.parent = new Schema.Types.ObjectId(parentId);
      
      // Tăng số replies cho comment cha
      parentComment.replies += 1;
      await parentComment.save();
    }
    
    // Thêm hình ảnh nếu có
    if (image) {
      newComment.image = image;
    }
    
    // Thêm mentions nếu có
    if (mentionIds && mentionIds.length > 0) {
      newComment.mentions = mentionIds.map(id => new Schema.Types.ObjectId(id));
    }
    
    const savedComment = await newComment.save();
    
    // Tăng số comments cho bài viết
    post.comments += 1;
    await post.save();
    
    return savedComment;
  }

  async getCommentById(id: string): Promise<Comment> {
    const comment = await this.commentModel.findById(id)
      .populate('author', 'username avatar')
      .populate('mentions', 'username avatar');
    
    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }
    
    return comment;
  }

  async getCommentReplies(
    parentId: string,
    options = { page: 1, limit: 10 },
  ): Promise<{ replies: Comment[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    const [replies, total] = await Promise.all([
      this.commentModel
        .find({
          parent: parentId,
          status: CommentStatus.ACTIVE,
        })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username avatar'),
      this.commentModel.countDocuments({
        parent: parentId,
        status: CommentStatus.ACTIVE,
      }),
    ]);
    
    return {
      replies,
      total,
      page,
      limit,
    };
  }

  async updateComment(id: string, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.commentModel.findById(id);
    
    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }
    
    // Cập nhật các trường được phép
    if (updateCommentDto.content) {
      comment.content = updateCommentDto.content;
    }
    
    if (updateCommentDto.image) {
      comment.image = updateCommentDto.image;
    }
    
    if (updateCommentDto.mentionIds) {
      comment.mentions = updateCommentDto.mentionIds.map(id => new Schema.Types.ObjectId(id));
    }
    
    return comment.save();
  }

  async deleteComment(id: string): Promise<{ success: boolean; message: string }> {
    const comment = await this.commentModel.findById(id);
    
    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }
    
    // Thay vì xóa, chuyển trạng thái thành DELETED
    comment.status = CommentStatus.DELETED;
    await comment.save();
    
    // Nếu là comment cha, ẩn tất cả reply
    if (!comment.parent) {
      await this.commentModel.updateMany(
        { parent: id },
        { status: CommentStatus.HIDDEN },
      );
    } else {
      // Nếu là reply, giảm số replies của comment cha
      await this.commentModel.findByIdAndUpdate(
        comment.parent,
        { $inc: { replies: -1 } },
      );
    }
    
    // Giảm số comment của bài viết
    await this.postModel.findByIdAndUpdate(
      comment.post,
      { $inc: { comments: -1 } },
    );
    
    return { success: true, message: 'Bình luận đã được xóa' };
  }

  async likeComment(id: string, userId: string): Promise<{ likes: number }> {
    const comment = await this.commentModel.findById(id);
    
    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }
    
    // Tăng số lượt thích
    comment.likes += 1;
    await comment.save();
    
    return { likes: comment.likes };
  }

  async unlikeComment(id: string, userId: string): Promise<{ likes: number }> {
    const comment = await this.commentModel.findById(id);
    
    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }
    
    // Giảm số lượt thích nhưng không để âm
    if (comment.likes > 0) {
      comment.likes -= 1;
      await comment.save();
    }
    
    return { likes: comment.likes };
  }
}