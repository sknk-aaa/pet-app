import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { DS } from '@/theme';

export default function AuthCallback() {
  const params = useLocalSearchParams<{ token_hash?: string; type?: string }>();

  useEffect(() => {
    const { token_hash, type } = params;
    if (token_hash && type) {
      supabase.auth
        .verifyOtp({ token_hash, type: type as 'email' })
        .then(({ error }) => {
          if (error) console.error('[AuthCallback]', error);
        })
        .finally(() => {
          router.dismissAll();
        });
    } else {
      router.dismissAll();
    }
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DS.colors.bg }}>
      <ActivityIndicator color={DS.colors.accent} />
    </View>
  );
}
