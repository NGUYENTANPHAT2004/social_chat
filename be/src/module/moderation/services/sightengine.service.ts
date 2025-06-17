// modules/moderation/services/sightengine.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SightengineService {
  private readonly logger = new Logger(SightengineService.name);
  private user: string;
  private secret: string;

  constructor(private configService: ConfigService) {
    this.user = this.configService.get<string>('content.moderation.sightengine.user');
    this.secret = this.configService.get<string>('content.moderation.sightengine.secret');
  }

  async moderateImage(imageUrl: string): Promise<any> {
    try {
      if (!this.user || !this.secret) {
        this.logger.warn('Sightengine API không được cấu hình');
        return { nudity: 0, violence: 0, offensive: 0, score: 0 };
      }

      const response = await axios.get('https://api.sightengine.com/1.0/check.json', {
        params: {
          url: imageUrl,
          models: 'nudity,wad,offensive',
          api_user: this.user,
          api_secret: this.secret,
        },
      });

      const data = response.data;

      // Lấy kết quả
      const nudity = Math.max(
        data.nudity?.raw || 0, 
        data.nudity?.partial || 0, 
        data.nudity?.sexual_activity || 0
      );
      
      const violence = data.weapon || 0;
      const offensive = Math.max(
        data.offensive?.prob || 0,
        data.offensive?.nazi || 0,
        data.offensive?.confederate || 0
      );

      // Tính điểm tổng
      const score = Math.max(nudity, violence, offensive);

      return { nudity, violence, offensive, score };
    } catch (error) {
      this.logger.error(`Lỗi khi kiểm duyệt hình ảnh (Sightengine): ${error.message}`, error.stack);
      return { nudity: 0, violence: 0, offensive: 0, score: 0 };
    }
  }
}