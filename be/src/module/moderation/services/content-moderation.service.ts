import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import axios from 'axios';

@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);
  private readonly rekognition: AWS.Rekognition;
  private readonly badWords: string[];

  constructor(private configService: ConfigService) {
    // Initialize AWS Rekognition for image moderation
    this.rekognition = new AWS.Rekognition({
      region: this.configService.get('storage.s3.region'),
      accessKeyId: this.configService.get('storage.s3.accessKeyId'),
      secretAccessKey: this.configService.get('storage.s3.secretAccessKey'),
    });

    // Load bad words list
    try {
      this.badWords = require('../../../assets/badwords.json');
      this.logger.log(`Loaded ${this.badWords.length} bad words`);
    } catch (error) {
      this.logger.warn('Failed to load bad words list');
      this.badWords = [];
    }
  }

  /**
   * Moderate text content for inappropriate language
   */
  async moderateText(text: string): Promise<{ isClean: boolean; filteredText: string; violations: string[] }> {
    if (!text) {
      return { isClean: true, filteredText: '', violations: [] };
    }

    // Simple word filtering
    let filteredText = text;
    const violations: string[] = [];
    const replacementChar = this.configService.get('content.moderation.wordFilters.replacementChar') || '*';

    // Check for bad words
    for (const badWord of this.badWords) {
      const regex = new RegExp(`\\b${badWord}\\b`, 'gi');
      if (regex.test(text)) {
        violations.push(badWord);
        filteredText = filteredText.replace(regex, replacementChar.repeat(badWord.length));
      }
    }

    // Use Google Cloud Natural Language API if available
    const apiKey = this.configService.get('content.moderation.services.google.apiKey');
    if (apiKey && this.configService.get('content.moderation.autoModeration')) {
      try {
        const response = await axios.post(
          `https://language.googleapis.com/v1/documents:analyzeSentiment?key=${apiKey}`,
          {
            document: {
              type: 'PLAIN_TEXT',
              content: text,
            },
          },
        );

        // Check sentiment score
        const sentiment = response.data.documentSentiment;
        if (sentiment.score < -0.7) {
          violations.push('negative_sentiment');
        }
      } catch (error) {
        this.logger.error(`Google NLP API error: ${error.message}`);
      }
    }

    return {
      isClean: violations.length === 0,
      filteredText,
      violations,
    };
  }

  /**
   * Moderate image content for inappropriate visuals
   */
  async moderateImage(imageBuffer: Buffer): Promise<{ isClean: boolean; violations: string[] }> {
    const violations: string[] = [];

    // Skip moderation if disabled
    if (!this.configService.get('content.moderation.autoModeration')) {
      return { isClean: true, violations: [] };
    }

    try {
      // Use AWS Rekognition for image moderation
      const params = {
        Image: {
          Bytes: imageBuffer,
        },
        MinConfidence: 60,
      };

      const moderationLabels = await this.rekognition.detectModerationLabels(params).promise();

      for (const label of moderationLabels.ModerationLabels) {
        violations.push(label.Name);
      }

      return {
        isClean: violations.length === 0,
        violations,
      };
    } catch (error) {
      this.logger.error(`Image moderation error: ${error.message}`);
      return { isClean: true, violations: [] }; // Default to accepting in case of error
    }
  }

  /**
   * Calculate trust score adjustment based on violation
   */
  calculateTrustScoreAdjustment(violations: string[]): number {
    if (violations.length === 0) {
      return 0;
    }

    // Different violations have different impact
    let scoreAdjustment = 0;
    for (const violation of violations) {
      switch (violation) {
        case 'Explicit Nudity':
        case 'Graphic Violence':
          scoreAdjustment -= 15;
          break;
        case 'Hate Symbols':
          scoreAdjustment -= 20;
          break;
        case 'negative_sentiment':
          scoreAdjustment -= 5;
          break;
        default:
          scoreAdjustment -= 3;
          break;
      }
    }

    return scoreAdjustment;
  }
}
