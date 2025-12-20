import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Chip,
  Divider,
  useTheme,
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigation';
import { useAuth } from '../../context/AuthContext';
import UserService from '../../services/UserService';
import type { AppTheme } from '../../theme/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { User } from '../../types/types';

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Profile'
>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const theme = useTheme<AppTheme>();
  const [profileData, setProfileData] = useState<User | null>(user);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);

  // Fetch fresh profile data from API on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsFetchingProfile(true);
    try {
      const profile = await UserService.getProfile();
      setProfileData(profile);
      setName(profile.name);
      setEmail(profile.email);
    } catch (error: any) {
      console.error('Fetch profile error:', error);
      // Fallback to context user data if API fails
      if (user) {
        setProfileData(user);
      }
    } finally {
      setIsFetchingProfile(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const updatedProfile = await UserService.updateProfile({ name, email });
      setProfileData(updatedProfile); // Update local profile state
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error('Logout error:', error);
          }
        },
      },
    ]);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Profile Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Icon
              name="account-circle"
              size={60}
              color={theme.colors.primary}
            />
          </View>

          {/* Profile Info Card */}
          <Card
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            mode="elevated"
          >
            <Card.Content>
              <View style={styles.infoRow}>
                <Text
                  variant="labelMedium"
                  style={{ color: theme.colors.secondary }}
                >
                  Mobile Number
                </Text>
                <Text
                  variant="bodyLarge"
                  style={{ color: theme.colors.onSurface, marginTop: 4 }}
                >
                  +91 {profileData?.mobileNumber}
                </Text>
              </View>

              <Divider style={{ marginVertical: 16 }} />

              <View style={styles.infoRow}>
                <Text
                  variant="labelMedium"
                  style={{ color: theme.colors.secondary }}
                >
                  Full Name
                </Text>
                {isEditing ? (
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                    textColor={theme.colors.onSurface}
                  />
                ) : (
                  <Text
                    variant="bodyLarge"
                    style={{ color: theme.colors.onSurface, marginTop: 4 }}
                  >
                    {profileData?.name}
                  </Text>
                )}
              </View>

              <Divider style={{ marginVertical: 16 }} />

              <View style={styles.infoRow}>
                <Text
                  variant="labelMedium"
                  style={{ color: theme.colors.secondary }}
                >
                  Email Address
                </Text>
                {isEditing ? (
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                    textColor={theme.colors.onSurface}
                  />
                ) : (
                  <Text
                    variant="bodyLarge"
                    style={{ color: theme.colors.onSurface, marginTop: 4 }}
                  >
                    {profileData?.email}
                  </Text>
                )}
              </View>

              {profileData?.role && (
                <>
                  <Divider style={{ marginVertical: 16 }} />
                  <View style={styles.infoRow}>
                    <Text
                      variant="labelMedium"
                      style={{ color: theme.colors.secondary }}
                    >
                      Role
                    </Text>
                    <Chip
                      mode="flat"
                      style={{
                        alignSelf: 'flex-start',
                        marginTop: 8,
                        backgroundColor: theme.colors.primaryContainer,
                      }}
                      textStyle={{ color: theme.colors.primary }}
                    >
                      {profileData.role.toUpperCase()}
                    </Chip>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          {isEditing ? (
            <View style={styles.buttonGroup}>
              <Button
                mode="outlined"
                onPress={() => {
                  setName(profileData?.name || '');
                  setEmail(profileData?.email || '');
                  setIsEditing(false);
                }}
                style={[styles.button, { flex: 1 }]}
                textColor={theme.colors.primary}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={isLoading}
                disabled={isLoading}
                style={[styles.button, { flex: 1 }]}
                buttonColor={theme.colors.primary}
              >
                Save Changes
              </Button>
            </View>
          ) : (
            <>
              <Button
                mode="contained"
                onPress={() => setIsEditing(true)}
                style={styles.button}
                buttonColor={theme.colors.primary}
                icon="pencil"
              >
                Edit Profile
              </Button>

              <Button
                mode="outlined"
                onPress={handleLogout}
                style={styles.button}
                textColor={theme.colors.error}
                icon="logout"
              >
                Logout
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 32,
  },

  card: {
    borderRadius: 16,
    marginBottom: 20,
  },
  infoRow: {
    paddingVertical: 4,
  },
  input: {
    marginTop: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    marginBottom: 12,
    borderRadius: 12,
  },
});

export default ProfileScreen;
