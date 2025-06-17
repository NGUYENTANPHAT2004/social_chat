// modules/moderation/services/moderation.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema as MongooseSchema } from 'mongoose';
import { ConfigService } from '@nestjs/config';

import { ModerationLog, ModerationLogDocument, ModerationAction, ModerationStatus, ContentType } from '../schemas/moderation.schema';
import { Report, ReportDocument, ReportStatus, ReportType, ReportContentType } from '../schemas/report.schema';
import { ModerateContentDto } from '../dto/moderate-content.dto';
import { CreateReportDto } from '../dto/create-report.dto';
import { GoogleVisionService } from './google-vision.service';
import { SightengineService } from './sightengine.service';

@Injectable()
export class ModerationService {
  constructor(
    @InjectModel(ModerationLog.name) private moderationLogModel: Model<ModerationLogDocument>,
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    private configService: ConfigService,
    private googleVisionService: GoogleVisionService,
    private sightengineService: SightengineService,
  ) {}

  async moderateContent(moderateContentDto: ModerateContentDto): Promise<ModerationLog> {
    const { contentType, contentId, contentUrl, textContent, metadata } = moderateContentDto;

    // Kiểm tra nếu nội dung đã được kiểm duyệt trước đó
    const existingModeration = await this.moderationLogModel.findOne({
      contentType,
      contentId,
    });

    if (existingModeration) {
      // Nếu đã được kiểm duyệt và không phải trạng thái flagged, trả về kết quả
      if (existingModeration.status !== ModerationStatus.PENDING) {
        return existingModeration;
      }
    }

    // Kết quả kiểm duyệt tự động
    let autoModerationResults = {
      adult: 0,
      violence: 0,
      hate: 0,
      selfHarm: 0,
      score: 0,
    };

    // Thực hiện kiểm duyệt tự động dựa vào loại nội dung
    if (contentUrl && (contentType === ContentType.IMAGE || contentType === ContentType.VIDEO)) {
      if (contentType === ContentType.IMAGE) {
        // Kiểm duyệt hình ảnh
        const visionResults = await this.googleVisionService.moderateImage(contentUrl);
        const sightengineResults = await this.sightengineService.moderateImage(contentUrl);
        
        // Kết hợp kết quả từ các dịch vụ
        autoModerationResults = {
          adult: Math.max(visionResults.adult, sightengineResults.nudity),
          violence: Math.max(visionResults.violence, sightengineResults.violence),
          hate: Math.max(visionResults.hate, sightengineResults.offensive),
          selfHarm: visionResults.selfHarm,
          score: Math.max(visionResults.score, sightengineResults.score),
        };
      } else if (contentType === ContentType.VIDEO) {
        // Kiểm duyệt video (có thể thực hiện kiểm tra frame-by-frame)
        // Tạm thời sử dụng kiểm tra thumbnail
        const thumbnailResults = await this.sightengineService.moderateImage(contentUrl);
        autoModerationResults = {
          adult: thumbnailResults.nudity,
          violence: thumbnailResults.violence,
          hate: thumbnailResults.offensive,
          selfHarm: 0,
          score: thumbnailResults.score,
        };
      }
    } else if (textContent && contentType === ContentType.TEXT) {
      // Kiểm duyệt văn bản
      // Đây là một phương pháp đơn giản, có thể sử dụng các API phức tạp hơn
      const forbiddenWords = this.configService.get<string[]>('content.filters.bannedWords', []);
      let score = 0;
      
      forbiddenWords.forEach(word => {
        if (textContent.toLowerCase().includes(word.toLowerCase())) {
          score += 0.2; // Tăng 0.2 cho mỗi từ cấm tìm thấy
        }
      });
      
      autoModerationResults.hate = score;
      autoModerationResults.score = score;
    }

    // Quyết định hành động dựa trên kết quả kiểm duyệt
    let action = ModerationAction.FLAGGED;
    let status = ModerationStatus.PENDING;

    // Kiểm tra thông số cấu hình để quyết định tự động từ chối
    const enableContentModeration = this.configService.get<boolean>('content.moderation.enabled', true);
    const autoReject = this.configService.get<boolean>('content.moderation.autoReject', false);
    
    if (enableContentModeration && autoReject) {
      const thresholds = this.configService.get('content.moderation.thresholds', {
        adult: 0.7,
        violence: 0.8,
        hate: 0.8,
        selfHarm: 0.9,
      });
      
      // Tự động từ chối nếu vượt ngưỡng
      if (
        autoModerationResults.adult >= thresholds.adult ||
        autoModerationResults.violence >= thresholds.violence ||
        autoModerationResults.hate >= thresholds.hate ||
        autoModerationResults.selfHarm >= thresholds.selfHarm
      ) {
        action = ModerationAction.REJECTED;
        status = ModerationStatus.AUTO_MODERATED;
      }
    }

    // Lưu kết quả kiểm duyệt
    const moderationLog = new this.moderationLogModel({
      contentType,
      contentId,
      action,
      status,
      autoModerationResults,
      metadata: metadata || {},
    });

    return moderationLog.save();
  }

  async getModerationLogById(id: string): Promise<ModerationLog> {
    const moderationLog = await this.moderationLogModel.findById(id)
      .populate('contentOwner', 'username avatar')
      .populate('moderator', 'username');
    
    if (!moderationLog) {
      throw new NotFoundException('Không tìm thấy bản ghi kiểm duyệt');
    }
    
    return moderationLog;
  }

