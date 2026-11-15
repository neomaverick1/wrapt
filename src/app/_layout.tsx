import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SettingsProvider } from '@/state/settings';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        </Stack>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
