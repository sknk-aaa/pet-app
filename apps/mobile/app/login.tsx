import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent,  setSent]  = useState(false);

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
              style={[styles.button, !email.includes('@') && styles.buttonDisabled]}
              disabled={!email.includes('@')}
              onPress={() => setSent(true)}
            >
              <Text style={styles.buttonText}>リンクを送る</Text>
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
});