  async getModerationLogs(
    filters: any = {},
    options = { page: 1, limit: 10 },
  ): Promise<{ logs: ModerationLog[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    const [logs, total] = await Promise.all([
      this.moderationLogModel
        .find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('contentOwner', 'username avatar')
        .populate('moderator', 'username'),
      this.moderationLogModel.countDocuments(filters),
    ]);
    
    return {
      logs,
      total,
      page,
      limit,
    };
  }

  async updateModerationStatus(
    id: string,
    action: ModerationAction,
    moderatorId: string,
    reason?: string,
  ): Promise<ModerationLog> {
    const moderationLog = await this.moderationLogModel.findById(id);
    
    if (!moderationLog) {
      throw new NotFoundException('Không tìm thấy bản ghi kiểm duyệt');
    }
    
    moderationLog.action = action;
    moderationLog.status = ModerationStatus.REVIEWED;
    moderationLog.moderator = new MongooseSchema.Types.ObjectId(moderatorId);
    
    if (reason) {
      moderationLog.reason = reason;
    }
    
    return moderationLog.save();
  }

  async createReport(createReportDto: CreateReportDto, reporterId: string): Promise<Report> {
    const { contentType, contentId, reportType, description, evidences } = createReportDto;
    
    // Tạo báo cáo mới
    const report = new this.reportModel({
      reporter: reporterId,
      contentType,
      contentId,
      reportType,
      description: description || '',
      evidences: evidences || [],
      status: ReportStatus.PENDING,
    });
    
    return report.save();
  }

  async getReportById(id: string): Promise<Report> {
    const report = await this.reportModel.findById(id)
      .populate('reporter', 'username avatar')
      .populate('contentOwner', 'username avatar')
      .populate('moderator', 'username');
    
    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }
    
    return report;
  }

  async getReports(
    filters: any = {},
    options = { page: 1, limit: 10 },
  ): Promise<{ reports: Report[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    const [reports, total] = await Promise.all([
      this.reportModel
        .find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reporter', 'username avatar')
        .populate('contentOwner', 'username avatar')
        .populate('moderator', 'username'),
      this.reportModel.countDocuments(filters),
    ]);
    
    return {
      reports,
      total,
      page,
      limit,
    };
  }

  async updateReportStatus(
    id: string,
    status: ReportStatus,
    moderatorId: string,
    actionTaken?: string,
    moderationNotes?: string,
  ): Promise<Report> {
    const report = await this.reportModel.findById(id);
    
    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }
    
    report.status = status;
    report.moderator = new MongooseSchema.Types.ObjectId(moderatorId);
    
    if (actionTaken) {
      report.actionTaken = actionTaken;
    }
    
    if (moderationNotes) {
      report.moderationNotes = moderationNotes;
    }
    
    return report.save();
  }

  async getModerationStats(): Promise<any> {
    const [totalPending, totalReviewed, totalAutoModerated, approvedCount, rejectedCount] = await Promise.all([
      this.moderationLogModel.countDocuments({ status: ModerationStatus.PENDING }),
      this.moderationLogModel.countDocuments({ status: ModerationStatus.REVIEWED }),
      this.moderationLogModel.countDocuments({ status: ModerationStatus.AUTO_MODERATED }),
      this.moderationLogModel.countDocuments({ action: ModerationAction.APPROVED }),
      this.moderationLogModel.countDocuments({ action: ModerationAction.REJECTED }),
    ]);
    
    // Số lượng theo loại nội dung
    const contentTypeStats = await this.moderationLogModel.aggregate([
      {
        $group: {
          _id: '$contentType',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Dữ liệu theo ngày trong 7 ngày qua
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyStats = await this.moderationLogModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          approved: { 
            $sum: { 
              $cond: [{ $eq: ['$action', ModerationAction.APPROVED] }, 1, 0] 
            } 
          },
          rejected: { 
            $sum: { 
              $cond: [{ $eq: ['$action', ModerationAction.REJECTED] }, 1, 0] 
            } 
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    
    return {
      overview: {
        total: totalPending + totalReviewed + totalAutoModerated,
        pending: totalPending,
        reviewed: totalReviewed,
        autoModerated: totalAutoModerated,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      contentTypes: contentTypeStats,
      dailyStats,
    };
  }

  async getReportStats(): Promise<any> {
    const [totalPending, totalReviewed, totalRejected, totalResolved] = await Promise.all([
      this.reportModel.countDocuments({ status: ReportStatus.PENDING }),
      this.reportModel.countDocuments({ status: ReportStatus.REVIEWED }),
      this.reportModel.countDocuments({ status: ReportStatus.REJECTED }),
      this.reportModel.countDocuments({ status: ReportStatus.RESOLVED }),
    ]);
    
    // Số lượng theo loại báo cáo
    const reportTypeStats = await this.reportModel.aggregate([
      {
        $group: {
          _id: '$reportType',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Số lượng theo loại nội dung
    const contentTypeStats = await this.reportModel.aggregate([
      {
        $group: {
          _id: '$contentType',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Dữ liệu theo ngày trong 7 ngày qua
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyStats = await this.reportModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    
    return {
      overview: {
        total: totalPending + totalReviewed + totalRejected + totalResolved,
        pending: totalPending,
        reviewed: totalReviewed,
        rejected: totalRejected,
        resolved: totalResolved,
      },
      reportTypes: reportTypeStats,
      contentTypes: contentTypeStats,
      dailyStats,
    };
  }
}