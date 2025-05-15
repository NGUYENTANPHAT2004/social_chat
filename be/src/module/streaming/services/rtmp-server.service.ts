// modules/streaming/services/rtmp-server.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamingService } from './streaming.service';
import * as NodeMediaServer from 'node-media-server';
import * as ffmpeg from 'fluent-ffmpeg';

@Injectable()
export class RtmpServerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RtmpServerService.name);
  private nms: any;

  constructor(
    private configService: ConfigService,
    private streamingService: StreamingService,
  ) {}

  onModuleInit() {
    this.startRtmpServer();
  }

  onModuleDestroy() {
    this.stopRtmpServer();
  }

  private startRtmpServer() {
    const rtmpConfig = {
      rtmp: {
        port: this.configService.get<number>('streaming.rtmp.port'),
        chunk_size: this.configService.get<number>('streaming.rtmp.chunk_size'),
        gop_cache: true,
        ping: this.configService.get<number>('streaming.rtmp.ping'),
        ping_timeout: this.configService.get<number>('streaming.rtmp.ping_timeout'),
      },
      http: {
        port: 8000,
        allow_origin: '*',
      },
      trans: {
        ffmpeg: this.configService.get<string>('streaming.transcoding.ffmpeg_path'),
        tasks: [
          {
            app: 'live',
            hls: true,
            hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
            dash: true,
            dashFlags: '[f=dash:window_size=3:extra_window_size=5]',
          },
        ],
      },
    };

    this.nms = new NodeMediaServer(rtmpConfig);

    // Xử lý sự kiện khi một stream bắt đầu
    this.nms.on('prePublish', async (id, StreamPath, args) => {
      const streamKey = StreamPath.split('/')[2];
      
      try {
        await this.streamingService.startStream(streamKey);
        this.logger.log(`Stream bắt đầu: ${streamKey}`);
      } catch (error) {
        const session = this.nms.getSession(id);
        session.reject();
        this.logger.error(`Từ chối stream: ${streamKey}`, error.stack);
      }
    });

    // Xử lý sự kiện khi một stream kết thúc
    this.nms.on('donePublish', async (id, StreamPath, args) => {
      const streamKey = StreamPath.split('/')[2];
      
      try {
        await this.streamingService.endStream(streamKey);
        this.logger.log(`Stream kết thúc: ${streamKey}`);
      } catch (error) {
        this.logger.error(`Lỗi khi kết thúc stream: ${streamKey}`, error.stack);
      }
    });

    this.nms.run();
    this.logger.log(`RTMP Server đã khởi động tại cổng ${rtmpConfig.rtmp.port}`);
  }

  private stopRtmpServer() {
    if (this.nms) {
      this.nms.stop();
      this.logger.log('RTMP Server đã dừng');
    }
  }
}