import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Text, TextInput, Button, Surface, useTheme } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigation';
import { useAuth } from '../../context/AuthContext';
import type { AppTheme } from '../../theme/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type SignupScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Signup'
>;

interface Props {
  navigation: SignupScreenNavigationProp;
}

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { signup } = useAuth();
  const theme = useTheme<AppTheme>();
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return false;
    }
    if (mobileNumber.length !== 10) {
      Alert.alert('Error', 'Mobile number must be 10 digits');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signup({
        name,
        mobileNumber,
        email,
        password,
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Signup failed. Please try again.';
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 60}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Surface
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
            elevation={4}
          >
            <Icon name="shield-check" size={42} color={theme.colors.primary} />
          </Surface>
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: theme.colors.onBackground }]}
          >
            Create Account
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.subtitle, { color: theme.colors.secondary }]}
          >
            Join us in building a safer community
          </Text>
        </View>

        {/* Form */}
        <Surface
          style={[
            styles.formContainer,
            { backgroundColor: theme.colors.surface },
          ]}
          elevation={3}
        >
          {/* Name Input */}
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            left={
              <TextInput.Icon
                icon={() => (
                  <Icon name="account" size={24} color={theme.colors.primary} />
                )}
              />
            }
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
            theme={{ colors: { onSurfaceVariant: theme.colors.secondary } }}
          />

          {/* Mobile Number Input */}
          <TextInput
            label="Mobile Number"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
            maxLength={10}
            mode="outlined"
            left={
              <TextInput.Icon
                icon={() => (
                  <Icon name="phone" size={24} color={theme.colors.primary} />
                )}
              />
            }
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
            theme={{ colors: { onSurfaceVariant: theme.colors.secondary } }}
          />

          {/* Email Input */}
          <TextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            left={
              <TextInput.Icon
                icon={() => (
                  <Icon name="email" size={24} color={theme.colors.primary} />
                )}
              />
            }
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
            theme={{ colors: { onSurfaceVariant: theme.colors.secondary } }}
          />

          {/* Password Input */}
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            mode="outlined"
            left={
              <TextInput.Icon
                icon={() => (
                  <Icon name="lock" size={24} color={theme.colors.primary} />
                )}
              />
            }
            right={
              <TextInput.Icon
                icon={() => (
                  <Icon
                    name={passwordVisible ? 'eye-off' : 'eye'}
                    size={24}
                    color={theme.colors.secondary}
                  />
                )}
                onPress={() => setPasswordVisible(!passwordVisible)}
              />
            }
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
            theme={{ colors: { onSurfaceVariant: theme.colors.secondary } }}
          />

          {/* Confirm Password Input */}
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!confirmPasswordVisible}
            mode="outlined"
            left={
              <TextInput.Icon
                icon={() => (
                  <Icon
                    name="lock-check"
                    size={24}
                    color={theme.colors.primary}
                  />
                )}
              />
            }
            right={
              <TextInput.Icon
                icon={() => (
                  <Icon
                    name={confirmPasswordVisible ? 'eye-off' : 'eye'}
                    size={24}
                    color={theme.colors.secondary}
                  />
                )}
                onPress={() =>
                  setConfirmPasswordVisible(!confirmPasswordVisible)
                }
              />
            }
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
            theme={{ colors: { onSurfaceVariant: theme.colors.secondary } }}
          />

          {/* Signup Button */}
          <Button
            mode="contained"
            onPress={handleSignup}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            buttonColor={theme.colors.primary}
            labelStyle={styles.buttonLabel}
            icon={() => <Icon name="account-plus" size={20} color="#fff" />}
          >
            Create Account
          </Button>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.secondary }}
            >
              Already have an account?{' '}
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              textColor={theme.colors.primary}
              compact
            >
              Sign In
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  title: {
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  formContainer: {
    borderRadius: 24,
    padding: 24,
  },
  input: {
    marginBottom: 14,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
});

export default SignupScreen;
