// User Types
export interface User {
  id: number;
  name: string;
  mobileNumber: string;
  email: string;
  role?: 'user' | 'admin';
}

export interface SignupRequest {
  name: string;
  mobileNumber: string;
  password: string;
  email: string;
}

export interface LoginRequest {
  mobileNumber: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  message?: string;
}

// Emergency Contact Types
export interface EmergencyContact {
  id: number;
  name: string;
  mobile: string;
  email: string;
  priority: number;
  userId?: number;
}

export interface EmergencyContactRequest {
  name: string;
  mobile: string;
  email: string;
  priority: number;
}

// Emergency Types
export interface Emergency {
  id: number;
  userId: number;
  status: 'ACTIVE' | 'ESCALATED' | 'RESOLVED';
  startTime: string;
  endTime?: string;
  location?: Location;
}

// Location Types
export interface Location {
  id?: number;
  latitude: number;
  longitude: number;
  address?: string;
  timestamp?: string;
  emergencyId?: number;
}

export interface LocationRequest {
  latitude: number;
  longitude: number;
  address?: string;
}

// Media Types
export interface Media {
  id: number;
  emergencyId: number;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
