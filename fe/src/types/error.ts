export interface ErrorResponse {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
  timestamp?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface FormError {
  [field: string]: string | undefined;
}