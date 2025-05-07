import { registerAs } from '@nestjs/config';

export default registerAs('streaming', () => ({
  rtmp: {
    port: parseInt(process.env.RTMP_PORT, 10) || 1935,
    chunk_size: parseInt(process.env.RTMP_CHUNK_SIZE, 10) || 60000,
    ping: parseInt(process.env.RTMP_PING, 10) || 30,
    ping_timeout: parseInt(process.env.RTMP_PING_TIMEOUT, 10) || 60,
  },
  hls: {
    path: process.env.HLS_PATH || '/live',
    fragment_duration: process.env.HLS_FRAGMENT_DURATION || '2',
    playlist_length: process.env.HLS_PLAYLIST_LENGTH || '60',
    segments_path: process.env.HLS_SEGMENTS_PATH || 'storage/live',
  },
  transcoding: {
    enabled: process.env.TRANSCODING_ENABLED === 'true',
    ffmpeg_path: process.env.FFMPEG_PATH || '/usr/bin/ffmpeg',
    profiles: {
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
    },
  },
}));