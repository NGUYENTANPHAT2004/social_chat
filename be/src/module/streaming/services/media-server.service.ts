// be/src/module/streaming/services/media-server.service.ts (Fixed version)
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as NodeMediaServer from 'node-media-server';
import * as fs from 'fs';
import * as path from 'path';
import { StreamingService } from './streaming.service';

@Injectable()
export class MediaServerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MediaServerService.name);
  private nms: NodeMediaServer;
  private isEnabled = false;

  constructor(
    private configService: ConfigService,
    private streamingService: StreamingService,
  ) {}

  onModuleInit() {
    // Chỉ khởi động nếu streaming được enable
    const streamingEnabled = this.configService.get<boolean>('streaming.enabled', false);
    
    if (streamingEnabled) {
      this.setupFolders();
      this.startMediaServer();
      this.isEnabled = true;
    } else {
      this.logger.warn('📺 Streaming service disabled. Set STREAMING_ENABLED=true to enable.');
    }
  }

  onModuleDestroy() {
    this.stopMediaServer();
  }

  private setupFolders() {
    try {
      // Tạo thư mục chứa các file HLS
      const segmentsPath = this.configService.get<string>('streaming.hls.segments_path', './storage/live');
      const absolutePath = path.resolve(segmentsPath);
      
      if (!fs.existsSync(absolutePath)) {
        fs.mkdirSync(absolutePath, { recursive: true });
        this.logger.log(`✅ Created HLS segments directory: ${absolutePath}`);
      }

      // Tạo thư mục thumbnails
      const thumbnailsPath = path.join(absolutePath, 'thumbnails');
      if (!fs.existsSync(thumbnailsPath)) {
        fs.mkdirSync(thumbnailsPath, { recursive: true });
        this.logger.log(`✅ Created thumbnails directory: ${thumbnailsPath}`);
      }

    } catch (error) {
      this.logger.error(`❌ Error creating directories: ${error.message}`, error.stack);
    }
  }

  private startMediaServer() {
    try {
      const rtmpPort = this.configService.get<number>('streaming.rtmp.port', 1935);
      const httpPort = this.configService.get<number>('streaming.http.port', 8001); // Changed default port
      const segmentsPath = this.configService.get<string>('streaming.hls.segments_path', './storage/live');
      const absolutePath = path.resolve(segmentsPath);
      
      // Check FFmpeg availability
      const ffmpegPath = this.configService.get<string>('streaming.transcoding.ffmpeg_path', 'ffmpeg');
      const transcodingEnabled = this.configService.get<boolean>('streaming.transcoding.enabled', false);

      // Configuration với error handling
      const config = {
        rtmp: {
          port: rtmpPort,
          chunk_size: this.configService.get<number>('streaming.rtmp.chunk_size', 60000),
          gop_cache: true,
          ping: this.configService.get<number>('streaming.rtmp.ping', 30),
          ping_timeout: this.configService.get<number>('streaming.rtmp.ping_timeout', 60),
        },
        http: {
          port: httpPort,
          mediaroot: absolutePath, // Fixed: use absolute path
          allow_origin: '*',
        },
        auth: {
          api: false, // Tạm tắt API auth để tránh conflict
          play: false,
          publish: false, // Tạm tắt auth để test
        }
      };

      // Chỉ thêm transcoding config nếu enabled và FFmpeg available
      if (transcodingEnabled) {
        config['trans'] = {
          ffmpeg: ffmpegPath,
          tasks: [{
            app: 'live',
            hls: true,
            hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
          }]
        };
      }

      this.nms = new NodeMediaServer(config);

      // Event handlers với error handling
      this.nms.on('prePublish', this.handlePrePublish.bind(this));
      this.nms.on('donePublish', this.handleDonePublish.bind(this));
      this.nms.on('prePlay', this.handlePrePlay.bind(this));
      this.nms.on('donePlay', this.handleDonePlay.bind(this));

      // Error handling
      this.nms.on('error', (error) => {
        this.logger.error(`❌ Media Server Error: ${error.message}`);
      });

      this.nms.run();
      this.logger.log(`✅ Media Server started - RTMP: ${rtmpPort}, HTTP: ${httpPort}`);
      this.logger.log(`📁 Media root: ${absolutePath}`);
      
    } catch (error) {
      this.logger.error(`❌ Failed to start Media Server: ${error.message}`, error.stack);
    }
  }

  private stopMediaServer() {
    if (this.nms && this.isEnabled) {
      try {
        this.nms.stop();
        this.logger.log('✅ Media Server stopped');
      } catch (error) {
        this.logger.error(`❌ Error stopping Media Server: ${error.message}`);
      }
    }
  }

  private async handlePrePublish(id, StreamPath, args) {
    try {
      const streamKey = StreamPath.split('/')[2];
      this.logger.log(`🎥 Stream started: ${streamKey}`);
      
      // Validate stream with service
      if (this.streamingService) {
        await this.streamingService.startStream(streamKey);
      }
    } catch (error) {
      this.logger.error(`❌ Stream validation failed: ${error.message}`);
      const session = this.nms?.getSession(id);
      if (session) {
        session.reject();
      }
    }
  }

  private async handleDonePublish(id, StreamPath, args) {
    try {
      const streamKey = StreamPath.split('/')[2];
      this.logger.log(`🎬 Stream ended: ${streamKey}`);
      
      if (this.streamingService) {
        await this.streamingService.endStream(streamKey);
      }
    } catch (error) {
      this.logger.error(`❌ Error ending stream: ${error.message}`);
    }
  }

  private handlePrePlay(id, StreamPath, args) {
    const streamKey = StreamPath.split('/')[2];
    this.logger.log(`▶️  Viewer joined: ${streamKey}`);
  }

  private handleDonePlay(id, StreamPath, args) {
    const streamKey = StreamPath.split('/')[2];
    this.logger.log(`⏹️  Viewer left: ${streamKey}`);
  }

  // Public methods for external use
  isMediaServerRunning(): boolean {
    return this.isEnabled && !!this.nms;
  }

  getStreamInfo(streamKey: string) {
    if (!this.nms) return null;
    
    // Implementation depends on node-media-server API
    return {
      streamKey,
      url: `http://localhost:${this.configService.get('streaming.http.port', 8001)}/live/${streamKey}/index.m3u8`
    };
  }
}