// be/src/config/content.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('content', () => ({
  moderation: {
    enabled: process.env.ENABLE_CONTENT_MODERATION === 'true',
    autoReject: process.env.AUTO_REJECT_FLAGGED_CONTENT === 'true',
    thresholds: {
      adult: 0.7,
      violence: 0.8,
      hate: 0.8,
      selfHarm: 0.9,
    },
    googleVision: {
      apiKey: process.env.GOOGLE_VISION_API_KEY
    },
    sightengine: {
      user: process.env.SIGHTENGINE_USER,
      secret: process.env.SIGHTENGINE_SECRET,
      models: ['nudity', 'wad', 'offensive', 'scam'],
    },
  },
  postLimits: {
    maxCharactersPerPost: 1000,
    maxImagesPerPost: 10,
    maxVideosPerPost: 1,
  },
  commentLimits: {
    maxCharactersPerComment: 500,
    maxNestedLevel: 3,
  },
  filters: {
    bannedWords: [
     
      'chửi thề', 'đm', 'vcl', 'dcm',
      
  
      'giết người', 'khủng bố', 'bom nổ', 'tấn công', 'ám sát', 'bạo loạn',
  

      'lật đổ chính quyền', 'phản động', 'chế độ thối nát', 'bôi nhọ lãnh đạo',
      'xúi giục biểu tình', 'đảng phản quốc', 'chia rẽ dân tộc', 'chính trị bẩn',
  
  
    ],
    replacement: '***',
  },
  caching: {
    ttl: 60 * 5, 
    max: 100, 
  },
}));