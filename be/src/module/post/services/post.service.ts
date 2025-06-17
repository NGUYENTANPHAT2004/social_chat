// modules/post/services/post.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema as MongooseSchema } from 'mongoose';
import { Post, PostDocument, PostStatus, PostType } from '../schemas/post.schema';
import { Comment, CommentDocument, CommentStatus } from '../schemas/comment.schema';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async createPost(createPostDto: CreatePostDto, authorId: string): Promise<Post> {
    const { content, type = PostType.TEXT, images, video, originalPostId, pollOptions, hashtags, mentionIds, roomId, location } = createPostDto;
    
    // Xử lý hashtag từ nội dung
    const extractedHashtags = this.extractHashtags(content);
    const allHashtags = [...new Set([...(hashtags || []), ...extractedHashtags])];
    
    // Tạo bài viết mới
    const newPost = new this.postModel({
      author: new MongooseSchema.Types.ObjectId(authorId),
      content,
      type,
      images: images || [],
      hashtags: allHashtags,
      status: PostStatus.ACTIVE,
    });
    
    // Thêm video nếu có
    if (video) {
      newPost.video = video;
    }
    
    // Thêm bài viết gốc nếu là share
    if (type === PostType.SHARED && originalPostId) {
      newPost.originalPost = new MongooseSchema.Types.ObjectId(originalPostId);
      
      // Tăng số lượt chia sẻ cho bài viết gốc
      await this.postModel.findByIdAndUpdate(originalPostId, { $inc: { shares: 1 } });
    }
    
    // Thêm poll options nếu là poll
    if (type === PostType.POLL && pollOptions && pollOptions.length > 0) {
      newPost.polls = pollOptions.map(option => ({
        option: option.option,
        votes: 0,
      }));
    }
    
    // Thêm mentions nếu có
    if (mentionIds && mentionIds.length > 0) {
      newPost.mentions = mentionIds.map(id => new MongooseSchema.Types.ObjectId(id));
    }
    
    // Thêm phòng nếu có
    if (roomId) {
      newPost.room = new MongooseSchema.Types.ObjectId(roomId);
    }
    
    // Thêm vị trí nếu có
    if (location) {
      newPost.location = {
        name: location.name || '',
        lat: location.lat || 0,
        lng: location.lng || 0
      };
    }
    
    return newPost.save();
  }

  async getPostById(id: string): Promise<Post> {
    const post = await this.postModel.findById(id)
      .populate('author', 'username avatar')
      .populate('mentions', 'username avatar')
      .populate('originalPost');
    
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    
    // Tăng số lượt xem
    post.views += 1;
    await post.save();
    
    return post;
  }

  async getPosts(
    filter: any = {},
    options = { page: 1, limit: 10 },
  ): Promise<{ posts: Post[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    // Mặc định chỉ hiển thị bài viết active
    if (!filter.status) {
      filter.status = PostStatus.ACTIVE;
    }
    
    const [posts, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username avatar')
        .populate('originalPost'),
      this.postModel.countDocuments(filter),
    ]);
    
    return {
      posts,
      total,
      page,
      limit,
    };
  }

  async getTrendingPosts(limit: number = 10): Promise<Post[]> {
    // Lấy các bài viết có nhiều tương tác nhất trong 7 ngày qua
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return this.postModel
      .find({
        status: PostStatus.ACTIVE,
        createdAt: { $gte: oneWeekAgo },
      })
      .sort({ likes: -1, comments: -1, shares: -1, views: -1 })
      .limit(limit)
      .populate('author', 'username avatar')
      .populate('originalPost');
  }

  async updatePost(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.postModel.findById(id);
    
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    
    // Cập nhật các trường được phép
    if (updatePostDto.content) {
      post.content = updatePostDto.content;
      
      // Cập nhật hashtag
      const extractedHashtags = this.extractHashtags(updatePostDto.content);
      const existingHashtags = post.hashtags || [];
      
      if (updatePostDto.hashtags) {
        post.hashtags = [...new Set([...updatePostDto.hashtags, ...extractedHashtags])];
      } else {
        post.hashtags = [...new Set([...existingHashtags, ...extractedHashtags])];
      }
    }
    
    if (updatePostDto.images) {
      post.images = updatePostDto.images;
    }
    
    if (updatePostDto.video) {
      post.video = updatePostDto.video;
    }
    
    if (updatePostDto.mentionIds) {
      post.mentions = updatePostDto.mentionIds.map(id => new MongooseSchema.Types.ObjectId(id));
    }
    
    if (updatePostDto.location) {
      post.location = {
        name: updatePostDto.location.name || '',
        lat: updatePostDto.location.lat || 0,
        lng: updatePostDto.location.lng || 0
      };
    }
    
    return post.save();
  }

  async deletePost(id: string): Promise<{ success: boolean; message: string }> {
    const post = await this.postModel.findById(id);
    
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    
    // Thay vì xóa, chuyển trạng thái thành DELETED
    post.status = PostStatus.DELETED;
    await post.save();
    
    // Ẩn tất cả comment của bài viết
    await this.commentModel.updateMany(
      { post: id },
      { status: CommentStatus.HIDDEN },
    );
    
    return { success: true, message: 'Bài viết đã được xóa' };
  }

  async likePost(id: string, userId: string): Promise<{ likes: number }> {
    const post = await this.postModel.findById(id);
    
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    
    // Tăng số lượt thích
    post.likes += 1;
    await post.save();
    
    return { likes: post.likes };
  }

  async unlikePost(id: string, userId: string): Promise<{ likes: number }> {
    const post = await this.postModel.findById(id);
    
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    
    // Giảm số lượt thích nhưng không để âm
    if (post.likes > 0) {
      post.likes -= 1;
      await post.save();
    }
    
    return { likes: post.likes };
  }

  async sharePost(originalPostId: string, content: string, userId: string): Promise<Post> {
    const originalPost = await this.postModel.findById(originalPostId);
    
    if (!originalPost) {
      throw new NotFoundException('Không tìm thấy bài viết gốc');
    }
    
    // Tạo bài viết chia sẻ
    const sharedPost = new this.postModel({
      author: new MongooseSchema.Types.ObjectId(userId),
      content: content || '',
      type: PostType.SHARED,
      originalPost: new MongooseSchema.Types.ObjectId(originalPostId),
      status: PostStatus.ACTIVE,
    });
    
    const savedPost = await sharedPost.save();
    
    // Tăng số lượt chia sẻ cho bài viết gốc
    originalPost.shares += 1;
    await originalPost.save();
    
    return savedPost;
  }

  async getPostComments(
    postId: string,
    options = { page: 1, limit: 10 },
  ): Promise<{ comments: Comment[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    const [comments, total] = await Promise.all([
      this.commentModel
        .find({
          post: new MongooseSchema.Types.ObjectId(postId),
          parent: { $exists: false }, // Chỉ lấy comment gốc, không lấy reply
          status: CommentStatus.ACTIVE,
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username avatar'),
      this.commentModel.countDocuments({
        post: new MongooseSchema.Types.ObjectId(postId),
        parent: { $exists: false },
        status: CommentStatus.ACTIVE,
      }),
    ]);
    
    return {
      comments,
      total,
      page,
      limit,
    };
  }

  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex) || [];
    
    return matches.map(tag => tag.substring(1)); // Bỏ ký tự # ở đầu
  }
}