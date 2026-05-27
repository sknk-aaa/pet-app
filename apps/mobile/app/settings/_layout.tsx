import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="pets" />
      <Stack.Screen name="pet-form" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="account" />
      <Stack.Screen name="featured-history" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
    </Stack>
  );
}
