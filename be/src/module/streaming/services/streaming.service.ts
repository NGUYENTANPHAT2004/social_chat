// modules/streaming/services/streaming.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Stream, StreamDocument, StreamStatus } from '../schemas/stream.schema';
import { CreateStreamDto } from '../dto/create-stream.dto';

@Injectable()
export class StreamingService {
  constructor(
    @InjectModel(Stream.name) private streamModel: Model<StreamDocument>,
    private configService: ConfigService,
  ) {}

  async createStream(userId: string, createStreamDto: CreateStreamDto): Promise<Stream> {
    // Kiểm tra xem người dùng đã có stream chưa
    const existingStream = await this.streamModel.findOne({ user: userId });

    if (existingStream) {
      // Nếu có, cập nhật thông tin stream
      return this.updateStream(existingStream.id, userId, createStreamDto);
    }

    // Nếu chưa, tạo stream mới với stream key
    const streamKey = this.generateStreamKey();
    
    const newStream = new this.streamModel({
      user: userId,
      streamKey,
      title: createStreamDto.title,
      description: createStreamDto.description || '',
      tags: createStreamDto.tags || [],
      settings: {
        isPrivate: createStreamDto.isPrivate || false,
        allowComments: true,
        autoRecord: false,
        lowLatencyMode: false,
        maxQuality: createStreamDto.maxQuality || '720p',
      },
    });

    return newStream.save();
  }

  async getStreamKey(userId: string): Promise<{ streamKey: string }> {
    const stream = await this.streamModel.findOne({ user: userId });
    
    if (!stream) {
      // Tạo stream key mới nếu người dùng chưa có
      const newStream = await this.createStream(userId, { title: 'Live Stream' });
      return { streamKey: newStream.streamKey };
    }
    
    return { streamKey: stream.streamKey };
  }

  async regenerateStreamKey(userId: string): Promise<{ streamKey: string }> {
    const stream = await this.streamModel.findOne({ user: userId });
    
    if (!stream) {
      throw new NotFoundException('Không tìm thấy stream');
    }
    
    const newStreamKey = this.generateStreamKey();
    stream.streamKey = newStreamKey;
    await stream.save();
    
    return { streamKey: newStreamKey };
  }

  async getStreamById(id: string): Promise<Stream> {
    const stream = await this.streamModel.findById(id).populate('user', 'username avatar');
    
    if (!stream) {
      throw new NotFoundException('Không tìm thấy stream');
    }
    
    return stream;
  }

  async getStreamByKey(streamKey: string): Promise<Stream> {
    const stream = await this.streamModel.findOne({ streamKey });
    
    if (!stream) {
      throw new NotFoundException('Không tìm thấy stream');
    }
    
    return stream;
  }

  async updateStream(id: string, userId: string, updateStreamDto: CreateStreamDto): Promise<Stream> {
    const stream = await this.streamModel.findById(id);
    
    if (!stream) {
      throw new NotFoundException('Không tìm thấy stream');
    }
    
    // Kiểm tra quyền sở hữu
    if (stream.user.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật stream này');
    }
    
    // Cập nhật thông tin stream
    if (updateStreamDto.title) stream.title = updateStreamDto.title;
    if (updateStreamDto.description !== undefined) stream.description = updateStreamDto.description;
    if (updateStreamDto.tags !== undefined) stream.tags = updateStreamDto.tags;
    
    if (updateStreamDto.isPrivate !== undefined) {
      stream.settings.isPrivate = updateStreamDto.isPrivate;
    }
    
    if (updateStreamDto.maxQuality !== undefined) {
      stream.settings.maxQuality = updateStreamDto.maxQuality;
    }
    
    return stream.save();
  }

  async deleteStream(id: string, userId: string): Promise<void> {
    const stream = await this.streamModel.findById(id);
    
    if (!stream) {
      throw new NotFoundException('Không tìm thấy stream');
    }
    
    // Kiểm tra quyền sở hữu
    if (stream.user.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa stream này');
    }
    
    await this.streamModel.findByIdAndDelete(id);
  }

  async getUserStreams(userId: string, options = { page: 1, limit: 10 }): Promise<{ streams: Stream[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    const [streams, total] = await Promise.all([
      this.streamModel
        .find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username avatar'),
      this.streamModel.countDocuments({ user: userId }),
    ]);
    
    return {
      streams,
      total,
      page,
      limit,
    };
  }

  async getStreamsByStatus(
    status: StreamStatus,
    options = { page: 1, limit: 10 },
    tag?: string,
  ): Promise<{ streams: Stream[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    const query: any = { status };
    if (tag) {
      query.tags = tag;
    }
    
    const [streams, total] = await Promise.all([
      this.streamModel
        .find(query)
        .sort({ currentViewers: -1, startedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username avatar'),
      this.streamModel.countDocuments(query),
    ]);
    
    return {
      streams,
      total,
      page,
      limit,
    };
  }

  async startStream(streamKey: string): Promise<Stream> {
    const stream = await this.streamModel.findOne({ streamKey });
    
    if (!stream) {
      throw new NotFoundException('Không tìm thấy stream với stream key này');
    }
    
    if (stream.status === StreamStatus.BANNED) {
      throw new ForbiddenException('Stream này đã bị cấm');
    }
    
    // Cập nhật trạng thái stream
    stream.status = StreamStatus.LIVE;
    stream.startedAt = new Date();
    stream.currentViewers = 0;
    
    // Tạo URL HLS
    const hlsBasePath = this.configService.get<string>('streaming.hls.path');
    stream.hlsUrl = `${hlsBasePath}/${stream.streamKey}/index.m3u8`;
    
    return stream.save();
  }

  async endStream(streamKey: string): Promise<Stream> {
    const stream = await this.streamModel.findOne({ streamKey });
    
    if (!stream) {
      throw new NotFoundException('Không tìm thấy stream với stream key này');
    }
    
    // Cập nhật trạng thái stream
    stream.status = StreamStatus.OFFLINE;
    stream.endedAt = new Date();
    stream.currentViewers = 0;
    
    return stream.save();
  }

  async watchStream(streamId: string, userId: string): Promise<{ currentViewers: number }> {
    const stream = await this.streamModel.findById(streamId);
    
    if (!stream) {
      throw new NotFoundException('Không tìm thấy stream');
    }
    
    if (stream.status !== StreamStatus.LIVE) {
      throw new BadRequestException('Stream không phát trực tiếp');
    }
    
    // Tăng số người xem
    stream.currentViewers += 1;
    stream.totalViewers += 1;
    await stream.save();
    
    return { currentViewers: stream.currentViewers };
  }

  async likeStream(streamId: string, userId: string): Promise<{ likes: number }> {
    const stream = await this.streamModel.findById(streamId);
    
    if (!stream) {
      throw new NotFoundException('Không tìm thấy stream');
    }
    
    // Tăng số lượt thích
    stream.likes += 1;
    await stream.save();
    
    return { likes: stream.likes };
  }

  private generateStreamKey(): string {
    return uuidv4();
  }
}