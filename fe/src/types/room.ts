export interface Room {
  _id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'password';
  password?: string;
  owner: UserBasic;
  tags: string[];
  coverImage?: string;
  backgroundImage?: string;
  viewers: number;
  maxViewers: number;
  status: 'live' | 'inactive';
  streamKey?: string;
  streamUrl?: string;
  settings: RoomSettings;
  followers: string[];
  members: string[];
  createdAt: string;
  updatedAt: string;
  lastStreamStartTime?: string;
}

export interface RoomSettings {
  allowChat: boolean;
  allowGifts: boolean;
  minKCToJoin: number;
  slowMode: boolean;
  slowModeInterval: number;
  followersOnly: boolean;
  minAgeRequired: number;
}

export interface RoomMember {
  _id: string;
  username: string;
  avatar: string;
  displayName?: string;
  role: 'owner' | 'moderator' | 'member';
  joinedAt: string;
  kcBalance?: number;
  trustScore?: number;
}
export interface CreateRoomDto {
  name: string;
  description?: string;
  type?: 'public' | 'private' | 'password';
  password?: string;
  tags?: string[];
  coverImage?: string;
  backgroundImage?: string;
  settings?: Partial<RoomSettings>;
}

export interface UpdateRoomDto {
  name?: string;
  description?: string;
  type?: 'public' | 'private' | 'password';
  password?: string;
  tags?: string[];
  coverImage?: string;
  backgroundImage?: string;
  settings?: Partial<RoomSettings>;
}

export interface JoinRoomDto {
  password?: string;
}

export interface RoomQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'public' | 'private' | 'password' | 'all';
  status?: 'live' | 'inactive' | 'all';
  tags?: string[];
  sortBy?: 'createdAt' | 'viewers' | 'name';
  sortOrder?: 'asc' | 'desc';
  minViewers?: number;
  maxViewers?: number;
  ownerId?: string;
}

export interface RoomFilters {
  search: string;
  type: 'all' | 'public' | 'private' | 'password';
  status: 'all' | 'live' | 'inactive';
  tags: string[];
}

export interface StreamingInfo {
  isStreaming: boolean;
  streamUrl: string | null;
  streamKey: string | null;
  viewerCount: number;
  startTime?: string;
  duration?: number;
}