import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  dark: false,
  colors: {
    ...MD3LightTheme.colors,
    // Primary pink color scheme
    primary: '#FF6B9D',
    primaryContainer: '#FFE5EE',
    secondary: '#FF85B3',
    secondaryContainer: '#FFF0F6',
    tertiary: '#C74375',

    // Light background colors with pink tint
    background: '#FFF5F9',
    surface: '#FFFFFF',
    surfaceVariant: '#FFF0F6',

    // Text colors
    onPrimary: '#FFFFFF',
    onSecondary: '#2D1B3D',
    onBackground: '#2D1B3D',
    onSurface: '#2D1B3D',
    onSurfaceVariant: '#5A3566',

    // Status colors
    error: '#FF5252',
    errorContainer: '#FFEBEE',
    success: '#4CAF50',
    warning: '#FF9800',

    // Other colors
    outline: '#FFB6D9',
    outlineVariant: '#FFD4E8',
    shadow: '#000000',
    backdrop: 'rgba(255, 107, 157, 0.15)',

    // Custom colors for the app
    accent: '#FF85B3',
    cardBackground: '#FFFFFF',
    inputBackground: '#FFF5F9',

    // Gradient colors (for LinearGradient usage)
    gradientStart: '#FFE5EE',
    gradientMiddle: '#FFF0F6',
    gradientEnd: '#FFF5F9',
  },
};

export type AppTheme = typeof theme;
