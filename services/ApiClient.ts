import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../config/config';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add token to headers
    this.instance.interceptors.request.use(
      async config => {
        try {
          // Skip adding token for auth endpoints
          const isAuthEndpoint =
            config.url?.includes('/auth/login') ||
            config.url?.includes('/auth/signup');

          if (!isAuthEndpoint) {
            const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          }
        } catch (error) {
          console.error('Error retrieving token:', error);
        }

        if (__DEV__) {
          console.log('📤 REQUEST:', config.method?.toUpperCase(), config.url);
        }

        return config;
      },
      error => {
        return Promise.reject(error);
      },
    );

    // Response interceptor - Handle errors and token refresh
    this.instance.interceptors.response.use(
      response => {
        if (__DEV__) {
          console.log('📥 RESPONSE:', response.config.url, response.status);
        }
        return response;
      },
      async (error: AxiosError) => {
        if (__DEV__) {
          console.error('❌ ERROR:', error.config?.url, error.response?.status);
        }

        const originalRequest = error.config as any;

        // Handle 401 - Unauthorized (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Attempt to refresh token
            const AuthService = (await import('./AuthService')).default;
            const newAccessToken = await AuthService.refreshAccessToken();

            if (newAccessToken && originalRequest.headers) {
              // Update the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              // Retry the original request
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            // Token refresh failed, clear storage and redirect to login
            await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
            // Navigation will be handled by AuthContext
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  // GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  // POST request
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  // PUT request
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  // Upload file (multipart/form-data)
  async upload<T = any>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.instance.post<T>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    return response.data;
  }
}

export default new ApiClient();
