import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiClient from './ApiClient';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/config';
import { isTokenExpired } from '../utils/jwtUtils';
import {
  SignupRequest,
  LoginRequest,
  AuthResponse,
  User,
} from '../types/types';

class AuthService {
  /**
   * User signup
   */
  async signup(data: SignupRequest): Promise<AuthResponse> {
    try {
      const response = await ApiClient.post<AuthResponse>(
        API_ENDPOINTS.SIGNUP,
        data,
      );

      // Store tokens and user data
      if (response.accessToken && response.refreshToken) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.ACCESS_TOKEN,
          response.accessToken,
        );
        await AsyncStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          response.refreshToken,
        );
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER_DATA,
          JSON.stringify(response.user),
        );
      }

      return response;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  /**
   * User login
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await ApiClient.post<AuthResponse>(
        API_ENDPOINTS.LOGIN,
        data,
      );
      console.log('Login response:', response);
      // Store tokens and user data
      if (response.accessToken && response.refreshToken) {
        console.log('Storing tokens and user data');
        await AsyncStorage.setItem(
          '@womensafety_access_token',
          response.accessToken,
        );
        await AsyncStorage.setItem(
          '@womensafety_refresh_token',
          response.refreshToken,
        );
        // await AsyncStorage.setItem(
        //   '@womensafety_user_data',
        //   JSON.stringify(response.user),
        // );
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * User logout
   */
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get stored access token
   */
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Get access token error:', error);
      return null;
    }
  }

  /**
   * Get stored refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Get refresh token error:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await ApiClient.post<AuthResponse>(
        API_ENDPOINTS.REFRESH_TOKEN,
        { refreshToken },
      );

      // Store new tokens
      if (response.accessToken && response.refreshToken) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.ACCESS_TOKEN,
          response.accessToken,
        );
        await AsyncStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          response.refreshToken,
        );
        return response.accessToken;
      }

      return null;
    } catch (error) {
      console.error('Refresh token error:', error);
      // Clear tokens on refresh failure
      await this.logout();
      return null;
    }
  }

  /**
   * Get stored user data
   */
  async getUserData(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get user data error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  /**
   * Validate if the current access token is still valid (not expired)
   */
  async isTokenValid(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) {
        return false;
      }

      // Check if token is expired
      const expired = isTokenExpired(token);
      return !expired;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
}

export default new AuthService();
