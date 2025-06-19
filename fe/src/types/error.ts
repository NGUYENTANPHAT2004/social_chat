export interface ErrorResponse {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
  timestamp?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface FormError {
  [field: string]: string | undefined;
}