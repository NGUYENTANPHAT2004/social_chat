import { StreamStatus } from "./enums";

export interface Stream {
  _id: string;
  user: string;
  title: string;
  description: string;
  streamKey: string;
  status: StreamStatus;
  thumbnail: string;
  hlsUrl: string;
  tags: string[];
  currentViewers: number;
  totalViewers: number;
  likes: number;
  startedAt?: Date;
  endedAt?: Date;
  settings: {
    isPrivate: boolean;
    allowComments: boolean;
    autoRecord: boolean;
    lowLatencyMode: boolean;
    maxQuality: string;
  };
  createdAt: Date;
  updatedAt: Date;
}