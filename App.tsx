/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, useColorScheme, View, Platform } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { request, requestMultiple, PERMISSIONS } from 'react-native-permissions';
import AppNavigation from './navigation/AppNavigation';
import { AuthProvider } from './context/AuthContext';
import { theme } from './theme/theme';

function App() {
  React.useEffect(() => {
    // Request permissions on mount so widget flows have them ready to go
    const requestPermissions = async () => {
      try {
        if (Platform.OS === 'android') {
          await requestMultiple([
            PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
            PERMISSIONS.ANDROID.CAMERA,
            PERMISSIONS.ANDROID.RECORD_AUDIO,
            // Depending on API level, either storage or specific media permissions
            // are requested, but react-native-permissions handles this cleanly.
          ]);
        }
      } catch (err) {
        console.warn(err);
      }
    };
    requestPermissions();
  }, []);

  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar
            barStyle="light-content"
            backgroundColor={theme.colors.background}
          />
          <AppNavigation />
        </SafeAreaProvider>
      </PaperProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <NewAppScreen
        templateFileName="App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
