import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  dark: false,
  colors: {
    ...MD3LightTheme.colors,
    // Primary pink color scheme - much darker, richer shades
    primary: '#C2185B', // Material Pink 700 - very deep pink
    primaryContainer: '#F48FB1',
    secondary: '#E91E63', // Material Pink 500
    secondaryContainer: '#F06292',
    tertiary: '#880E4F', // Material Pink 900 - darkest

    // Background colors with deeper pink tint
    background: '#FFF0F5',
    surface: '#FFFFFF',
    surfaceVariant: '#F48FB1',

    // Text colors - darker for better contrast
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1A1A1A',
    onSurface: '#1A1A1A',
    onSurfaceVariant: '#2D2D2D',

    // Status colors - deeper tones
    error: '#B71C1C',
    errorContainer: '#FFCDD2',
    success: '#2E7D32',
    warning: '#E65100',

    // Other colors
    outline: '#EC407A',
    outlineVariant: '#F06292',
    shadow: '#000000',
    backdrop: 'rgba(194, 24, 91, 0.4)',

    // Custom colors for the app
    accent: '#E91E63',
    cardBackground: '#FFFFFF',
    inputBackground: '#FFF0F5',

    // Gradient colors (for LinearGradient usage)
    gradientStart: '#F48FB1',
    gradientMiddle: '#F8BBD0',
    gradientEnd: '#FFF0F5',
  },
};

export type AppTheme = typeof theme;
