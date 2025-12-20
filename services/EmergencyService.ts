import ApiClient from './ApiClient';
import { API_ENDPOINTS } from '../config/config';
import { Emergency, LocationRequest } from '../types/types';

class EmergencyService {
  /**
   * Start emergency
   */
  async startEmergency(): Promise<Emergency> {
    try {
      const response = await ApiClient.post<{ emergency: Emergency }>(
        API_ENDPOINTS.EMERGENCY_START,
      );
      return response.emergency;
    } catch (error) {
      console.error('Start emergency error:', error);
      throw error;
    }
  }

  /**
   * Escalate emergency
   */
  async escalateEmergency(id: number): Promise<Emergency> {
    try {
      const response = await ApiClient.post<{ emergency: Emergency }>(
        API_ENDPOINTS.EMERGENCY_ESCALATE(id),
      );
      return response.emergency;
    } catch (error) {
      console.error('Escalate emergency error:', error);
      throw error;
    }
  }

  /**
   * Resolve emergency
   */
  async resolveEmergency(id: number): Promise<Emergency> {
    try {
      const response = await ApiClient.post<{ emergency: Emergency }>(
        API_ENDPOINTS.EMERGENCY_RESOLVE(id),
      );
      return response.emergency;
    } catch (error) {
      console.error('Resolve emergency error:', error);
      throw error;
    }
  }

  /**
   * Get active emergency
   */
  async getActiveEmergency(): Promise<Emergency | null> {
    try {
      const response = await ApiClient.get<{ emergency: Emergency | null }>(
        API_ENDPOINTS.EMERGENCY_ACTIVE,
      );
      return response.emergency;
    } catch (error) {
      console.error('Get active emergency error:', error);
      throw error;
    }
  }
}

export default new EmergencyService();
