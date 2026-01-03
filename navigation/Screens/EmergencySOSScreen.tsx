import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  ActivityIndicator,
  Surface,
  Chip,
  useTheme,
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Geolocation from 'react-native-geolocation-service';
import { RootStackParamList } from '../AppNavigation';
import EmergencyService from '../../services/EmergencyService';
import LocationService from '../../services/LocationService';
import { Emergency } from '../../types/types';
import type { AppTheme } from '../../theme/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getLocation } from '../../utils/locationUtils';

type EmergencySOSScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EmergencySOS'
>;

interface Props {
  navigation: EmergencySOSScreenNavigationProp;
}

const EmergencySOSScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme<AppTheme>();
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      checkActiveEmergency();
    }, []),
  );

  useEffect(() => {
    if (activeEmergency) {
      requestLocationPermission();
    }
  }, [activeEmergency]);

  const checkActiveEmergency = async () => {
    setIsLoading(true);
    try {
      const emergency = await EmergencyService.getActiveEmergency();
      setActiveEmergency(emergency);
    } catch (error) {
      console.error('Check active emergency error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'This app needs access to your location for emergency services.',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          Alert.alert(
            'Permission Denied',
            'Location permission is required for emergency services',
          );
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = async () => {
    try {
      const locationData = await getLocation();

      if (locationData) {
        const { pos, address, locationUrl } = locationData;
        const { latitude, longitude } = pos.coords;
        setCurrentLocation({ latitude, longitude });

        if (activeEmergency) {
          try {
            await LocationService.saveLocation({
              latitude,
              longitude,
              address:
                address ||
                `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
              locationUrl,
            });
          } catch (error) {
            console.error('Save location error:', error);
          }
        }
      }
    } catch (error) {
      console.error('Location error:', error);
      // Fallback: Still try to get location without address
      Geolocation.getCurrentPosition(
        async position => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });

          if (activeEmergency) {
            try {
              await LocationService.saveLocation({
                latitude,
                longitude,
                address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(
                  6,
                )}`,
                locationUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
              });
            } catch (error) {
              console.error('Save location error:', error);
            }
          }
        },
        error => {
          console.error('Geolocation error:', error);
          Alert.alert('Error', 'Failed to get current location');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    }
  };

  const handleStartEmergency = async () => {
    Alert.alert(
      'Start Emergency',
      'This will notify all your emergency contacts. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          style: 'destructive',
          onPress: async () => {
            setIsStarting(true);
            try {
              // First, try to get location and save it
              try {
                const locationData = await getLocation();
                if (locationData) {
                  const { pos, address, locationUrl } = locationData;
                  const { latitude, longitude } = pos.coords;

                  // Save location with locationUrl
                  await LocationService.saveLocation({
                    latitude,
                    longitude,
                    address: address || `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
                    locationUrl,
                  });

                  console.log('📍 Location saved with URL:', locationUrl);
                }
              } catch (locationError) {
                console.warn('Failed to get/save location, proceeding with emergency anyway:', locationError);
              }

              // Start emergency regardless of location success
              const emergency = await EmergencyService.startEmergency();
              setActiveEmergency(emergency);
              Alert.alert(
                'Emergency Started',
                'Your emergency contacts have been notified',
              );
              getCurrentLocation();
            } catch (error: any) {
              const errorMessage =
                error?.response?.data?.message || 'Failed to start emergency';
              Alert.alert('Error', errorMessage);
            } finally {
              setIsStarting(false);
            }
          },
        },
      ],
    );
  };

  const handleEscalateEmergency = async () => {
    if (!activeEmergency) return;

    Alert.alert(
      'Escalate Emergency',
      'This will send additional alerts to authorities. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Escalate',
          style: 'destructive',
          onPress: async () => {
            try {
              const emergency = await EmergencyService.escalateEmergency(
                activeEmergency.id,
              );
              setActiveEmergency(emergency);
              Alert.alert(
                'Emergency Escalated',
                'Authorities have been notified',
              );
            } catch (error: any) {
              Alert.alert('Error', 'Failed to escalate emergency');
            }
          },
        },
      ],
    );
  };

  const handleResolveEmergency = async () => {
    if (!activeEmergency) return;

    Alert.alert(
      'Resolve Emergency',
      'Are you safe now? This will end the emergency alert.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: "I'm Safe",
          onPress: async () => {
            try {
              await EmergencyService.resolveEmergency(activeEmergency.id);
              setActiveEmergency(null);
              setCurrentLocation(null);
              Alert.alert('Emergency Resolved', "Glad you're safe!");
            } catch (error: any) {
              Alert.alert('Error', 'Failed to resolve emergency');
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {!activeEmergency ? (
          <>
            <Surface
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
              elevation={4}
            >
              <Icon name="lifebuoy" size={60} color={theme.colors.primary} />
            </Surface>
            <Text
              variant="headlineMedium"
              style={[styles.title, { color: theme.colors.onBackground }]}
            >
              Emergency SOS
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.subtitle, { color: theme.colors.secondary }]}
            >
              Press the button below if you're in danger. Your location and
              emergency contacts will be notified immediately.
            </Text>

            <Button
              mode="contained"
              onPress={handleStartEmergency}
              loading={isStarting}
              disabled={isStarting}
              buttonColor={theme.colors.primary}
              contentStyle={styles.sosButtonContent}
              labelStyle={styles.sosButtonLabel}
              style={styles.sosButton}
              icon="alert"
            >
              ACTIVATE SOS
            </Button>

            <Card
              style={[
                styles.infoCard,
                { backgroundColor: theme.colors.surface },
              ]}
              mode="elevated"
            >
              <Card.Content>
                <Text
                  variant="titleMedium"
                  style={[styles.infoTitle, { color: theme.colors.onSurface }]}
                >
                  What happens when you activate?
                </Text>
                <View style={styles.infoItem}>
                  <Icon
                    name="phone-outline"
                    size={20}
                    color={theme.colors.primary}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, flex: 1 }}
                  >
                    All emergency contacts will be notified
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Icon
                    name="map-marker-outline"
                    size={20}
                    color={theme.colors.primary}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, flex: 1 }}
                  >
                    Your real-time location will be shared
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Icon
                    name="clock-outline"
                    size={20}
                    color={theme.colors.primary}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface, flex: 1 }}
                  >
                    Continuous monitoring until resolved
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </>
        ) : (
          <>
            <Surface
              style={[
                styles.iconContainer,
                styles.activeIconContainer,
                { backgroundColor: theme.colors.primary },
              ]}
              elevation={4}
            >
              <Icon name="alarm-light" size={60} color="#fff" />
            </Surface>
            <Text
              variant="headlineMedium"
              style={[styles.activeTitle, { color: theme.colors.primary }]}
            >
              EMERGENCY ACTIVE
            </Text>
            <Chip
              mode="flat"
              style={[
                styles.statusChip,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
              textStyle={{ color: theme.colors.primary, fontWeight: 'bold' }}
            >
              {activeEmergency.status}
            </Chip>

            {currentLocation && (
              <Card
                style={[
                  styles.locationCard,
                  { backgroundColor: theme.colors.surface },
                ]}
                mode="elevated"
              >
                <Card.Content>
                  <Text
                    variant="titleMedium"
                    style={[
                      styles.locationTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    Current Location
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.secondary, marginBottom: 4 }}
                  >
                    <Icon
                      name="latitude"
                      size={16}
                      color={theme.colors.secondary}
                    />{' '}
                    Lat: {currentLocation.latitude.toFixed(6)}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.secondary, marginBottom: 12 }}
                  >
                    <Icon
                      name="longitude"
                      size={16}
                      color={theme.colors.secondary}
                    />{' '}
                    Lng: {currentLocation.longitude.toFixed(6)}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={getCurrentLocation}
                    icon="refresh"
                    textColor={theme.colors.primary}
                  >
                    Update Location
                  </Button>
                </Card.Content>
              </Card>
            )}

            <View style={styles.actionButtons}>
              {activeEmergency.status === 'ACTIVE' && (
                <Button
                  mode="contained"
                  onPress={handleEscalateEmergency}
                  icon="alert-octagon"
                  buttonColor={theme.colors.warning}
                  style={styles.button}
                >
                  Escalate Emergency
                </Button>
              )}

              <Button
                mode="contained"
                onPress={handleResolveEmergency}
                icon="check-circle"
                buttonColor={theme.colors.success}
                style={styles.button}
              >
                I'm Safe - Resolve
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  activeIconContainer: {
    borderWidth: 3,
  },

  title: {
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  activeTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 2,
  },
  statusChip: {
    marginBottom: 24,
  },
  sosButton: {
    borderRadius: 60,
    marginBottom: 40,
  },
  sosButtonContent: {
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  sosButtonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  infoCard: {
    width: '100%',
    borderRadius: 16,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  locationCard: {
    width: '100%',
    marginBottom: 24,
    borderRadius: 16,
  },
  locationTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionButtons: {
    width: '100%',
  },
  button: {
    marginBottom: 12,
    borderRadius: 12,
  },
});

export default EmergencySOSScreen;
