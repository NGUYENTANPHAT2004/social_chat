// modules/streaming/services/media-server.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as NodeMediaServer from 'node-media-server';
import * as fs from 'fs';
import * as path from 'path';
import { StreamingService } from './streaming.service';

@Injectable()
export class MediaServerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MediaServerService.name);
  private nms: any;

  constructor(
    private configService: ConfigService,
    private streamingService: StreamingService,
  ) {}

  onModuleInit() {
    this.setupFolders();
    this.startMediaServer();
  }

  onModuleDestroy() {
    this.stopMediaServer();
  }

  private setupFolders() {
    // Tạo thư mục chứa các file HLS
    const segmentsPath = this.configService.get<string>('streaming.hls.segments_path', 'storage/live');
    
    if (!fs.existsSync(segmentsPath)) {
      try {
        fs.mkdirSync(segmentsPath, { recursive: true });
        this.logger.log(`Đã tạo thư mục HLS segments: ${segmentsPath}`);
      } catch (error) {
        this.logger.error(`Không thể tạo thư mục HLS segments: ${error.message}`, error.stack);
      }
    }
  }

  private startMediaServer() {
    const rtmpPort = this.configService.get<number>('streaming.rtmp.port', 1935);
    const rtmpChunkSize = this.configService.get<number>('streaming.rtmp.chunk_size', 60000);
    const rtmpPing = this.configService.get<number>('streaming.rtmp.ping', 30);
    const rtmpPingTimeout = this.configService.get<number>('streaming.rtmp.ping_timeout', 60);
    
    const hlsPath = this.configService.get<string>('streaming.hls.path', '/live');
    const hlsFragmentDuration = this.configService.get<string>('streaming.hls.fragment_duration', '2');
    const hlsPlaylistLength = this.configService.get<string>('streaming.hls.playlist_length', '60');
    const segmentsPath = this.configService.get<string>('streaming.hls.segments_path', 'storage/live');
    
    const transcodingEnabled = this.configService.get<boolean>('streaming.transcoding.enabled', true);
    const ffmpegPath = this.configService.get<string>('streaming.transcoding.ffmpeg_path', '/usr/bin/ffmpeg');
    const transcodingProfiles = this.configService.get('streaming.transcoding.profiles', {
      '360p': {
        resolution: '640x360',
        bitrate: '800k',
        fps: 30,
      },
      '480p': {
        resolution: '854x480',
        bitrate: '1200k',
        fps: 30,
      },
      '720p': {
        resolution: '1280x720',
        bitrate: '2500k',
        fps: 60,
      },
    });

    // Cấu hình Node-Media-Server
    const config = {
      rtmp: {
        port: rtmpPort,
        chunk_size: rtmpChunkSize,
        gop_cache: true,
        ping: rtmpPing,
        ping_timeout: rtmpPingTimeout,
      },
      http: {
        port: 8000,
        mediaroot: segmentsPath,
        allow_origin: '*',
      },
      trans: {
        ffmpeg: ffmpegPath,
        tasks: transcodingEnabled ? this.generateTranscodingTasks(transcodingProfiles) : [],
      },
      auth: {
        api: true,
        api_user: this.configService.get<string>('server.api_user', 'admin'),
        api_pass: this.configService.get<string>('server.api_pass', 'admin'),
        play: false,
        publish: true,
        secret: this.configService.get<string>('auth.jwt.secret', 'secretkey'),
      },
    };

    // Khởi tạo Node-Media-Server
    this.nms = new NodeMediaServer(config);

    // Đăng ký các xử lý sự kiện
    this.nms.on('prePublish', this.handlePrePublish.bind(this));
    this.nms.on('donePublish', this.handleDonePublish.bind(this));
    this.nms.on('prePlay', this.handlePrePlay.bind(this));
    this.nms.on('donePlay', this.handleDonePlay.bind(this));

    // Khởi động Node-Media-Server
    this.nms.run();
    this.logger.log(`Media Server đã khởi động trên cổng RTMP: ${rtmpPort}, HTTP: 8000`);
  }

  private generateTranscodingTasks(profiles: any) {
    const tasks = [];
    
    // Tạo task transcoding cho HLS
    tasks.push({
      app: 'live',
      hls: true,
      hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
      dash: true,
      dashFlags: '[f=dash:window_size=3:extra_window_size=5]',
      profiles: this.convertProfilesToFFmpegArgs(profiles),
    });
    
    return tasks;
  }

  private convertProfilesToFFmpegArgs(profiles: any) {
    const result = {};
    
    for (const [name, profile] of Object.entries(profiles)) {
      result[name] = `
        -c:v libx264 -preset veryfast -profile:v main 
        -s ${profile.resolution} -b:v ${profile.bitrate} -r ${profile.fps} 
        -c:a aac -b:a 128k -ac 2
      `;
    }
    
    return result;
  }

  private async handlePrePublish(id, StreamPath, args) {
    try {
      const streamKey = this.parseStreamKey(StreamPath);
      this.logger.log(`Chuẩn bị phát sóng với stream key: ${streamKey}`);
      
      const stream = await this.streamingService.getStreamByKey(streamKey);
      if (!stream) {
        this.logger.warn(`Stream key không hợp lệ: ${streamKey}`);
        const session = this.nms.getSession(id);
        session.reject();
        return;
      }
      
      // Kiểm tra xem stream có được phép phát không
      if (stream.user && stream.room) {
        await this.streamingService.startStream(streamKey);
        this.logger.log(`Stream được bắt đầu: ${streamKey}`);
      } else {
        this.logger.warn(`Stream không được phép phát: ${streamKey}`);
        const session = this.nms.getSession(id);
        session.reject();
      }
    } catch (error) {
      this.logger.error(`Lỗi khi bắt đầu stream: ${error.message}`, error.stack);
      const session = this.nms.getSession(id);
      session.reject();
    }
  }

  private async handleDonePublish(id, StreamPath, args) {
    try {
      const streamKey = this.parseStreamKey(StreamPath);
      this.logger.log(`Kết thúc phát sóng với stream key: ${streamKey}`);
      
      await this.streamingService.endStream(streamKey);
      this.logger.log(`Stream đã kết thúc: ${streamKey}`);
      
      // Tùy chọn: Lưu bản ghi (recording) nếu cần
      // Tùy chọn: Thông báo cho người dùng
    } catch (error) {
      this.logger.error(`Lỗi khi kết thúc stream: ${error.message}`, error.stack);
    }
  }

  private async handlePrePlay(id, StreamPath, args) {
    try {
      const streamKey = this.parseStreamKey(StreamPath);
      this.logger.log(`Chuẩn bị xem stream: ${streamKey}`);
      
      // Tùy chọn: Kiểm tra quyền xem
      // Tùy chọn: Tăng số lượng người xem
    } catch (error) {
      this.logger.error(`Lỗi khi bắt đầu xem stream: ${error.message}`, error.stack);
    }
  }

  private async handleDonePlay(id, StreamPath, args) {
    try {
      const streamKey = this.parseStreamKey(StreamPath);
      this.logger.log(`Kết thúc xem stream: ${streamKey}`);
      
      // Tùy chọn: Giảm số lượng người xem
    } catch (error) {
      this.logger.error(`Lỗi khi kết thúc xem stream: ${error.message}`, error.stack);
    }
  }

  private parseStreamKey(streamPath: string): string {
    // Định dạng streamPath: /live/streamKey
    const parts = streamPath.split('/');
    return parts[parts.length - 1];
  }

  private stopMediaServer() {
    if (this.nms) {
      this.nms.stop();
      this.logger.log('Media Server đã dừng');
    }
  }

  // API methods for external usage
  isStreamLive(streamKey: string): boolean {
    if (!this.nms) return false;
    
    const publishers = this.nms.getPublishers();
    return publishers.has(`/live/${streamKey}`);
  }

  getActiveLiveStreams(): string[] {
    if (!this.nms) return [];
    
    const publishers = this.nms.getPublishers();
    const streamKeys = [];
    
    for (const streamPath of publishers.keys()) {
      const streamKey = this.parseStreamKey(streamPath);
      streamKeys.push(streamKey);
    }
    
    return streamKeys;
  }

  killStream(streamKey: string): boolean {
    if (!this.nms) return false;
    
    const streamPath = `/live/${streamKey}`;
    const publishers = this.nms.getPublishers();
    
    if (publishers.has(streamPath)) {
      const publisher = publishers.get(streamPath);
      if (publisher && publisher.id) {
        const session = this.nms.getSession(publisher.id);
        if (session) {
          session.stop();
          return true;
        }
      }
    }
    
    return false;
  }

  generateStreamThumbnail(streamKey: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const segmentsPath = this.configService.get<string>('streaming.hls.segments_path', 'storage/live');
        const outputDir = path.join(segmentsPath, 'thumbnails');
        const outputPath = path.join(outputDir, `${streamKey}.jpg`);
        
        // Đảm bảo thư mục tồn tại
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Sử dụng FFmpeg để tạo thumbnail
        const { spawn } = require('child_process');
        const ffmpeg = spawn(
          this.configService.get('streaming.transcoding.ffmpeg_path', 'ffmpeg'),
          [
            '-i', `http://localhost:8000/live/${streamKey}/index.m3u8`,
            '-ss', '00:00:01',
            '-vframes', '1',
            '-vf', 'scale=640:360',
            '-y',
            outputPath,
          ]
        );
        
        ffmpeg.on('close', (code) => {
          if (code === 0) {
            resolve(`/thumbnails/${streamKey}.jpg`);
          } else {
            reject(new Error(`FFmpeg exited with code ${code}`));
          }
        });
        
        ffmpeg.stderr.on('data', (data) => {
          this.logger.debug(`FFmpeg: ${data}`);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}