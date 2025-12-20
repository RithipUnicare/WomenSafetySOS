/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import AppNavigation from './navigation/AppNavigation';
import { AuthProvider } from './context/AuthContext';
import { theme } from './theme/theme';

function App() {
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
