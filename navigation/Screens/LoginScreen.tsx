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

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const theme = useTheme<AppTheme>();
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const validateForm = (): boolean => {
    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return false;
    }
    if (mobileNumber.length !== 10) {
      Alert.alert('Error', 'Mobile number must be 10 digits');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login({
        mobileNumber,
        password,
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Login failed. Please try again.';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            <Icon name="shield-check" size={48} color={theme.colors.primary} />
          </Surface>
          <Text
            variant="headlineLarge"
            style={[styles.title, { color: theme.colors.onBackground }]}
          >
            Women Safety SOS
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.subtitle, { color: theme.colors.secondary }]}
          >
            Your safety is our priority
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
          <Text
            variant="headlineSmall"
            style={[styles.formTitle, { color: theme.colors.onSurface }]}
          >
            Welcome Back
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.formSubtitle, { color: theme.colors.secondary }]}
          >
            Sign in to continue
          </Text>

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

          {/* Login Button */}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            buttonColor={theme.colors.primary}
            labelStyle={styles.buttonLabel}
            icon={() => <Icon name="login" size={20} color="#fff" />}
          >
            Sign In
          </Button>

          {/* Signup Link */}
          <View style={styles.footer}>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.secondary }}
            >
              Don't have an account?{' '}
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Signup')}
              textColor={theme.colors.primary}
              compact
            >
              Sign Up
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
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  formContainer: {
    borderRadius: 24,
    padding: 24,
  },
  formTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  formSubtitle: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
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

export default LoginScreen;
