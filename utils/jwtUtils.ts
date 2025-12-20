/**
 * JWT Token utility functions
 */

interface JWTPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: any;
}

/**
 * Base64 decode helper for React Native (atob replacement)
 */
const base64Decode = (str: string): string => {
  // Replace URL-safe characters
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Use Buffer for Node.js/React Native
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  // Fallback for browsers (should not be needed in React Native)
  throw new Error('Base64 decoding not available');
};

/**
 * Decode JWT token without verification
 * @param token - JWT token string
 * @returns Decoded payload object
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    const decodedPayload = base64Decode(payload);
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 * @param token - JWT token string
 * @returns true if token is expired, false otherwise
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  // Get current time in seconds
  const currentTime = Math.floor(Date.now() / 1000);

  // Check if token is expired
  return decoded.exp < currentTime;
};

/**
 * Get time until token expires in milliseconds
 * @param token - JWT token string
 * @returns milliseconds until expiration, or 0 if expired/invalid
 */
export const getTimeUntilExpiry = (token: string): number => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const expiryTime = decoded.exp;

  if (expiryTime < currentTime) {
    return 0;
  }

  return (expiryTime - currentTime) * 1000; // Convert to milliseconds
};

/**
 * Check if token will expire within specified days
 * @param token - JWT token string
 * @param days - number of days to check
 * @returns true if token expires within the specified days
 */
export const willExpireWithinDays = (token: string, days: number): boolean => {
  const timeUntilExpiry = getTimeUntilExpiry(token);
  if (timeUntilExpiry === 0) {
    return true;
  }

  const daysInMilliseconds = days * 24 * 60 * 60 * 1000;
  return timeUntilExpiry < daysInMilliseconds;
};
