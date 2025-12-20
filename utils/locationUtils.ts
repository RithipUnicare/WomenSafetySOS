import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Geocoder from 'react-native-geocoding';
import { GOOGLE_MAPS_API_KEY } from '../config/config';

// Initialize Geocoder with API key
Geocoder.init(GOOGLE_MAPS_API_KEY);

interface LocationResult {
  pos: Geolocation.GeoPosition;
  address: string | null;
}

/**
 * Request location permissions for iOS and Android
 */
const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    const status = await Geolocation.requestAuthorization('whenInUse');
    if (status !== 'granted') {
      Alert.alert(
        'Location Access Needed',
        'Enable location permissions for emergency services.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return false;
    }
    return true;
  }

  if (Platform.OS !== 'android') return true;

  // Android: Request runtime permissions
  const perms = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ]);

  const denied = Object.entries(perms).filter(
    ([, value]) => value === 'denied' || value === 'never_ask_again',
  );

  if (denied.length > 0) {
    Alert.alert(
      'Permissions Required',
      'Enable Location permissions in Settings for emergency services.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
    return false;
  }

  return Object.values(perms).every(p => p === 'granted');
};

/**
 * Get address from coordinates using Google Geocoding API
 */
const getAddress = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const json = await Geocoder.from(lat, lng);
    const address = json.results[0].formatted_address;
    console.log('📍 Address:', address);
    return address;
  } catch (err) {
    console.warn('Geocoding error:', err);
    return null;
  }
};

/**
 * Get current location with coordinates and address
 */
export const getLocation = async (): Promise<LocationResult | null> => {
  const ok = await requestPermissions();
  if (!ok) return null;

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      async pos => {
        const address = await getAddress(
          pos.coords.latitude,
          pos.coords.longitude,
        );
        console.log('📍 Location retrieved:', pos);
        resolve({ pos, address });
      },
      err => {
        console.error('Location error:', err.code, err.message);
        let msg = 'Unable to get location. Please check GPS settings.';

        switch (err.code) {
          case 1:
            msg = 'Location permission denied. Please enable in Settings.';
            break;
          case 2:
            msg = 'Location temporarily unavailable. Please try again.';
            break;
          case 3:
            msg = 'Location request timed out. Please try again.';
            break;
          case 4:
            msg = 'Google Play Services not available (Android).';
            break;
          default:
            msg = err.message;
        }

        Alert.alert('Location Error', msg);
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 30000,
      },
    );
  });
};

/**
 * Get current coordinates only (without address)
 */
export const getCurrentCoordinates = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  const ok = await requestPermissions();
  if (!ok) return null;

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      err => {
        console.error('Location error:', err);
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  });
};
