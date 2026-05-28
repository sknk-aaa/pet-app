import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/services/supabase';

import { clearPushToken } from '@/services/notifications';
import { loginRevenueCat, logoutRevenueCat } from '@/services/iap';
import { useAuthStore } from '@/store/authStore';
import type { Session } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

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

const GOOGLE_REDIRECT_URI = 'mainichipet://auth/callback';

export async function signInWithGoogle(): Promise<void> {
  const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: GOOGLE_REDIRECT_URI,
      skipBrowserRedirect: true,
    },
  });
  if (oauthError || !oauthData.url) throw oauthError ?? new Error('OAuth URL が取得できませんでした');

  const result = await WebBrowser.openAuthSessionAsync(oauthData.url, GOOGLE_REDIRECT_URI);

  if (result.type !== 'success') {
    throw new Error(`ブラウザ結果: ${result.type}`);
  }

  const resultUrl = result.url;

  // new URL() はカスタムスキームで失敗するため正規表現でパース
  const queryMatch = resultUrl.match(/\?([^#]*)/);
  const queryParams = new URLSearchParams(queryMatch?.[1] ?? '');
  const code = queryParams.get('code');

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw new Error(`exchangeCodeForSession エラー: ${error.message}`);
    if (data.user?.id) loginRevenueCat(data.user.id).catch(() => {});
    return;
  }

  const hashMatch = resultUrl.match(/#(.*)/);
  const hashParams = new URLSearchParams(hashMatch?.[1] ?? '');
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (accessToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken ?? '',
    });
    if (error) throw new Error(`setSession エラー: ${error.message}`);
    if (data.user?.id) loginRevenueCat(data.user.id).catch(() => {});
    return;
  }

  throw new Error(`URL パース失敗: ${resultUrl}`);
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
