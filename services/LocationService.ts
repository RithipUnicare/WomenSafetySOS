import ApiClient from './ApiClient';
import { API_ENDPOINTS } from '../config/config';
import { Location, LocationRequest } from '../types/types';

class LocationService {
  /**
   * Save location
   */
  async saveLocation(data: LocationRequest): Promise<Location> {
    try {
      const response = await ApiClient.post<{ location: Location }>(
        API_ENDPOINTS.LOCATION,
        data,
      );
      return response.location;
    } catch (error) {
      console.error('Save location error:', error);
      throw error;
    }
  }

  /**
   * Get latest location
   */
  async getLatestLocation(): Promise<Location | null> {
    try {
      const response = await ApiClient.get<{ location: Location | null }>(
        API_ENDPOINTS.LOCATION_LATEST,
      );
      return response.location;
    } catch (error) {
      console.error('Get latest location error:', error);
      throw error;
    }
  }
}

export default new LocationService();
