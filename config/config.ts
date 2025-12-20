// API Configuration
export const API_CONFIG = {
  // Update this BASE_URL with your actual backend server URL
  BASE_URL: 'https://app.undefineddevelopers.online', // Change to your server URL
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// Google Maps API Key for Geocoding
export const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE'; // Add your Google API key

export const API_ENDPOINTS = {
  // Auth
  SIGNUP: '/auth/signup',
  LOGIN: '/auth/login',
  REFRESH_TOKEN: '/auth/refresh',

  // User
  PROFILE: '/user/profile',

  // Emergency Contacts
  CONTACTS: '/contacts',
  CONTACT_BY_ID: (id: number) => `/contacts/${id}`,

  // Emergency
  EMERGENCY_START: '/emergency/start',
  EMERGENCY_ESCALATE: (id: number) => `/emergency/${id}/escalate`,
  EMERGENCY_RESOLVE: (id: number) => `/emergency/${id}/resolve`,
  EMERGENCY_ACTIVE: '/emergency/active',

  // Location
  LOCATION: '/location',
  LOCATION_LATEST: '/location/latest',

  // Media
  MEDIA: '/media',

  // Admin
  ADMIN_EMERGENCIES: '/admin/emergencies',
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@womensafety_access_token',
  REFRESH_TOKEN: '@womensafety_refresh_token',
  USER_DATA: '@womensafety_user_data',
};
