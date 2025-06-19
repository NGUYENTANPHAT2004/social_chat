import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
  error?: string;
}
class ApiService {
  private axiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Transform backend response format to consistent frontend format
        if (response.data.access_token) {
          response.data.accessToken = response.data.access_token;
          delete response.data.access_token;
        }
        if (response.data.refresh_token) {
          response.data.refreshToken = response.data.refresh_token;
          delete response.data.refresh_token;
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.axiosInstance.request(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            this.processQueue(null, newToken);
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.axiosInstance.request(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.handleAuthError();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refreshToken,
      });

      // Handle both possible response formats from backend
      const data = response.data.data || response.data;
      const accessToken = data.access_token || data.accessToken;
      const newRefreshToken = data.refresh_token || data.refreshToken;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  private handleAuthError() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }

  // Generic API methods
  async get<T>(url: string, config?: { params?: any }): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get(url, config);
    return this.normalizeResponse(response.data);
  }

  async post<T>(url: string, data?: any, config?: { headers?: any }): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post(url, data, config);
    return this.normalizeResponse(response.data);
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put(url, data);
    return this.normalizeResponse(response.data);
  }

  async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.patch(url, data);
    return this.normalizeResponse(response.data);
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete(url);
    return this.normalizeResponse(response.data);
  }

  async upload<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return this.normalizeResponse(response.data);
  }

  private normalizeResponse<T>(data: any): ApiResponse<T> {
    // If data already has the expected structure, return as is
    if (data.data !== undefined) {
      return data;
    }
    
    // Otherwise, wrap the data
    return {
      success: true,
      data: data,
    };
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }
}

export const apiService = new ApiService();
export default apiService;