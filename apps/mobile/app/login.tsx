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
import { signInWithEmail, signInWithApple, signInWithGoogle } from '@/services/auth';
import { DS } from '@/theme';

export default function Login() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email.includes('@') || loading) return;
    setLoading(true);
    try {
      await signInWithEmail(email.trim());
      setSent(true);
    } catch {
      Alert.alert('エラー', 'メールの送信に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signInWithApple();
      router.back();
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
      router.back();
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
        {sent ? (
          <View style={styles.sentView}>
            <Text style={styles.sentEmoji}>📬</Text>
            <Text style={styles.sentTitle}>メールを送信しました</Text>
            <Text style={styles.sentSub}>
              {email} に届いたリンクからログインしてください
            </Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => setSent(false)}>
              <Text style={styles.backBtnText}>メールアドレスを変更する</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.heading}>メールアドレスでログイン</Text>
            <Text style={styles.sub}>
              入力したアドレスにログインリンクを送ります
            </Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@mail.com"
              placeholderTextColor={DS.colors.textHint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.button, (!email.includes('@') || loading) && styles.buttonDisabled]}
              disabled={!email.includes('@') || loading}
              onPress={handleEmailLogin}
            >
              <Text style={styles.buttonText}>リンクを送る</Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.socialBtn} onPress={handleAppleLogin} disabled={loading}>
                <Ionicons name="logo-apple" size={20} color={DS.colors.text} />
                <Text style={styles.socialBtnText}>Appleでログイン</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin} disabled={loading}>
              <Text style={styles.socialBtnText}>Googleでログイン</Text>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: DS.colors.bg,
  },
  handle: {
    width:           40,
    height:           4,
    borderRadius:     2,
    backgroundColor:  DS.colors.border,
    alignSelf:        'center',
    marginTop:         8,
  },
  nav: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical:   14,
  },
  navTitle: {
    fontSize:   17,
    fontWeight: '600',
    color:      DS.colors.text,
  },
  body: {
    flex:    1,
    paddingHorizontal: 24,
    paddingTop:        24,
    gap:               16,
  },
  heading: {
    fontSize:   22,
    fontWeight: '700',
    color:      DS.colors.text,
    textAlign:  'center',
  },
  sub: {
    fontSize:   14,
    color:      DS.colors.textMid,
    textAlign:  'center',
    lineHeight: 22,
  },
  input: {
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.md,
    borderWidth:     1,
    borderColor:     DS.colors.border,
    paddingHorizontal: 16,
    paddingVertical:   14,
    fontSize:          16,
    color:             DS.colors.text,
    marginTop:         8,
  },
  button: {
    backgroundColor: DS.colors.accent,
    borderRadius:    DS.radius.pill,
    paddingVertical: 16,
    alignItems:      'center',
    ...DS.shadow.float,
  },
  buttonDisabled: {
    backgroundColor: DS.colors.accentPill,
    shadowOpacity:   0,
    elevation:       0,
  },
  buttonText: {
    color:      '#fff',
    fontSize:   17,
    fontWeight: '700',
  },
  sentView: {
    flex:        1,
    alignItems:  'center',
    justifyContent: 'center',
    gap:         16,
    paddingHorizontal: 24,
  },
  sentEmoji: { fontSize: 56 },
  sentTitle: {
    fontSize:   22,
    fontWeight: '700',
    color:      DS.colors.text,
    textAlign:  'center',
  },
  sentSub: {
    fontSize:   14,
    color:      DS.colors.textMid,
    textAlign:  'center',
    lineHeight: 22,
  },
  backBtn: {
    marginTop: 8,
  },
  backBtnText: {
    fontSize:   14,
    color:      DS.colors.accent,
    fontWeight: '600',
  },
  socialBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:              8,
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.pill,
    paddingVertical: 14,
    borderWidth:      1,
    borderColor:      DS.colors.border,
  },
  socialBtnText: {
    fontSize:   16,
    fontWeight: '600',
    color:      DS.colors.text,
  },
});
