import ApiClient from './ApiClient';
import { API_ENDPOINTS } from '../config/config';
import { Emergency } from '../types/types';

class AdminService {
  /**
   * Get all emergencies (Admin only)
   */
  async getAllEmergencies(): Promise<Emergency[]> {
    try {
      const response = await ApiClient.get<{ emergencies: Emergency[] }>(
        API_ENDPOINTS.ADMIN_EMERGENCIES,
      );
      return response.emergencies || [];
    } catch (error) {
      console.error('Get all emergencies error:', error);
      throw error;
    }
  }
}

export default new AdminService();
