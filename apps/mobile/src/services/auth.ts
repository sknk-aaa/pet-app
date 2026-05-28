import * as AppleAuthentication from 'expo-apple-authentication';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { supabase } from '@/services/supabase';
import { clearPushToken } from '@/services/notifications';
import { loginRevenueCat, logoutRevenueCat } from '@/services/iap';
import { useAuthStore } from '@/store/authStore';
import type { Session } from '@supabase/supabase-js';

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
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;
  if (data.user?.id) loginRevenueCat(data.user.id).catch(() => {});
}

export async function signInWithGoogle(): Promise<void> {
  const iosClientId = Constants.expoConfig?.extra?.googleIosClientId as string | undefined;
  GoogleSignin.configure({
    scopes: ['email', 'profile'],
    ...(iosClientId ? { iosClientId } : {}),
  });
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const userInfo = await GoogleSignin.signIn();
  const tokens = await GoogleSignin.getTokens();
  if (!tokens.idToken) {
    throw new Error('Google Sign In: idToken が取得できませんでした');
  }
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: tokens.idToken,
  });
  if (error) throw error;
  if (data.user?.id) loginRevenueCat(data.user.id).catch(() => {});
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.user?.id) loginRevenueCat(data.user.id).catch(() => {});
}

export async function signUpWithEmail(email: string, password: string): Promise<{ alreadyExists: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: 'mainichipet://auth/callback' },
  });
  if (error) throw error;
  const alreadyExists = Array.isArray(data.user?.identities) && data.user.identities.length === 0;
  return { alreadyExists };
}

export async function signOut(): Promise<void> {
  const { user } = useAuthStore.getState();
  if (user?.id) {
    await clearPushToken(user.id).catch(() => {});
  }
  await Promise.all([
    supabase.auth.signOut(),
    logoutRevenueCat().catch(() => {}),
  ]);
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
