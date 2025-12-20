import ApiClient from './ApiClient';
import { API_ENDPOINTS } from '../config/config';
import { User } from '../types/types';

interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

class UserService {
  /**
   * Get user profile
   */
  async getProfile(): Promise<User> {
    try {
      // API returns User object directly
      const response = await ApiClient.get<User>(API_ENDPOINTS.PROFILE);
      return response;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    try {
      // API returns updated User object directly
      const response = await ApiClient.put<User>(API_ENDPOINTS.PROFILE, data);
      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
}

export default new UserService();
