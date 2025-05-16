// modules/post/post.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { PostController } from './controllers/post.controller';
import { CommentController } from './controllers/comment.controller';
import { PostService } from './services/post.service';
import { CommentService } from './services/comment.service';
import { Post, PostSchema } from './schemas/post.schema';
import { Comment, CommentSchema } from './schemas/comment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
    ConfigModule,
  ],
  controllers: [PostController, CommentController],
  providers: [PostService, CommentService],
  exports: [PostService, CommentService],
})
export class PostModule {}