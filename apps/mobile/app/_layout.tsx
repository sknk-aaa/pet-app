import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  ShipporiMincho_400Regular,
  ShipporiMincho_500Medium,
  ShipporiMincho_600SemiBold,
  ShipporiMincho_700Bold,
  ShipporiMincho_800ExtraBold,
} from '@expo-google-fonts/shippori-mincho';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { fetchAppUser } from '@/services/auth';
import { flushPendingUploads } from '@/services/uploadQueue';
import { useAuthStore } from '@/store/authStore';
import { useBootstrap } from '@/hooks/useBootstrap';
import type { Session } from '@supabase/supabase-js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
  },
});

function AppContent() {
  const { isReady, needsOnboarding } = useBootstrap();
  const { setSession, setUser } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      setSession(session);
      if (session?.user?.id) {
        fetchAppUser(session.user.id).then(user => {
          if (user) setUser(user);
        });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        setSession(session);
        if (session?.user?.id) {
          const user = await fetchAppUser(session.user.id);
          if (user) setUser(user);
        } else {
          setUser(null);
        }
      }
    );

    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
        flushPendingUploads().catch(() => {});
        queryClient.invalidateQueries({ queryKey: ['featured_pet_today'] });
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        flushPendingUploads().catch(() => {});
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (needsOnboarding) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  }, [isReady, needsOnboarding]);

  return (
    <>
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
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ShipporiMincho_400Regular,
    ShipporiMincho_500Medium,
    ShipporiMincho_600SemiBold,
    ShipporiMincho_700Bold,
    ShipporiMincho_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
