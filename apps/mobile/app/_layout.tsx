import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="pet-setup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="photo-form"    options={{ presentation: 'modal' }} />
        <Stack.Screen name="login"         options={{ presentation: 'modal' }} />
        <Stack.Screen name="report"        options={{ presentation: 'modal' }} />
        <Stack.Screen name="pro"           options={{ presentation: 'modal' }} />
        <Stack.Screen name="pet-select"    options={{ presentation: 'modal' }} />
        <Stack.Screen name="day-detail"    />
        <Stack.Screen name="anniversaries" />
        <Stack.Screen name="settings"      />
      </Stack>
    </SafeAreaProvider>
  );
}
