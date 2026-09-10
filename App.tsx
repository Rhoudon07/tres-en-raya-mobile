import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Colors } from './src/constants/colors';
import { useSettingsStore } from './src/stores/useSettingsStore';
import { useStatsStore } from './src/stores/useStatsStore';
import { AudioService } from './src/services/AudioService';

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.boardSurface,
    text: Colors.textPrimary,
    border: Colors.boardBorder,
    primary: Colors.accentCyan,
  },
};

export default function App() {
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const loadStats = useStatsStore((state) => state.loadStats);

  useEffect(() => {
    AudioService.init();
    loadSettings();
    loadStats();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <NavigationContainer theme={CustomDarkTheme}>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
