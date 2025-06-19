import { ContentType, ModerationAction, ModerationStatus, ReportContentType, ReportStatus, ReportType } from "./enums";

export interface Report {
  _id: string;
  reporter: string;
  contentType: ReportContentType;
  contentId: string;
  contentOwner?: string;
  reportType: ReportType;
  description: string;
  status: ReportStatus;
  assignee?: string;
  resolutionNotes: string;
  resolvedAt?: Date;
  evidences: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Moderation Interfaces
export interface ModerationLog {
  _id: string;
  contentType: ContentType;
  contentId: string;
  action: ModerationAction;
  status: ModerationStatus;
  contentOwner?: string;
  moderator?: string;
  reason: string;
  autoModerationResults: {
    adult: number;
    violence: number;
    hate: number;
    selfHarm: number;
    score: number;
  };
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}