import { CommentStatus, PostStatus, PostType } from "./enums";

export interface Post {
  _id: string;
  author: string;
  content: string;
  type: PostType;
  status: PostStatus;
  images: string[];
  video: string;
  originalPost?: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  polls: Array<{ option: string; votes: number }>;
  hashtags: string[];
  mentions: string[];
  room?: string;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  _id: string;
  post: string;
  author: string;
  content: string;
  parent?: string;
  status: CommentStatus;
  likes: number;
  replies: number;
  image: string;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
}