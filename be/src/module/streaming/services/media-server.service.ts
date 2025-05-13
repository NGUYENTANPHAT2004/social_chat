import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as NodeMediaServer from 'node-media-server';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from '../../room/schemas/room.schema';

@Injectable()
export class MediaServerService implements OnModuleInit {
  private readonly logger = new Logger(MediaServerService.name);
  private nms: NodeMediaServer;

  constructor(
    private configService: ConfigService,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
  ) {}

  onModuleInit() {
    // Initialize is called in main.ts to ensure proper order
  }

  initializeMediaServer() {
    const rtmpConfig = this.configService.get('streaming.rtmp');
    const hlsConfig = this.configService.get('streaming.hls');
    const transcodingConfig = this.configService.get('streaming.transcoding');

    const config = {
      rtmp: {
        port: rtmpConfig.port,
        chunk_size: rtmpConfig.chunk_size,
        gop_cache: true,
        ping: rtmpConfig.ping,
        ping_timeout: rtmpConfig.ping_timeout,
      },
      http: {
        port: 8000,
        allow_origin: '*',
      },
      auth: {
        play: true,
        publish: true,
        secret: this.configService.get('auth.jwt.secret'),
      },
      trans: {
        ffmpeg: transcodingConfig.ffmpeg_path,
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

    this.nms = new NodeMediaServer(config);

    // Authentication for streaming
    this.nms.on('prePublish', async (id, StreamPath, args) => {
      const streamKey = StreamPath.split('/')[2];
      
      try {
        const room = await this.roomModel.findOne({ stream_key: streamKey });
        
        if (!room) {
          this.logger.warn(`Streaming attempt with invalid stream key: ${streamKey}`);
          const session = this.nms.getSession(id);
          session.reject();
        } else {
          // Update room status to live
          await this.roomModel.updateOne(
            { _id: room._id },
            { status: 'live' }
          );
          this.logger.log(`Stream started: ${room.title}`);
        }
      } catch (error) {
        this.logger.error(`Error during stream authentication: ${error.message}`);
        const session = this.nms.getSession(id);
        session.reject();
      }
    });

    // Handle stream end
    this.nms.on('donePublish', async (id, StreamPath, args) => {
      const streamKey = StreamPath.split('/')[2];
      
      try {
        const room = await this.roomModel.findOne({ stream_key: streamKey });
        
        if (room) {
          // Update room status to offline
          await this.roomModel.updateOne(
            { _id: room._id },
            { status: 'offline' }
          );
          this.logger.log(`Stream ended: ${room.title}`);
        }
      } catch (error) {
        this.logger.error(`Error during stream end handling: ${error.message}`);
      }
    });

    this.nms.run();
    this.logger.log('Media server started successfully');
  }

  getMediaServer() {
    return this.nms;
  }
}
