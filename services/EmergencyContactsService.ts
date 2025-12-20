import ApiClient from './ApiClient';
import { API_ENDPOINTS } from '../config/config';
import { EmergencyContact, EmergencyContactRequest } from '../types/types';

class EmergencyContactsService {
  /**
   * Get all emergency contacts
   */
  async getContacts(): Promise<EmergencyContact[]> {
    try {
      const response = await ApiClient.get<{ contacts: EmergencyContact[] }>(
        API_ENDPOINTS.CONTACTS,
      );
      return response.contacts || [];
    } catch (error) {
      console.error('Get contacts error:', error);
      throw error;
    }
  }

  /**
   * Add emergency contact
   */
  async addContact(data: EmergencyContactRequest): Promise<EmergencyContact> {
    try {
      const response = await ApiClient.post<{ contact: EmergencyContact }>(
        API_ENDPOINTS.CONTACTS,
        data,
      );
      return response.contact;
    } catch (error) {
      console.error('Add contact error:', error);
      throw error;
    }
  }

  /**
   * Delete emergency contact
   */
  async deleteContact(id: number): Promise<void> {
    try {
      await ApiClient.delete(API_ENDPOINTS.CONTACT_BY_ID(id));
    } catch (error) {
      console.error('Delete contact error:', error);
      throw error;
    }
  }
}

export default new EmergencyContactsService();
