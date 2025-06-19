// src/types/ui.ts
export interface UIState {
  theme: 'light' | 'dark';
  language: 'vi' | 'en';
  sidebarCollapsed: boolean;
  modals: {
    createRoom: boolean;
    roomSettings: boolean;
    userProfile: boolean;
    [key: string]: boolean;
  };
  notifications: {
    enabled: boolean;
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  };
}

export interface LoadingState {
  [key: string]: boolean;
}

export interface UploadProgress {
  [fileId: string]: {
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
  };
}