// modules/moderation/services/google-vision.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';
@Injectable()
export class GoogleVisionService {
  private readonly logger = new Logger(GoogleVisionService.name);
  private client: ImageAnnotatorClient;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('content.moderation.googleVision.apiKey');
    
    if (apiKey) {
      this.client = new ImageAnnotatorClient({
        keyFilename: apiKey,
      });
    }
  }

  async moderateImage(imageUrl: string): Promise<any> {
    try {
      if (!this.client) {
        this.logger.warn('Google Vision API không được cấu hình');
        return { adult: 0, violence: 0, hate: 0, selfHarm: 0, score: 0 };
      }

      const [result] = await this.client.safeSearchDetection(imageUrl);
      const detection = result.safeSearchAnnotation;

      if (!detection) {
        return { adult: 0, violence: 0, hate: 0, selfHarm: 0, score: 0 };
      }

      // Chuyển đổi các giá trị chữ thành số
      const likelihoodMap = {
        UNKNOWN: 0,
        VERY_UNLIKELY: 0.1,
        UNLIKELY: 0.3,
        POSSIBLE: 0.5,
        LIKELY: 0.7,
        VERY_LIKELY: 0.9,
      };

      const adult = likelihoodMap[detection.adult] || 0;
      const violence = likelihoodMap[detection.violence] || 0;
      const hate = likelihoodMap[detection.racy] || 0;
      const selfHarm = 0; // Google Vision không có trực tiếp cho self harm

      // Tính điểm tổng
      const score = Math.max(adult, violence, hate);

      return { adult, violence, hate, selfHarm, score };
    } catch (error) {
      this.logger.error(`Lỗi khi kiểm duyệt hình ảnh: ${error.message}`, error.stack);
      return { adult: 0, violence: 0, hate: 0, selfHarm: 0, score: 0 };
    }
  }
}