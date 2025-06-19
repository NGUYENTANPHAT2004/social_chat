export * from './api';
export * from './user';
export * from './room';
export * from './message';
export * from './socket';
export * from './state';
export * from './game';
export * from './gift';
export * from './notification';
export * from './transaction';
export * from './error';
export * from './ui';
export * from './socket';
export * from './Report';
export * from './Stream';
export * from './Post'
// Global types
export type ID = string;
export type Timestamp = string;
export type FileUpload = File;
export type ImageUpload = File;
export type VideoUpload = File;
export type AudioUpload = File;

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
  disabled?: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  action?: () => void;
  href?: string;
  disabled?: boolean;
  separator?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}




export interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Required<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};