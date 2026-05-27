import * as AppleAuthentication from 'expo-apple-authentication';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from '@/services/supabase';
import { clearPushToken } from '@/services/notifications';
import { useAuthStore } from '@/store/authStore';
import type { Session } from '@supabase/supabase-js';

GoogleSignin.configure({
  scopes: ['email', 'profile'],
  // webClientId は app.config.ts の extra から取得することを推奨
});

export async function signInWithApple(): Promise<void> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) {
    throw new Error('Apple Sign In: identityToken が取得できませんでした');
  }
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: credential.authorizationCode ?? undefined,
  });
  if (error) throw error;
}

export async function signInWithGoogle(): Promise<void> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const userInfo = await GoogleSignin.signIn();
  const tokens = await GoogleSignin.getTokens();
  if (!tokens.idToken) {
    throw new Error('Google Sign In: idToken が取得できませんでした');
  }
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: tokens.idToken,
  });
  if (error) throw error;
}

export async function signInWithEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: 'petdiary://auth/callback' },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { user } = useAuthStore.getState();
  if (user?.id) {
    await clearPushToken(user.id).catch(() => {}); // 失敗しても続行
  }
  await supabase.auth.signOut();
  useAuthStore.getState().setSession(null);
  useAuthStore.getState().setUser(null);
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Supabase の users テーブルから AppUser を取得
export async function fetchAppUser(userId: string) {
  const { data } = await supabase
    .from('users')
    .select('id, push_token, notification_featured_enabled')
    .eq('id', userId)
    .single();
  return data;
}
