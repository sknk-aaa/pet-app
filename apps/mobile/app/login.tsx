import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signInWithPassword, signUpWithEmail, signInWithApple, signInWithGoogle } from '@/services/auth';
import { MailSentIcon } from '@/components/icons/MailSentIcon';
import { DS } from '@/theme';

type Mode = 'signin' | 'signup';

export default function Login() {
  const [mode,     setMode]     = useState<Mode>('signin');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  const isValid = email.includes('@') && password.length >= 6;

  const handleEmailSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithPassword(email.trim(), password);
        router.dismiss();
      } else {
        await signUpWithEmail(email.trim(), password);
        setSignedUp(true);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      const isInvalidCreds = msg.includes('Invalid login credentials') || msg.includes('invalid_credentials');
      Alert.alert(
        'エラー',
        mode === 'signin'
          ? (isInvalidCreds ? 'メールアドレスまたはパスワードが正しくありません' : 'ログインに失敗しました')
          : '登録に失敗しました。もう一度お試しください',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signInWithApple();
      router.dismiss();
    } catch (e) {
      console.error('[Apple Login]', e);
      Alert.alert('エラー', 'Appleログインに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signInWithGoogle();
      router.dismiss();
    } catch (e) {
      console.error('[Google Login]', e);
      Alert.alert('エラー', 'Googleログインに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.handle} />
      <View style={styles.nav}>
        <View style={{ width: 32 }} />
        <Text style={styles.navTitle}>ログイン</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={DS.colors.textMid} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {signedUp ? (
          <View style={styles.sentView}>
            <MailSentIcon size={80} color={DS.colors.accent} />
            <Text style={styles.sentTitle}>確認メールを送信しました</Text>
            <Text style={styles.sentSub}>
              {email} に届いたリンクをタップして登録を完了してください
            </Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => { setSignedUp(false); setMode('signin'); }}>
              <Text style={styles.backBtnText}>ログイン画面に戻る</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* モード切り替え */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'signin' && styles.modeBtnActive]}
                onPress={() => setMode('signin')}
              >
                <Text style={[styles.modeBtnText, mode === 'signin' && styles.modeBtnTextActive]}>
                  ログイン
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
                onPress={() => setMode('signup')}
              >
                <Text style={[styles.modeBtnText, mode === 'signup' && styles.modeBtnTextActive]}>
                  新規登録
                </Text>
              </TouchableOpacity>
            </View>

            {/* メール + パスワード */}
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="メールアドレス"
              placeholderTextColor={DS.colors.textHint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="パスワード（6文字以上）"
              placeholderTextColor={DS.colors.textHint}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
              disabled={!isValid || loading}
              onPress={handleEmailSubmit}
            >
              <Text style={styles.buttonText}>
                {mode === 'signin' ? 'ログイン' : 'アカウントを作成'}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>または</Text>
              <View style={styles.dividerLine} />
            </View>

            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.socialBtn} onPress={handleAppleLogin} disabled={loading}>
                <Ionicons name="logo-apple" size={20} color={DS.colors.text} />
                <Text style={styles.socialBtnText}>
                  {mode === 'signup' ? 'Appleで新規登録' : 'Appleでログイン'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin} disabled={loading}>
              <Text style={styles.socialBtnText}>
                {mode === 'signup' ? 'Googleで新規登録' : 'Googleでログイン'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: DS.colors.border,
    alignSelf: 'center', marginTop: 8,
  },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  navTitle: { fontSize: 17, fontWeight: '600', color: DS.colors.text },

  body: { flex: 1, paddingHorizontal: 24, paddingTop: 8, gap: 12 },

  modeToggle: {
    flexDirection: 'row',
    backgroundColor: DS.colors.border,
    borderRadius: DS.radius.pill,
    padding: 3,
    marginBottom: 4,
  },
  modeBtn: {
    flex: 1, paddingVertical: 8, borderRadius: DS.radius.pill, alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: DS.colors.card },
  modeBtnText:   { fontSize: 14, fontWeight: '500', color: DS.colors.textMid },
  modeBtnTextActive: { color: DS.colors.text, fontWeight: '600' },

  input: {
    backgroundColor: DS.colors.card,
    borderRadius: DS.radius.md,
    borderWidth: 1, borderColor: DS.colors.border,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: DS.colors.text,
  },
  button: {
    backgroundColor: DS.colors.accent,
    borderRadius: DS.radius.pill,
    paddingVertical: 16, alignItems: 'center',
    ...DS.shadow.float,
  },
  buttonDisabled: { backgroundColor: DS.colors.accentPill, shadowOpacity: 0, elevation: 0 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: DS.colors.border },
  dividerText: { fontSize: 13, color: DS.colors.textHint },

  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: DS.colors.card,
    borderRadius: DS.radius.pill, paddingVertical: 14,
    borderWidth: 1, borderColor: DS.colors.border,
  },
  socialBtnText: { fontSize: 16, fontWeight: '600', color: DS.colors.text },

  sentView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 },
  sentTitle: { fontSize: 22, fontWeight: '700', color: DS.colors.text, textAlign: 'center' },
  sentSub:   { fontSize: 14, color: DS.colors.textMid, textAlign: 'center', lineHeight: 22 },
  backBtn:   { marginTop: 8 },
  backBtnText: { fontSize: 14, color: DS.colors.accent, fontWeight: '600' },
});
