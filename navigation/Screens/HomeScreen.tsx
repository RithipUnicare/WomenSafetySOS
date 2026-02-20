import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Surface,
  Button,
  Card,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../AppNavigation';
import { useAuth } from '../../context/AuthContext';
import UserService from '../../services/UserService';
import { User } from '../../types/types';
import type { AppTheme } from '../../theme/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const theme = useTheme<AppTheme>();
  const [userProfile, setUserProfile] = useState<User | null>(user);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, []),
  );

  const fetchUserProfile = async () => {
    try {
      const profile = await UserService.getProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Fallback to user from AuthContext
      setUserProfile(user);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.secondary }}
            >
              Welcome back,
            </Text>
            <Text
              variant="headlineSmall"
              style={[styles.userName, { color: theme.colors.onBackground }]}
            >
              {userProfile?.name || 'User'}
            </Text>
          </View>
          <IconButton
            icon="account-circle"
            size={32}
            iconColor={theme.colors.primary}
            containerColor={theme.colors.surface}
            onPress={() => navigation.navigate('Profile')}
          />
        </View>

        {/* Emergency SOS Card */}
        <Card
          style={[
            styles.sosCard,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
          mode="elevated"
        >
          <Card.Content style={styles.sosContent}>
            <Surface
              style={[
                styles.sosIconContainer,
                { backgroundColor: theme.colors.primary },
              ]}
              elevation={2}
            >
              <Icon name="alarm-light" size={40} color="#fff" />
            </Surface>
            <Text
              variant="headlineSmall"
              style={[styles.sosTitle, { color: theme.colors.onPrimary }]}
            >
              Emergency Alert
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.sosSubtitle, { color: theme.colors.onSecondary }]}
            >
              Tap the button below in case of emergency
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('EmergencySOS')}
              buttonColor={theme.colors.primary}
              contentStyle={styles.sosButtonContent}
              labelStyle={styles.sosButtonLabel}
              style={styles.sosButton}
            >
              ACTIVATE SOS
            </Button>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text
            variant="titleLarge"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Quick Actions
          </Text>

          <Card
            style={[
              styles.actionCard,
              { backgroundColor: theme.colors.surface },
            ]}
            mode="elevated"
            onPress={() => navigation.navigate('EmergencyContacts')}
          >
            <Card.Content style={styles.actionCardContent}>
              <Surface
                style={[
                  styles.actionIcon,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
                elevation={1}
              >
                <Icon name="contacts" size={28} color={theme.colors.primary} />
              </Surface>
              <View style={styles.actionTextContent}>
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.onSurface }}
                >
                  Emergency Contacts
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.secondary }}
                >
                  Manage your trusted contacts
                </Text>
              </View>
              <IconButton
                icon="chevron-right"
                iconColor={theme.colors.primary}
                size={24}
              />
            </Card.Content>
          </Card>

          <Card
            style={[
              styles.actionCard,
              { backgroundColor: theme.colors.surface },
            ]}
            mode="elevated"
            onPress={() => navigation.navigate('LocationHistory')}
          >
            <Card.Content style={styles.actionCardContent}>
              <Surface
                style={[
                  styles.actionIcon,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
                elevation={1}
              >
                <Icon
                  name="map-marker-radius"
                  size={28}
                  color={theme.colors.primary}
                />
              </Surface>
              <View style={styles.actionTextContent}>
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.onSurface }}
                >
                  Location History
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.secondary }}
                >
                  View your location tracking
                </Text>
              </View>
              <IconButton
                icon="chevron-right"
                iconColor={theme.colors.primary}
                size={24}
              />
            </Card.Content>
          </Card>

          {user?.role === 'admin' && (
            <Card
              style={[
                styles.actionCard,
                { backgroundColor: theme.colors.surface },
              ]}
              mode="elevated"
              onPress={() => navigation.navigate('AdminDashboard')}
            >
              <Card.Content style={styles.actionCardContent}>
                <Surface
                  style={[
                    styles.actionIcon,
                    { backgroundColor: theme.colors.primaryContainer },
                  ]}
                  elevation={1}
                >
                  <Icon
                    name="shield-account"
                    size={28}
                    color={theme.colors.primary}
                  />
                </Surface>
                <View style={styles.actionTextContent}>
                  <Text
                    variant="titleMedium"
                    style={{ color: theme.colors.onSurface }}
                  >
                    Admin Dashboard
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.secondary }}
                  >
                    Monitor all emergencies
                  </Text>
                </View>
                <IconButton
                  icon="chevron-right"
                  iconColor={theme.colors.primary}
                  size={24}
                />
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text
            variant="titleLarge"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Safety Tips
          </Text>

          <Card
            style={[styles.tipCard, { backgroundColor: theme.colors.surface }]}
            mode="outlined"
          >
            <Card.Content style={styles.tipContent}>
              <Icon
                name="lightbulb-on-outline"
                size={24}
                color={theme.colors.primary}
                style={{ marginRight: 12 }}
              />
              <Text
                variant="bodyMedium"
                style={[styles.tipText, { color: theme.colors.onSurface }]}
              >
                Keep your emergency contacts updated and inform them about this
                app
              </Text>
            </Card.Content>
          </Card>

          <Card
            style={[styles.tipCard, { backgroundColor: theme.colors.surface }]}
            mode="outlined"
          >
            <Card.Content style={styles.tipContent}>
              <Icon
                name="lightbulb-on-outline"
                size={24}
                color={theme.colors.primary}
                style={{ marginRight: 12 }}
              />
              <Text
                variant="bodyMedium"
                style={[styles.tipText, { color: theme.colors.onSurface }]}
              >
                Test the SOS feature in a safe environment to understand how it
                works
              </Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  userName: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  sosCard: {
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 20,
  },
  sosContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  sosIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  sosTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sosSubtitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  sosButton: {
    borderRadius: 12,
  },
  sosButtonContent: {
    paddingVertical: 4,
  },
  sosButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionCard: {
    marginBottom: 12,
    borderRadius: 16,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  actionTextContent: {
    flex: 1,
  },
  tipCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  tipText: {
    flex: 1,
    lineHeight: 20,
  },
});

export default HomeScreen;
