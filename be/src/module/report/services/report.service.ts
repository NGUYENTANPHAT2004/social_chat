// modules/report/services/report.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema as MongooseSchema } from 'mongoose';
import { Report, ReportDocument, ReportStatus, ReportType, ReportContentType } from '../schemas/report.schema';
import { CreateReportDto } from '../dto/create-report.dto';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
  ) {}

  async createReport(createReportDto: CreateReportDto, reporterId: string): Promise<Report> {
    const { contentType, contentId, reportType, description = '', evidences = [] } = createReportDto;
    
    // Tạo báo cáo mới
    const newReport = new this.reportModel({
      reporter: new MongooseSchema.Types.ObjectId(reporterId),
      contentType,
      contentId: new MongooseSchema.Types.ObjectId(contentId),
      reportType,
      description,
      evidences,
      status: ReportStatus.PENDING,
      createdAt: new Date(),
    });
    
    // Trong thực tế, bạn sẽ cần tìm kiếm contentOwner dựa trên contentType và contentId
    // Ví dụ: nếu contentType là POST, bạn sẽ truy vấn bảng Post để lấy thông tin author
    // Giả sử ở đây ta có một phương thức trợ giúp
    const contentOwner = await this.getContentOwner(contentType, contentId);
    
    if (contentOwner) {
      newReport.contentOwner = new MongooseSchema.Types.ObjectId(contentOwner);
    }
    
    return newReport.save();
  }

  async getReportById(id: string): Promise<Report> {
    const report = await this.reportModel.findById(id)
      .populate('reporter', 'username avatar')
      .populate('contentOwner', 'username avatar')
      .populate('assignee', 'username avatar');
    
    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }
    
    return report;
  }

  async getReports(
    filter: any = {},
    options = { page: 1, limit: 10 },
  ): Promise<{ reports: Report[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    const [reports, total] = await Promise.all([
      this.reportModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reporter', 'username avatar')
        .populate('contentOwner', 'username avatar')
        .populate('assignee', 'username avatar'),
      this.reportModel.countDocuments(filter),
    ]);
    
    return {
      reports,
      total,
      page,
      limit,
    };
  }

  async getUserReports(
    userId: string,
    options = { page: 1, limit: 10 },
  ): Promise<{ reports: Report[]; total: number; page: number; limit: number }> {
    return this.getReports({ reporter: new MongooseSchema.Types.ObjectId(userId) }, options);
  }

  async assignReport(id: string, assigneeId: string): Promise<Report> {
    const report = await this.reportModel.findById(id);
    
    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }
    
    // Cập nhật người được gán
    report.assignee = new MongooseSchema.Types.ObjectId(assigneeId);
    
    // Nếu đang ở trạng thái pending, chuyển sang investigating
    if (report.status === ReportStatus.PENDING) {
      report.status = ReportStatus.INVESTIGATING;
    }
    
    return report.save();
  }

  async updateReportStatus(
    id: string,
    status: ReportStatus,
    userId: string,
    notes?: string,
  ): Promise<Report> {
    const report = await this.reportModel.findById(id);
    
    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }
    
    // Cập nhật trạng thái
    report.status = status;
    
    // Thêm ghi chú nếu có
    if (notes) {
      report.resolutionNotes = notes;
    }
    
    // Cập nhật người xử lý nếu chưa có
    if (!report.assignee) {
      report.assignee = new MongooseSchema.Types.ObjectId(userId);
    }
    
    // Cập nhật ngày xử lý nếu đã giải quyết
    if (status === ReportStatus.RESOLVED || status === ReportStatus.REJECTED) {
      report.resolvedAt = new Date();
    }
    
    return report.save();
  }

  async resolveReport(id: string, notes: string, userId: string): Promise<Report> {
    return this.updateReportStatus(id, ReportStatus.RESOLVED, userId, notes);
  }

  async getReportStatistics(): Promise<any> {
    // Thống kê theo trạng thái
    const statusStats = await this.reportModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Thống kê theo loại báo cáo
    const typeStats = await this.reportModel.aggregate([
      {
        $group: {
          _id: '$reportType',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Thống kê theo loại nội dung
    const contentTypeStats = await this.reportModel.aggregate([
      {
        $group: {
          _id: '$contentType',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Thống kê theo ngày trong 7 ngày qua
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
    
    // Thống kê tổng hợp
    const [totalPending, totalInvestigating, totalResolved, totalRejected] = await Promise.all([
      this.reportModel.countDocuments({ status: ReportStatus.PENDING }),
      this.reportModel.countDocuments({ status: ReportStatus.INVESTIGATING }),
      this.reportModel.countDocuments({ status: ReportStatus.RESOLVED }),
      this.reportModel.countDocuments({ status: ReportStatus.REJECTED }),
    ]);
    
    return {
      overview: {
        total: totalPending + totalInvestigating + totalResolved + totalRejected,
        pending: totalPending,
        investigating: totalInvestigating,
        resolved: totalResolved,
        rejected: totalRejected,
      },
      statusStats,
      typeStats,
      contentTypeStats,
      dailyStats,
    };
  }

  // Phương thức này sẽ được thay thế bằng logic thực tế
  private async getContentOwner(contentType: ReportContentType, contentId: string): Promise<string | null> {
    // Trong thực tế, bạn sẽ truy vấn các model khác nhau dựa trên contentType
    // Ví dụ:
    // switch (contentType) {
    //   case ReportContentType.POST:
    //     const post = await this.postModel.findById(contentId);
    //     return post?.author;
    //   case ReportContentType.USER:
    //     return contentId; // Trong trường hợp này, contentId chính là userId
    //   // ... xử lý các trường hợp khác
    // }
    
    return null;
  }
}